const router = require('express').Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { emitToOrg, emitToUser } = require('../services/socket');
const { requireOrgRole } = require('../middleware/auth');

// Get tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, assignedTo, department, search } = req.query;
    const query = { organizationId: req.organizationId };
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    if (!isManager) query.assignedTo = req.user.id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (department) query.department = department;
    if (search) query.title = new RegExp(search, 'i');
    const tasks = await Task.find(query).populate('assignedTo', 'name avatar').populate('assignedBy', 'name').sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizationId: req.organizationId })
      .populate('assignedTo', 'name avatar email').populate('assignedBy', 'name').populate('comments.author', 'name avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(emp => emp._id ? emp._id.toString() === req.user.id : emp.toString() === req.user.id);
    if (!isManager && !isAssigned) {
      return res.status(403).json({ message: 'Access denied to this task' });
    }
    res.json({ task });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create task
router.post('/', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, organizationId: req.organizationId, assignedBy: req.user.id, activity: [{ action: 'Task created', by: req.user.id }] });
    const io = req.app.get('io');
    if (task.assignedTo?.length) {
      for (const empId of task.assignedTo) {
        await Notification.create({ organizationId: req.organizationId, recipientId: empId, senderId: req.user.id, title: 'New Task Assigned', message: `You have been assigned: ${task.title}`, type: 'task', priority: task.priority === 'critical' ? 'critical' : 'important', link: `/tasks/${task._id}` });
        emitToUser(io, empId, 'notification', { title: 'New Task', message: task.title });
      }
    }
    emitToOrg(io, req.organizationId, 'task_created', { task });
    res.status(201).json({ task });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(emp => emp.toString() === req.user.id);
    if (!isManager && !isAssigned) {
      return res.status(403).json({ message: 'Access denied to update this task' });
    }
    const prevStatus = task.status;
    Object.assign(task, req.body);
    if (req.body.status && req.body.status !== prevStatus) {
      task.activity.push({ action: `Status changed to ${req.body.status}`, by: req.user.id });
      if (req.body.status === 'completed') task.completedAt = new Date();
    }
    await task.save();
    emitToOrg(req.app.get('io'), req.organizationId, 'task_updated', { task });
    res.json({ task });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(emp => emp.toString() === req.user.id);
    if (!isManager && !isAssigned) {
      return res.status(403).json({ message: 'Access denied to comment on this task' });
    }
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { $push: { comments: { author: req.user.id, text: req.body.text } } },
      { new: true }
    ).populate('comments.author', 'name avatar');
    emitToOrg(req.app.get('io'), req.organizationId, 'task_comment', { taskId: req.params.id });
    res.json({ task: updatedTask });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete task
router.delete('/:id', requireOrgRole('org_owner', 'hr_manager', 'team_lead'), async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI Prioritize tasks
router.post('/ai-prioritize', async (req, res) => {
  try {
    const tasks = await Task.find({ organizationId: req.organizationId, status: { $in: ['pending', 'in_progress'] } }).limit(30);
    const { chatAssistant } = require('../services/groq');
    const taskList = tasks.map(t => ({ id: t._id, title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status }));
    const insight = await chatAssistant([{ role: 'user', content: `Analyze these tasks and suggest priorities. Tasks: ${JSON.stringify(taskList)}. Reply with a 2-3 sentence prioritization strategy.` }], {});
    res.json({ insight, taskCount: tasks.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Kanban board
router.get('/meta/kanban', async (req, res) => {
  try {
    const statuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'];
    const isManager = ['org_owner', 'hr_manager', 'team_lead'].includes(req.user.role);
    const baseQuery = { organizationId: req.organizationId };
    if (!isManager) baseQuery.assignedTo = req.user.id;
    const board = {};
    for (const s of statuses) {
      board[s] = await Task.find({ ...baseQuery, status: s }).populate('assignedTo', 'name avatar').limit(20);
    }
    res.json({ board });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
