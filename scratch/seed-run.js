require('dotenv').config();
const { connectDB } = require('../config/db');
const { seedDatabase } = require('../config/seed');

async function run() {
  console.log('Running database seed script...');
  const connected = await connectDB();
  if (connected) {
    await seedDatabase();
    console.log('Seeding process finished!');
  } else {
    console.log('Could not connect to MongoDB database.');
  }
  process.exit(0);
}

run();
