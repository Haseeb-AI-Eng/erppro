const router = require('express').Router();
const Organization = require('../models/Organization');
const Employee = require('../models/Employee');
const { requireRole } = require('../middleware/auth');

router.use(requireRole('super_admin'));

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.name = new RegExp(search, 'i');
    const orgs = await Organization.find(query).sort({ createdAt: -1 });
    const result = await Promise.all(orgs.map(async org => ({
      ...org.toObject(),
      employeeCount: await Employee.countDocuments({ organizationId: org._id })
    })));
    res.json({ organizations: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update org status
router.put('/organizations/:id/status', async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ organization: org });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Platform stats (mobile-friendly flat format)
router.get('/stats', async (req, res) => {
  try {
    const Task = require('../models/Task'); const Leave = require('../models/Leave');
    const Attendance = require('../models/Attendance'); const Payroll = require('../models/Payroll');
    const now = new Date(); const today = now.toISOString().split('T')[0];
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalOrganizations, activeOrganizations, totalEmployees, totalTasks, completedTasks, totalLeaves, pendingLeaves, totalAttendance, totalPayrolls, newOrgsThisMonth] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      Employee.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Leave.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments(),
      Payroll.countDocuments(),
      Organization.countDocuments({ createdAt: { $gte: thisMonth } }),
    ]);
    const activeToday = await Attendance.countDocuments({ date: today });
    res.json({ totalOrganizations, activeOrganizations, totalEmployees, totalTasks, completedTasks, totalLeaves, pendingLeaves, totalAttendance, totalPayrolls, newOrgsThisMonth, activeToday });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Suspend organization
router.put('/organizations/:id/suspend', async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json({ organization: org, message: 'Organization suspended' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Activate organization
router.put('/organizations/:id/activate', async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json({ organization: org, message: 'Organization activated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Email organization
router.post('/organizations/:id/email', async (req, res) => {
  try {
    const { subject, message } = req.body;
    const employees = await Employee.find({ organizationId: req.params.id, status: 'active' }).select('email name');
    const { sendEmail } = require('../utils/email');
    await Promise.all(employees.map(emp => sendEmail({ to: emp.email, subject, html: `<p>Dear ${emp.name},</p><p>${message}</p>` })));
    res.json({ message: `Email sent to ${employees.length} employees` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get org details
router.get('/organizations/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    const employees = await Employee.find({ organizationId: req.params.id }).select('-password').limit(20);
    res.json({ organization: org, employees });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
