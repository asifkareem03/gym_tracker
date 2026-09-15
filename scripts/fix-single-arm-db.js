import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'gym_tracker';

if (!uri) {
  console.error('MONGODB_URI not set!');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`Connected to ${dbName}`);

  // 1. Remove all variations of 'single arm db tricep extension' or 'single arm db extension' that don't match exact 'Single Arm DB Extension'
  const deleteRes = await db.collection('exercises').deleteMany({
    name: { $regex: /^single arm db (tricep )?extension$/i, $ne: 'Single Arm DB Extension' }
  });
  console.log(`Deleted ${deleteRes.deletedCount} duplicate/legacy single arm extension exercise records.`);

  // 2. Ensure exactly one document exists for 'Single Arm DB Extension'
  await db.collection('exercises').updateOne(
    { name: 'Single Arm DB Extension' },
    {
      $set: {
        name: 'Single Arm DB Extension',
        groupId: 'chest_triceps',
        subGroup: 'Triceps',
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Ensured Single Arm DB Extension document in database.');

  // 3. Update any workout log entries that used the lowercase/old names to 'Single Arm DB Extension'
  const updateLogsRes = await db.collection('workouts').updateMany(
    { 'exercises.exerciseName': { $regex: /^single arm db (tricep )?extension$/i } },
    { $set: { 'exercises.$[elem].exerciseName': 'Single Arm DB Extension' } },
    { arrayFilters: [{ 'elem.exerciseName': { $regex: /^single arm db (tricep )?extension$/i } }] }
  );
  console.log(`Updated ${updateLogsRes.modifiedCount} workout logs to 'Single Arm DB Extension'.`);

  await client.close();
  console.log('Database cleanup completed! 🎉');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
