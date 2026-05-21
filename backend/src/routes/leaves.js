const router = require('express').Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { requireOrgRole } = require('../middleware/auth');
const { emitToOrg, emitToUser } = require('../services/socket');

// Apply leave
router.post('/', async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const start = new Date(startDate); const end = new Date(endDate);
    const days = Math.ceil((end - start) / 86400000) + 1;
    const leave = await Leave.create({ organizationId: req.organizationId, employeeId: req.user.id, type, startDate: start, endDate: end, days, reason });
    await Notification.create({ organizationId: req.organizationId, title: 'Leave Request', message: `${req.employee.name} applied for ${days} day(s) ${type} leave`, type: 'leave', priority: 'important' });
    emitToOrg(req.app.get('io'), req.organizationId, 'leave_applied', { leave });
    res.status(201).json({ leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get leaves
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = { organizationId: req.organizationId };
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    if (!isManager) query.employeeId = req.user.id;
    if (status) query.status = status;
    if (type) query.type = type;
    const leaves = await Leave.find(query).populate('employeeId', 'name avatar department designation').sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Convenience approve/reject shortcuts
router.put('/:id/approve', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, { status: 'approved', approvedBy: req.user.id, approvedAt: new Date(), rejectionReason: req.body.remarks }, { new: true }).populate('employeeId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    const emp = await Employee.findById(leave.employeeId._id);
    if (emp && emp.leaveBalance[leave.type] !== undefined) { emp.leaveBalance[leave.type] = Math.max(0, emp.leaveBalance[leave.type] - leave.days); await emp.save(); }
    await Notification.create({ organizationId: req.organizationId, recipientId: leave.employeeId._id, title: 'Leave Approved', message: `Your leave request has been approved`, type: 'leave' });
    emitToUser(req.app.get('io'), leave.employeeId._id, 'notification', { title: 'Leave Approved' });
    res.json({ leave, message: 'Leave approved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/reject', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, { status: 'rejected', approvedBy: req.user.id, approvedAt: new Date(), rejectionReason: req.body.remarks }, { new: true }).populate('employeeId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    await Notification.create({ organizationId: req.organizationId, recipientId: leave.employeeId._id, title: 'Leave Rejected', message: `Your leave request has been rejected`, type: 'leave' });
    emitToUser(req.app.get('io'), leave.employeeId._id, 'notification', { title: 'Leave Rejected' });
    res.json({ leave, message: 'Leave rejected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI recommendation for a leave
router.get('/:id/ai-recommend', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, organizationId: req.organizationId }).populate('employeeId', 'name department performanceScore');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    const { chatAssistant } = require('../services/groq');
    const prompt = `An employee "${leave.employeeId?.name}" from ${leave.employeeId?.department} applied for ${leave.type} leave from ${leave.startDate} to ${leave.endDate} (${leave.days} days). Reason: "${leave.reason}". Performance score: ${leave.employeeId?.performanceScore || 'N/A'}/100. Should this leave be approved or rejected? Give a brief recommendation.`;
    const recommendation = await chatAssistant([{ role: 'user', content: prompt }], {});
    res.json({ recommendation, leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Approve/reject
router.put('/:id/status', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, { status, approvedBy: req.user.id, approvedAt: new Date(), rejectionReason }, { new: true }).populate('employeeId');
    if (status === 'approved') {
      const emp = await Employee.findById(leave.employeeId);
      if (emp && emp.leaveBalance[leave.type] !== undefined) {
        emp.leaveBalance[leave.type] = Math.max(0, emp.leaveBalance[leave.type] - leave.days);
        await emp.save();
      }
    }
    await Notification.create({ organizationId: req.organizationId, recipientId: leave.employeeId._id, title: `Leave ${status}`, message: `Your leave request has been ${status}`, type: 'leave' });
    emitToUser(req.app.get('io'), leave.employeeId._id, 'notification', { title: `Leave ${status}` });
    res.json({ leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
