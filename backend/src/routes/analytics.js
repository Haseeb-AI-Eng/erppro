const router = require('express').Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; const year = now.getFullYear();
    const today = now.toISOString().split('T')[0];
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;

    const [totalEmp, activeEmp, todayAtt, pendingTasks, overdueTasks, monthPayroll, pendingLeaves] = await Promise.all([
      Employee.countDocuments({ organizationId: req.organizationId }),
      Employee.countDocuments({ organizationId: req.organizationId, status: 'active' }),
      Attendance.find({ organizationId: req.organizationId, date: today }).populate('employeeId', 'name avatar'),
      Task.countDocuments({ organizationId: req.organizationId, status: 'pending' }),
      Task.countDocuments({ organizationId: req.organizationId, status: { $in: ['pending', 'in_progress'] }, dueDate: { $lt: now } }),
      Payroll.find({ organizationId: req.organizationId, month, year }),
      Leave.countDocuments({ organizationId: req.organizationId, status: 'pending' })
    ]);

    const present = todayAtt.filter(a => ['present','late'].includes(a.status)).length;
    const totalPayroll = monthPayroll.reduce((s, p) => s + p.netSalary, 0);
    const paidPayroll = monthPayroll.filter(p => p.status === 'paid').reduce((s, p) => s + p.netSalary, 0);

    // Last 7 days attendance trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = await Attendance.countDocuments({ organizationId: req.organizationId, date: ds, status: { $ne: 'absent' } });
      trend.push({ date: ds, present: count });
    }

    // Task status distribution
    const taskStats = await Task.aggregate([{ $match: { organizationId: req.organizationId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

    res.json({
      stats: { totalEmployees: totalEmp, activeEmployees: activeEmp, presentToday: present, absentToday: activeEmp - present, pendingTasks, overdueTasks, pendingLeaves, totalPayroll, paidPayroll, pendingPayroll: totalPayroll - paidPayroll },
      attendanceTrend: trend,
      taskDistribution: taskStats,
      recentAttendance: todayAtt.slice(0, 10)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Department analytics
router.get('/departments', async (req, res) => {
  try {
    const depts = await Employee.aggregate([
      { $match: { organizationId: req.organizationId } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ departments: depts });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Employee performance leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const employees = await Employee.find({ organizationId: req.organizationId, status: 'active' }).select('name avatar department performanceScore').sort({ performanceScore: -1 }).limit(10);
    res.json({ leaderboard: employees });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI insights for super admin
router.get('/ai-insights', async (req, res) => {
  try {
    const { chatAssistant } = require('../services/groq');
    const Employee = require('../models/Employee');
    const Task = require('../models/Task');
    const [totalEmployees, activeTasks, completedTasks] = await Promise.all([
      Employee.countDocuments({ organizationId: req.organizationId }),
      Task.countDocuments({ organizationId: req.organizationId, status: { $in: ['pending','in_progress'] } }),
      Task.countDocuments({ organizationId: req.organizationId, status: 'completed' }),
    ]);
    const insight = await chatAssistant([{ role: 'user', content: `Generate a 2-sentence platform insight: ${totalEmployees} employees, ${activeTasks} active tasks, ${completedTasks} completed tasks this month.` }], {});
    res.json({ insights: insight });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
