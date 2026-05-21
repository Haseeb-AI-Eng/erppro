const router = require('express').Router();
const Chat = require('../models/Chat');
const Employee = require('../models/Employee');

// Get conversations (DM list)
router.get('/conversations', async (req, res) => {
  try {
    const messages = await Chat.find({ organizationId: req.organizationId, $or: [{ senderId: req.user.id }, { recipientId: req.user.id }], recipientId: { $ne: null } })
      .populate('senderId', 'name avatar isOnline').populate('recipientId', 'name avatar isOnline').sort({ createdAt: -1 });
    const convMap = new Map();
    for (const msg of messages) {
      const otherId = msg.senderId._id.toString() === req.user.id ? msg.recipientId?._id?.toString() : msg.senderId._id.toString();
      if (otherId && !convMap.has(otherId)) convMap.set(otherId, msg);
    }
    res.json({ conversations: Array.from(convMap.values()) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get messages between two users
router.get('/dm/:userId', async (req, res) => {
  try {
    const messages = await Chat.find({ organizationId: req.organizationId, $or: [{ senderId: req.user.id, recipientId: req.params.userId }, { senderId: req.params.userId, recipientId: req.user.id }] })
      .populate('senderId', 'name avatar').sort({ createdAt: 1 }).limit(100);
    await Chat.updateMany({ senderId: req.params.userId, recipientId: req.user.id, isRead: false }, { isRead: true });
    res.json({ messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Send message
router.post('/send', async (req, res) => {
  try {
    const msg = await Chat.create({ organizationId: req.organizationId, senderId: req.user.id, ...req.body });
    const populated = await msg.populate('senderId', 'name avatar');
    req.app.get('io').to(`org:${req.organizationId}`).emit('new_message', populated);
    res.status(201).json({ message: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get team/department channel messages
router.get('/channel/:channelId', async (req, res) => {
  try {
    const messages = await Chat.find({ organizationId: req.organizationId, channelId: req.params.channelId }).populate('senderId', 'name avatar').sort({ createdAt: 1 }).limit(100);
    res.json({ messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
