const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['casual', 'sick', 'annual', 'unpaid', 'maternity', 'paternity'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, default: 1 },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  attachments: [{ name: String, url: String }],
  aiRiskScore: { type: Number, default: 0 },
  aiNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
