const router = require('express').Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { requireOrgRole } = require('../middleware/auth');
const { sendPayslipEmail } = require('../utils/email');
const { emitToUser } = require('../services/socket');

// Generate payroll for a month
router.post('/generate', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const employees = await Employee.find({ organizationId: req.organizationId, status: 'active' });
    const payrolls = [];
    for (const emp of employees) {
      const existing = await Payroll.findOne({ organizationId: req.organizationId, employeeId: emp._id, month, year });
      if (existing) continue;
      const dateStr = `${year}-${String(month).padStart(2,'0')}`;
      const attRecords = await Attendance.find({ organizationId: req.organizationId, employeeId: emp._id, date: { $regex: `^${dateStr}` } });
      const presentDays = attRecords.filter(a => ['present','late'].includes(a.status)).length;
      const workingDays = 22;
      const overtimeHours = attRecords.reduce((s, a) => s + (a.overtime || 0), 0);
      const dailyRate = emp.salary / workingDays;
      const basicSalary = emp.salary;
      const overtimePay = Math.round(overtimeHours * (dailyRate / 8) * 1.5);
      const absentDays = Math.max(0, workingDays - presentDays);
      const deductions = Math.round(absentDays * dailyRate);
      const tax = Math.round((basicSalary + overtimePay - deductions) * 0.05);
      const netSalary = Math.max(0, basicSalary + overtimePay - deductions - tax + (req.body.bonus || 0));
      const p = await Payroll.create({ organizationId: req.organizationId, employeeId: emp._id, month, year, basicSalary, workingDays, presentDays, absentDays, overtimeHours, overtimePay, deductions, tax, netSalary, generatedBy: req.user.id });
      payrolls.push(p);
    }
    res.json({ payrolls, generated: payrolls.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all payroll records
router.get('/', async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    const query = { organizationId: req.organizationId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    const isManager = ['org_owner', 'hr_manager'].includes(req.user.role);
    if (!isManager) query.employeeId = req.user.id;
    else if (employeeId) query.employeeId = employeeId;
    const payrolls = await Payroll.find(query).populate('employeeId', 'name employeeId department designation').sort({ year: -1, month: -1 });
    res.json({ payrolls });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Approve / mark paid
router.put('/:id/status', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const p = await Payroll.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, { status, approvedBy: req.user.id, paidAt: status === 'paid' ? new Date() : undefined }, { new: true }).populate('employeeId');
    if (status === 'paid') {
      await sendPayslipEmail(p.employeeId, p);
      await Notification.create({ organizationId: req.organizationId, recipientId: p.employeeId._id, title: 'Salary Paid', message: `Your salary of ${p.netSalary} has been paid`, type: 'payroll', priority: 'important' });
      emitToUser(req.app.get('io'), p.employeeId._id, 'notification', { title: 'Salary Paid', message: `Net: ${p.netSalary}` });
    }
    res.json({ payroll: p });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI Payroll insights
router.get('/ai-insights', async (req, res) => {
  try {
    const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear();
    const payrolls = await Payroll.find({ organizationId: req.organizationId, month, year }).populate('employeeId', 'name department');
    const { generatePayrollInsight } = require('../services/groq');
    const insight = await generatePayrollInsight({ payrolls: payrolls.map(p => ({ name: p.employeeId?.name, department: p.employeeId?.department, net: p.netSalary, status: p.status })), total: payrolls.reduce((s,p)=>s+p.netSalary,0), paid: payrolls.filter(p=>p.status==='paid').length });
    res.json({ insight, stats: { total: payrolls.length, paid: payrolls.filter(p=>p.status==='paid').length, pending: payrolls.filter(p=>p.status==='pending').length, totalAmount: payrolls.reduce((s,p)=>s+p.netSalary,0) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Employee payslips
router.get('/my-payslips', async (req, res) => {
  try {
    const payslips = await Payroll.find({ organizationId: req.organizationId, employeeId: req.user.id }).sort({ year: -1, month: -1 }).limit(12);
    res.json({ payslips });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update payroll (bonus/deductions)
router.put('/:id', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const p = await Payroll.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!p) return res.status(404).json({ message: 'Not found' });
    Object.assign(p, req.body);
    p.netSalary = Math.max(0, p.basicSalary + p.overtimePay + p.bonus - p.deductions - p.tax);
    await p.save();
    res.json({ payroll: p });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
