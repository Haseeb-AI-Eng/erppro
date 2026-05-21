const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'leave'], default: 'present' },
  workingHours: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  location: { lat: Number, lng: Number },
  notes: { type: String },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 }
}, { timestamps: true });

attendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
