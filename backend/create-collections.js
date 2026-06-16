require('dotenv').config();
const mongoose = require('mongoose');

// Configure DNS for MongoDB SRV resolution
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const models = [
  require('./src/models/Attendance'),
  require('./src/models/Chat'),
  require('./src/models/Employee'),
  require('./src/models/Leave'),
  require('./src/models/Notification'),
  require('./src/models/Organization'),
  require('./src/models/Payroll'),
  require('./src/models/SuperAdmin'),
  require('./src/models/Task')
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  console.log('Connected successfully!');

  for (const model of models) {
    console.log(`Creating collection and indexes for model: ${model.modelName}...`);
    await model.createCollection();
    console.log(`Successfully created collection for: ${model.modelName}`);
  }

  // Seed super admin as well since we want everything initialized according to code
  console.log('Seeding super admin...');
  const { seedSuperAdmin } = require('./src/utils/seed');
  await seedSuperAdmin();
  
  console.log('Database initialization complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error during DB initialization:', err);
  process.exit(1);
});
