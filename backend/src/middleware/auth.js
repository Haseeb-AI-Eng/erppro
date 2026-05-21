const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const SuperAdmin = require('../models/SuperAdmin');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (decoded.role === 'super_admin') {
      const admin = await SuperAdmin.findById(decoded.id);
      if (!admin || !admin.isActive) return res.status(401).json({ message: 'Invalid token' });
      req.admin = admin;
    } else {
      const employee = await Employee.findById(decoded.id).populate('organizationId');
      if (!employee || employee.status === 'inactive') return res.status(401).json({ message: 'Account inactive' });
      req.employee = employee;
      req.organizationId = employee.organizationId._id;
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

const requireOrgRole = (...roles) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticateToken, requireRole, requireOrgRole };
