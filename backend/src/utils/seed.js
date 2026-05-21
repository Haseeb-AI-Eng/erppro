const SuperAdmin = require('../models/SuperAdmin');

const seedSuperAdmin = async () => {
  try {
    const existing = await SuperAdmin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!existing) {
      await SuperAdmin.create({
        name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: 'super_admin'
      });
      console.log('Super admin seeded:', process.env.SUPER_ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = { seedSuperAdmin };
