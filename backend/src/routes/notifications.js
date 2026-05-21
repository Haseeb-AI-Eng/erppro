const router = require('express').Router();
const Notification = require('../models/Notification');

router.get('/', async (req, res) => {
  try {
    const query = { $or: [{ recipientId: req.user.id }, { organizationId: req.organizationId, recipientId: null }] };
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ $or: [{ recipientId: req.user.id }, { organizationId: req.organizationId, recipientId: null }] }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
