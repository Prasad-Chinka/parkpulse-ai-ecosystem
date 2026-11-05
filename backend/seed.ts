import dotenv from 'dotenv';
import { connectDB } from './config/db.ts';
import { memoryStore, db } from './services/store.ts';

dotenv.config();

async function runSeed() {
  console.log('\n--- ParkPulse AI Seeding Script ---');
  await connectDB();

  if (db.isMongoActive()) {
    console.log('MongoDB is active. Syncing seed collections...');
    // Seed default records if empty
    const users = await db.getAllUsers();
    if (users.length === 0) {
      for (const u of memoryStore.users) {
        await db.createUser(u);
      }
      console.log(`Seeded ${memoryStore.users.length} users into MongoDB.`);
    }
  } else {
    console.log('Local store initialized with:');
    console.log(`- ${memoryStore.users.length} Demo Users`);
    console.log(`- ${memoryStore.vehicles.length} Registered Vehicles`);
    console.log(`- ${memoryStore.lots.length} Parking Facilities`);
    console.log(`- ${memoryStore.slots.length} Parking Slots`);
    console.log(`- ${memoryStore.reservations.length} Active & Completed Reservations`);
    console.log(`- ${memoryStore.payments.length} Payment Receipts`);
  }

  console.log('\nSeeding completed successfully!');
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
