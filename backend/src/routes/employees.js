const router = require('express').Router();
const Employee = require('../models/Employee');
const { requireOrgRole } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');
const { emitToOrg } = require('../services/socket');

// Get all employees in org
router.get('/', async (req, res) => {
  try {
    const { department, status, role, search } = req.query;
    const query = { organizationId: req.organizationId };
    if (department) query.department = department;
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { employeeId: new RegExp(search, 'i') }];
    const employees = await Employee.find(query).select('-password -loginHistory').sort({ createdAt: -1 });
    res.json({ employees });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Departments list
router.get('/meta/departments', async (req, res) => {
  try {
    const depts = await Employee.distinct('department', { organizationId: req.organizationId });
    res.json({ departments: depts.filter(Boolean) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update own profile
router.put('/profile/me', async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'avatar', 'skills'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.newPassword && req.body.currentPassword) {
      const emp = await Employee.findById(req.user.id);
      if (!(await emp.comparePassword(req.body.currentPassword))) return res.status(400).json({ message: 'Wrong current password' });
      updates.password = req.body.newPassword;
    }
    const emp = await Employee.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, organizationId: req.organizationId }).select('-password');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create employee (HR/Owner)
router.post('/', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const { name, email, department, designation, salary } = req.body;
    const existing = await Employee.findOne({ email, organizationId: req.organizationId });
    if (existing) return res.status(400).json({ message: 'Employee with this email already exists' });
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const emp = await Employee.create({ name, email, department, designation, salary, organizationId: req.organizationId, password: rawPassword, role: 'employee' });
    const Organization = require('../models/Organization');
    const org = await Organization.findById(req.organizationId);
    await sendWelcomeEmail(emp, org?.name || 'ShineERP', rawPassword);
    const io = req.app.get('io');
    emitToOrg(io, req.organizationId, 'employee_added', { employee: emp });
    res.status(201).json({ employee: { ...emp.toObject(), password: undefined } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update employee
router.put('/:id', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    delete req.body.password;
    const emp = await Employee.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true }).select('-password');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: emp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete employee
router.delete('/:id', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    await Employee.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    res.json({ message: 'Employee removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
