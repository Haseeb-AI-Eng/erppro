require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


const mongoose = require('mongoose');
const Employee = require('./src/models/Employee');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  
  const employees = await Employee.find({ email: 'hejaz6784@gmail.com' });
  console.log(`Found ${employees.length} employees with email hejaz6784@gmail.com:`);
  
  for (const emp of employees) {
    const org = await Organization.findById(emp.organizationId);
    console.log(`- ID: ${emp._id}`);
    console.log(`  Name: ${emp.name}`);
    console.log(`  Role: ${emp.role}`);
    console.log(`  Org: ${org ? org.name : 'None'} (Code: ${org ? org.code : 'N/A'})`);
    console.log(`  Password Hash: ${emp.password}`);
    console.log(`  Is Hash valid format? ${emp.password && emp.password.startsWith('$2')}`);
  }
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
