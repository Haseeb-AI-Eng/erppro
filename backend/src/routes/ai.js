const router = require('express').Router();
const { chatAssistant, generateTaskSuggestion, analyzePerformance, generatePayrollInsight, generateEmail, summarizeDocument, calculateHealthScore } = require('../services/groq');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Payroll = require('../models/Payroll');
const Organization = require('../models/Organization');

// AI Chat (supports both single message and messages array)
router.post('/chat', async (req, res) => {
  try {
    const { message, messages, context } = req.body;
    const org = await Organization.findById(req.organizationId);
    let msgs = messages;
    if (message) msgs = [{ role: 'user', content: context ? `${context}\n\nQuestion: ${message}` : message }];
    const response = await chatAssistant(msgs || [], { orgName: org?.name });
    res.json({ response, reply: response });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Task suggestion
router.post('/task-suggest', async (req, res) => {
  try {
    const suggestion = await generateTaskSuggestion(req.body.context);
    res.json({ suggestion });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Employee performance analysis
router.post('/analyze-performance/:employeeId', async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.employeeId, organizationId: req.organizationId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    const now = new Date();
    const month = now.getMonth() + 1; const year = now.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;
    const attendance = await Attendance.find({ organizationId: req.organizationId, employeeId: emp._id, date: { $regex: `^${dateStr}` } });
    const tasks = await Task.find({ organizationId: req.organizationId, assignedTo: emp._id }).limit(20);
    const data = { name: emp.name, designation: emp.designation, attendance: { total: attendance.length, late: attendance.filter(a => a.isLate).length, present: attendance.filter(a => a.status !== 'absent').length }, tasks: { total: tasks.length, completed: tasks.filter(t => t.status === 'completed').length, pending: tasks.filter(t => t.status === 'pending').length }, performanceScore: emp.performanceScore };
    const insight = await analyzePerformance(data);
    res.json({ insight, data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Payroll insight
router.post('/payroll-insight', async (req, res) => {
  try {
    const { month, year } = req.body;
    const payrolls = await Payroll.find({ organizationId: req.organizationId, month, year }).populate('employeeId', 'name department');
    const insight = await generatePayrollInsight({ payrolls: payrolls.map(p => ({ name: p.employeeId?.name, department: p.employeeId?.department, net: p.netSalary, deductions: p.deductions, overtime: p.overtimePay })) });
    res.json({ insight });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Generate email
router.post('/generate-email', async (req, res) => {
  try {
    const email = await generateEmail(req.body.type, req.body.context);
    res.json({ email });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Summarize document text
router.post('/summarize', async (req, res) => {
  try {
    const summary = await summarizeDocument(req.body.text);
    res.json({ summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Analyze attendance (AI summary of this month)
router.post('/analyze-attendance', async (req, res) => {
  try {
    const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;
    const records = await Attendance.find({ organizationId: req.organizationId, date: { $regex: `^${dateStr}` } });
    const totalEmp = await Employee.countDocuments({ organizationId: req.organizationId, status: 'active' });
    const prompt = `Analyze this attendance data for an organization with ${totalEmp} active employees in ${new Date(year, month-1).toLocaleString('default', {month:'long', year:'numeric'})}: Total records: ${records.length}, Present: ${records.filter(r=>r.status==='present').length}, Late: ${records.filter(r=>r.status==='late').length}, Absent: ${records.filter(r=>r.status==='absent').length}. Provide a 2-3 sentence insight and one actionable recommendation.`;
    const { chat } = require('../services/groq');
    const insight = await require('../services/groq').analyzePerformance({ attendance: { total: records.length, late: records.filter(r=>r.isLate).length, present: records.filter(r=>r.status!=='absent').length }, totalEmployees: totalEmp });
    res.json({ insight, stats: { total: records.length, present: records.filter(r=>r.status==='present').length, late: records.filter(r=>r.status==='late').length, absent: records.filter(r=>r.status==='absent').length } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Summarize tasks (AI)
router.post('/summarize-tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ organizationId: req.organizationId }).limit(50);
    const summary = { total: tasks.length, completed: tasks.filter(t=>t.status==='completed').length, pending: tasks.filter(t=>t.status==='pending').length, overdue: tasks.filter(t=>t.status!=='completed'&&new Date(t.dueDate)<new Date()).length };
    const { chatAssistant } = require('../services/groq');
    const insight = await chatAssistant([{ role: 'user', content: `Summarize this task overview in 2 sentences and give one recommendation: ${JSON.stringify(summary)}` }], {});
    res.json({ insight, summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI leave recommendation
router.get('/leave-recommendation/:leaveId', async (req, res) => {
  try {
    const Leave = require('../models/Leave');
    const leave = await Leave.findOne({ _id: req.params.leaveId, organizationId: req.organizationId }).populate('employeeId', 'name department performanceScore');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    const { chatAssistant } = require('../services/groq');
    const prompt = `An employee "${leave.employeeId?.name}" from ${leave.employeeId?.department} department applied for ${leave.type} leave from ${leave.startDate} to ${leave.endDate} (${leave.days} days). Reason: "${leave.reason}". Performance score: ${leave.employeeId?.performanceScore || 'N/A'}. Should this be approved or rejected? Give a brief recommendation.`;
    const recommendation = await chatAssistant([{ role: 'user', content: prompt }], {});
    res.json({ recommendation, leave });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Generate general insights
router.post('/generate-insights', async (req, res) => {
  try {
    const { type, data } = req.body;
    const { chatAssistant } = require('../services/groq');
    const insight = await chatAssistant([{ role: 'user', content: `Generate a brief insight for this ${type} data: ${JSON.stringify(data)}` }], {});
    res.json({ insight });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Organization health score
router.get('/health-score', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; const year = now.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;
    const totalEmp = await Employee.countDocuments({ organizationId: req.organizationId, status: 'active' });
    const attRecords = await Attendance.find({ organizationId: req.organizationId, date: { $regex: `^${dateStr}` } });
    const tasks = await Task.find({ organizationId: req.organizationId });
    const payrolls = await Payroll.find({ organizationId: req.organizationId, month, year });
    const data = { totalEmployees: totalEmp, attendanceRate: attRecords.length ? Math.round(attRecords.filter(a => a.status !== 'absent').length / attRecords.length * 100) : 100, taskCompletionRate: tasks.length ? Math.round(tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 100, payrollConsistency: payrolls.length ? Math.round(payrolls.filter(p => p.status === 'paid').length / payrolls.length * 100) : 0 };
    const result = await calculateHealthScore(data);
    await Organization.findByIdAndUpdate(req.organizationId, { healthScore: result.score });
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
