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
  console.error('MONGODB_URI not found in env!');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`Connected to database: ${dbName}`);

  // 1. Rename 'Triceps Pushdown' -> 'Triceps Pushdown Bar'
  const renameResult = await db.collection('exercises').updateMany(
    { name: { $regex: /^triceps pushdown$/i } },
    { 
      $set: { 
        name: 'Triceps Pushdown Bar', 
        groupId: 'chest_triceps', 
        subGroup: 'Triceps',
        updatedAt: new Date() 
      } 
    }
  );
  console.log(`Renamed Triceps Pushdown: ${renameResult.modifiedCount} updated.`);

  // 2. Upsert 'Triceps Pushdown Bar'
  await db.collection('exercises').updateOne(
    { name: 'Triceps Pushdown Bar' },
    { 
      $set: { 
        name: 'Triceps Pushdown Bar', 
        groupId: 'chest_triceps', 
        subGroup: 'Triceps',
        updatedAt: new Date() 
      } 
    },
    { upsert: true }
  );
  console.log('Ensured Triceps Pushdown Bar in database.');

  // 3. Upsert 'Two Arm DB Extension'
  await db.collection('exercises').updateOne(
    { name: 'Two Arm DB Extension' },
    { 
      $set: { 
        name: 'Two Arm DB Extension', 
        groupId: 'chest_triceps', 
        subGroup: 'Triceps',
        updatedAt: new Date() 
      } 
    },
    { upsert: true }
  );
  console.log('Ensured Two Arm DB Extension in database.');

  // 4. Upsert 'Single Arm DB Extension' (fix case)
  await db.collection('exercises').updateOne(
    { name: { $regex: /^single arm db extension$/i } },
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
  console.log('Ensured Single Arm DB Extension in database.');

  // 5. Update existing workouts logs where exerciseName was 'Triceps Pushdown' or 'Single arm db extension'
  const workoutUpdatePushdown = await db.collection('workouts').updateMany(
    { 'exercises.exerciseName': { $regex: /^triceps pushdown$/i } },
    { $set: { 'exercises.$[elem].exerciseName': 'Triceps Pushdown Bar' } },
    { arrayFilters: [{ 'elem.exerciseName': { $regex: /^triceps pushdown$/i } }] }
  );
  console.log(`Updated ${workoutUpdatePushdown.modifiedCount} workout log entries for Triceps Pushdown Bar.`);

  const workoutUpdateSingleArm = await db.collection('workouts').updateMany(
    { 'exercises.exerciseName': { $regex: /^single arm db extension$/i } },
    { $set: { 'exercises.$[elem].exerciseName': 'Single Arm DB Extension' } },
    { arrayFilters: [{ 'elem.exerciseName': { $regex: /^single arm db extension$/i } }] }
  );
  console.log(`Updated ${workoutUpdateSingleArm.modifiedCount} workout log entries for Single Arm DB Extension.`);

  await client.close();
  console.log('Database migration completed successfully! 🎉');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
