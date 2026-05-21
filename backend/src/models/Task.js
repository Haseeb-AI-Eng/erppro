const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  department: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  tags: [String],
  attachments: [{ name: String, url: String, uploadedAt: Date }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  activity: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    timestamp: { type: Date, default: Date.now }
  }],
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  category: { type: String },
  isAiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
