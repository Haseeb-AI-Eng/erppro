require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./src/models/Employee');

mongoose.connect(process.env.MONGODB_URI).then(async () => {

  // Show both duplicates so you can decide
  const dupes = await Employee.find({ email: 'hejaz6784@gmail.com' }, { name: 1, email: 1, role: 1, createdAt: 1 });
  console.log('Duplicate records for hejaz6784@gmail.com:');
  dupes.forEach((e, i) => {
    console.log(`  [${i}] id: ${e._id} | name: ${e.name} | role: ${e.role} | created: ${e.createdAt}`);
  });

  // Delete the older one (createdAt is earlier), keep the newer
  const sorted = dupes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const toDelete = sorted[0]; // oldest

  await Employee.deleteOne({ _id: toDelete._id });
  console.log(`\n✅ Deleted older duplicate: ${toDelete.name} (${toDelete._id})`);

  // Final list
  const remaining = await Employee.find({}, { name: 1, email: 1, role: 1 });
  console.log('\n📋 Final employee list:');
  remaining.forEach(e => console.log(`  - ${e.name} | ${e.email} | ${e.role}`));

  process.exit(0);
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});