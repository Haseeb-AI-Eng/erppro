const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  channelId: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'file', 'ai'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  isRead: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', messageSchema);
