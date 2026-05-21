const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  code:     { type: String, unique: true, uppercase: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  industry: { type: String, default: 'General' },
  size:     { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], default: '1-10' },
  phone:    { type: String },
  address:  { type: String },
  logo:     { type: String },
  website:  { type: String },
  status:   { type: String, enum: ['pending', 'active', 'suspended'], default: 'active' },
  plan:     { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
  secretCode: { type: String },
  departments: [{ name: String, description: String }],
  settings: {
    workingHours: {
      start: { type: String, default: '09:00' },
      end:   { type: String, default: '18:00' }
    },
    workingDays:   { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    lateThreshold: { type: Number, default: 15 },
    currency:      { type: String, default: 'USD' },
    timezone:      { type: String, default: 'UTC' }
  },
  aiOnboardingCompleted: { type: Boolean, default: false },
  healthScore:           { type: Number, default: 100 }
}, { timestamps: true });

// Auto-generate a unique org code before first save
organizationSchema.pre('save', function (next) {
  if (!this.code) {
    const prefix = this.name.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.code = prefix + suffix;
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);