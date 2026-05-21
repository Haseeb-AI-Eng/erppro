const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, default: 0 },
  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processing', 'paid', 'cancelled'], default: 'pending' },
  paidAt: { type: Date },
  paymentMethod: { type: String, default: 'bank_transfer' },
  notes: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
}, { timestamps: true });

payrollSchema.index({ organizationId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
