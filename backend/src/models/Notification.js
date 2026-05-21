const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error', 'task', 'attendance', 'payroll', 'leave', 'chat', 'ai'], default: 'info' },
  priority: { type: String, enum: ['critical', 'important', 'normal', 'informational'], default: 'normal' },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
