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
      
      // Calculate attendance stats
      const presentDays = attRecords.filter(a => ['present','late'].includes(a.status)).length;
      const absentRecordedDays = attRecords.filter(a => a.status === 'absent').length;
      const workingDays = 22;
      
      // Only deduct for RECORDED absences, not for missing attendance data
      // If employee has attendance records, use those. Otherwise assume full attendance.
      const deductibleDays = attRecords.length > 0 ? absentRecordedDays : 0;
      
      const overtimeHours = attRecords.reduce((s, a) => s + (a.overtime || 0), 0);
      const dailyRate = emp.salary / workingDays;
      const basicSalary = emp.salary;
      const overtimePay = Math.round(overtimeHours * (dailyRate / 8) * 1.5);
      const deductions = Math.round(deductibleDays * dailyRate);
      const tax = Math.round((basicSalary + overtimePay - deductions) * 0.05);
      const netSalary = Math.max(0, basicSalary + overtimePay - deductions - tax + (req.body.bonus || 0));
      
      const p = await Payroll.create({ 
        organizationId: req.organizationId, 
        employeeId: emp._id, 
        month, 
        year, 
        basicSalary, 
        workingDays, 
        presentDays, 
        absentDays: deductibleDays, 
        overtimeHours, 
        overtimePay, 
        deductions, 
        tax, 
        netSalary, 
        generatedBy: req.user.id 
      });
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
    
    // Only update allowed fields with validation
    if (req.body.bonus !== undefined) p.bonus = Math.max(0, parseFloat(req.body.bonus) || 0);
    if (req.body.deductions !== undefined) {
      const newDeductions = Math.max(0, parseFloat(req.body.deductions) || 0);
      // Prevent deductions from exceeding basicSalary + overtime + bonus
      const maxDeductions = (p.basicSalary || 0) + (p.overtimePay || 0) + (p.bonus || 0);
      p.deductions = Math.min(newDeductions, maxDeductions);
    }
    if (req.body.notes !== undefined) p.notes = req.body.notes;
    
    // Recalculate net salary with current values
    p.netSalary = Math.max(0, (p.basicSalary || 0) + (p.overtimePay || 0) + (p.bonus || 0) - (p.deductions || 0) - (p.tax || 0));
    await p.save();
    res.json({ payroll: p });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete payroll record
router.delete('/:id', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const p = await Payroll.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    if (!p) return res.status(404).json({ message: 'Payroll not found' });
    res.json({ message: 'Payroll deleted successfully', payroll: p });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete all payrolls for a specific month/year
router.delete('/batch/month', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    const result = await Payroll.deleteMany({ organizationId: req.organizationId, month: parseInt(month), year: parseInt(year) });
    res.json({ message: `Deleted ${result.deletedCount} payroll records`, deletedCount: result.deletedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
