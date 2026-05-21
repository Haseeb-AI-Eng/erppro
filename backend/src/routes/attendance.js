const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const { emitToOrg } = require('../services/socket');

const getDateStr = (d = new Date()) => d.toISOString().split('T')[0];

// Check in
router.post('/checkin', async (req, res) => {
  try {
    const today = getDateStr();
    const org = await Organization.findById(req.organizationId);
    const existing = await Attendance.findOne({ organizationId: req.organizationId, employeeId: req.user.id, date: today });
    if (existing && existing.checkIn) return res.status(400).json({ message: 'Already checked in today' });

    const now = new Date();
    const [startH, startM] = (org.settings?.workingHours?.start || '09:00').split(':').map(Number);
    const startTime = new Date(now); startTime.setHours(startH, startM, 0, 0);
    const lateThreshold = org.settings?.lateThreshold || 15;
    const diffMin = Math.floor((now - startTime) / 60000);
    const isLate = diffMin > lateThreshold;

    const att = await Attendance.findOneAndUpdate(
      { organizationId: req.organizationId, employeeId: req.user.id, date: today },
      { checkIn: now, status: isLate ? 'late' : 'present', isLate, lateMinutes: Math.max(0, diffMin), location: req.body.location },
      { upsert: true, new: true }
    );

    if (isLate) {
      await Notification.create({ organizationId: req.organizationId, title: 'Late Check-in', message: `${req.employee.name} checked in ${diffMin} minutes late`, type: 'attendance', priority: 'important' });
    }
    emitToOrg(req.app.get('io'), req.organizationId, 'attendance_update', { employeeId: req.user.id, att });
    res.json({ attendance: att });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Check out
router.post('/checkout', async (req, res) => {
  try {
    const today = getDateStr();
    const att = await Attendance.findOne({ organizationId: req.organizationId, employeeId: req.user.id, date: today });
    if (!att || !att.checkIn) return res.status(400).json({ message: 'Not checked in today' });
    if (att.checkOut) return res.status(400).json({ message: 'Already checked out' });
    const now = new Date();
    const hours = (now - att.checkIn) / 3600000;
    att.checkOut = now;
    att.workingHours = Math.round(hours * 10) / 10;
    att.overtime = Math.max(0, Math.round((hours - 8) * 10) / 10);
    await att.save();
    emitToOrg(req.app.get('io'), req.organizationId, 'attendance_update', { employeeId: req.user.id, att });
    res.json({ attendance: att });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Today's status
router.get('/today', async (req, res) => {
  try {
    const att = await Attendance.findOne({ organizationId: req.organizationId, employeeId: req.user.id, date: getDateStr() });
    res.json({ attendance: att });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// My attendance history
router.get('/my', async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { organizationId: req.organizationId, employeeId: req.user.id };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ records });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Org-wide attendance for today
router.get('/org/today', async (req, res) => {
  try {
    const today = getDateStr();
    const records = await Attendance.find({ organizationId: req.organizationId, date: today }).populate('employeeId', 'name avatar department designation');
    const totalEmployees = await Employee.countDocuments({ organizationId: req.organizationId, status: 'active' });
    const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = totalEmployees - present;
    res.json({ records, stats: { total: totalEmployees, present, late, absent, presentRate: totalEmployees ? Math.round(present / totalEmployees * 100) : 0 } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Attendance stats summary
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date(); const today = now.toISOString().split('T')[0];
    const month = now.getMonth() + 1; const year = now.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;
    const [todayRecords, monthRecords, totalEmp] = await Promise.all([
      Attendance.find({ organizationId: req.organizationId, date: today }),
      Attendance.find({ organizationId: req.organizationId, date: { $regex: `^${dateStr}` } }),
      Employee.countDocuments({ organizationId: req.organizationId, status: 'active' }),
    ]);
    const myRecords = await Attendance.find({ organizationId: req.organizationId, employeeId: req.user.id, date: { $regex: `^${dateStr}` } });
    res.json({ today: { present: todayRecords.filter(r=>r.status!=='absent').length, absent: totalEmp - todayRecords.filter(r=>r.status!=='absent').length, late: todayRecords.filter(r=>r.status==='late').length, total: totalEmp }, month: { total: monthRecords.length, present: monthRecords.filter(r=>r.status==='present').length, late: monthRecords.filter(r=>r.status==='late').length, absent: monthRecords.filter(r=>r.status==='absent').length }, myMonth: { total: myRecords.length, present: myRecords.filter(r=>r.status==='present').length, late: myRecords.filter(r=>r.status==='late').length } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Org attendance reports
router.get('/org/report', async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const query = { organizationId: req.organizationId };
    if (employeeId) query.employeeId = employeeId;
    if (month && year) {
      query.date = { $gte: `${year}-${String(month).padStart(2,'0')}-01`, $lte: `${year}-${String(month).padStart(2,'0')}-31` };
    }
    const records = await Attendance.find(query).populate('employeeId', 'name employeeId department');
    res.json({ records });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
