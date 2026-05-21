const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employeeId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  department: { type: String },
  designation: { type: String },
  role: { type: String, enum: ['org_owner', 'hr_manager', 'team_lead', 'employee'], default: 'employee' },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  salary: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now },
  skills: [String],
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  loginHistory: [{ ip: String, device: String, timestamp: Date }],
  performanceScore: { type: Number, default: 100 },
  leaveBalance: { casual: { type: Number, default: 12 }, sick: { type: Number, default: 10 }, annual: { type: Number, default: 15 } },
  bio: { type: String }
}, { timestamps: true });

employeeSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments({ organizationId: this.organizationId });
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

employeeSchema.methods.comparePassword = async function(password) {
  if (!password || !this.password) return false;
  return bcrypt.compare(password, this.password);
};

employeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
