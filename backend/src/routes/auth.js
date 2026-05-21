const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const SuperAdmin = require('../models/SuperAdmin');
const { authenticateToken, requireOrgRole } = require('../middleware/auth');
const { sendWelcomeEmail, sendOrgSignupEmail, sendAdminOrgAlert } = require('../utils/email');

const signToken   = (payload) => jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: '7d'  });
const signRefresh = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET,  { expiresIn: '30d' });

// ─── Super Admin Login ────────────────────────────────────────────────────────
router.post('/super-admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const admin = await SuperAdmin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: admin._id, role: 'super_admin', email: admin.email };
    res.json({
      token:        signToken(payload),
      refreshToken: signRefresh(payload),
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'super_admin' }
    });
  } catch (err) {
    console.error('Super admin login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── Organization Register ────────────────────────────────────────────────────
router.post('/org/register', async (req, res) => {
  try {
    const { name, email, password, industry, size, phone, ownerName } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Invalid email address format' });

    const cleanEmail = email.toLowerCase().trim();

    // Check org email duplicate
    const existing = await Organization.findOne({ email: cleanEmail });
    if (existing)
      return res.status(400).json({ message: 'Organization email already registered' });

    // Create organization — pre('save') hook generates the code
    const org = await Organization.create({
      name: name.trim(),
      email: cleanEmail,
      industry,
      size,
      phone
    });

    // Create owner employee — pre('save') hook handles employeeId + password hashing
    const owner = new Employee({
      organizationId: org._id,
      name:        ownerName?.trim() || name.trim(),
      email:       cleanEmail,
      password,
      role:        'org_owner',
      department:  'Management',
      designation: 'Owner'
    });
    await owner.save();

    // Send emails — non-blocking
    try {
      await sendOrgSignupEmail(org, owner.name);
      await sendAdminOrgAlert(org);
    } catch (emailErr) {
      console.warn('Signup email failed:', emailErr.message || emailErr);
    }

    const payload = { id: owner._id, role: owner.role, organizationId: org._id, email: owner.email };
    res.status(201).json({
      token:        signToken(payload),
      refreshToken: signRefresh(payload),
      user: {
        id:             owner._id,
        name:           owner.name,
        email:          owner.email,
        role:           owner.role,
        organizationId: org._id,
        organization:   org
      }
    });
  } catch (err) {
    console.error('Org register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `An organization with this ${field} already exists` });
    }
    res.status(500).json({ message: err.message });
  }
});

// ─── Employee / Owner Login ───────────────────────────────────────────────────
// Supports three login scenarios:
//   1. Email + password + companyCode  → scoped to that org (most secure)
//   2. Email + password only           → finds employee across all orgs (single match expected)
//   3. 401 with clear message if not found or password wrong
router.post('/login', async (req, res) => {
  try {
    const { email, password, companyCode } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const cleanEmail = email.toLowerCase().trim();
    let emp = null;

    if (companyCode && companyCode.trim()) {
      // ── Scenario 1: company code provided — scope query to that org ──
      const org = await Organization.findOne({ code: companyCode.toUpperCase().trim() });
      if (!org)
        return res.status(401).json({ message: 'Invalid company code' });

      emp = await Employee.findOne({ email: cleanEmail, organizationId: org._id })
        .populate('organizationId');
    } else {
      // ── Scenario 2: no company code — find by email alone ──
      // If the same email exists in multiple orgs this returns the first match.
      // Employees should use companyCode to disambiguate.
      emp = await Employee.findOne({ email: cleanEmail })
        .populate('organizationId');
    }

    // Validate employee exists and password matches
    if (!emp)
      return res.status(401).json({ message: 'Invalid credentials' });

    const passwordMatch = await emp.comparePassword(password);
    if (!passwordMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Account status checks
    if (emp.status === 'inactive')
      return res.status(403).json({ message: 'Account inactive. Contact HR.' });

    const org = emp.organizationId;
    if (!org)
      return res.status(403).json({ message: 'Organization not found' });

    if (org.status === 'suspended')
      return res.status(403).json({ message: 'Organization suspended. Contact support.' });

    // Record login history (non-blocking)
    emp.loginHistory.push({ ip: req.ip, device: req.headers['user-agent'], timestamp: new Date() });
    emp.isOnline = true;
    emp.lastSeen = new Date();
    await emp.save();

    const payload = { id: emp._id, role: emp.role, organizationId: org._id, email: emp.email };
    res.json({
      token:        signToken(payload),
      refreshToken: signRefresh(payload),
      user: {
        id:             emp._id,
        name:           emp.name,
        email:          emp.email,
        role:           emp.role,
        avatar:         emp.avatar,
        organizationId: org._id,
        organization: {
          id:   org._id,
          name: org.name,
          code: org.code,
          logo: org.logo
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const payload = {
      id:             decoded.id,
      role:           decoded.role,
      organizationId: decoded.organizationId,
      email:          decoded.email
    };
    res.json({ token: signToken(payload) });
  } catch {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});

// ─── Add Employee (Org Owner / HR Manager only) ───────────────────────────────
router.post('/add-employee', authenticateToken, requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const { name, email, department, designation, phone } = req.body;

    if (!name || !email)
      return res.status(400).json({ message: 'Name and email are required' });

    const cleanEmail = email.toLowerCase().trim();

    const existing = await Employee.findOne({ email: cleanEmail, organizationId: req.organizationId });
    if (existing)
      return res.status(400).json({ message: 'Email already registered in this organization' });

    // Generate a temporary password (6-digit)
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // pre('save') hook handles employeeId assignment and password hashing
    const emp = new Employee({
      organizationId: req.organizationId,
      name:        name.trim(),
      email:       cleanEmail,
      password:    rawPassword,
      department,
      designation,
      phone,
      role:        'employee'
    });
    await emp.save();

    // Send welcome email with temp password
    const org = await Organization.findById(req.organizationId);
    try {
      await sendWelcomeEmail(emp, org?.name || 'Your Company', rawPassword);
    } catch (emailErr) {
      console.warn('Welcome email failed:', emailErr.message || emailErr);
    }

    res.status(201).json({
      employee: emp,
      message:  'Employee added and welcome email sent'
    });
  } catch (err) {
    console.error('Add employee error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── Get Current User ─────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      return res.json({
        user: { id: req.admin._id, name: req.admin.name, email: req.admin.email, role: 'super_admin' }
      });
    }

    const emp = await Employee.findById(req.user.id)
      .populate('organizationId')
      .select('-password -loginHistory');

    if (!emp) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { ...emp.toObject(), organization: emp.organizationId } });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;