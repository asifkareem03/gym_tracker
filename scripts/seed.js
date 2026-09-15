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
  console.error('Error: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

const WORKOUT_GROUPS = [
  { groupId: 'chest_triceps', name: 'Chest + Triceps', color: '#10B981', orderIndex: 1 },
  { groupId: 'back_biceps', name: 'Back + Biceps', color: '#3B82F6', orderIndex: 2 },
  { groupId: 'shoulders_abs', name: 'Shoulders + Abs', color: '#F59E0B', orderIndex: 3 },
  { groupId: 'legs', name: 'Legs', color: '#8B5CF6', orderIndex: 4 },
  { groupId: 'full_body', name: 'Full Body', color: '#06B6D4', orderIndex: 5 },
  { groupId: 'custom', name: 'Custom', color: '#6B7280', orderIndex: 6 }
];

const PRELOADED_EXERCISES = [
  // Chest + Triceps
  { name: 'Barbell Bench Press', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Barbell Bench Press (Smith)', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Incline Barbell Bench Press', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Incline Barbell Bench Press (Smith)', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Dumbbell Bench Press', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Chest Fly Machine', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Cable Crossover', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Push Ups', groupId: 'chest_triceps', subGroup: 'Chest' },
  { name: 'Triceps Pushdown Bar', groupId: 'chest_triceps', subGroup: 'Triceps' },
  { name: 'Two Arm DB Extension', groupId: 'chest_triceps', subGroup: 'Triceps' },
  { name: 'Single Arm DB Extension', groupId: 'chest_triceps', subGroup: 'Triceps' },
  { name: 'Overhead Triceps Extension', groupId: 'chest_triceps', subGroup: 'Triceps' },
  { name: 'Skull Crushers', groupId: 'chest_triceps', subGroup: 'Triceps' },
  { name: 'Dips', groupId: 'chest_triceps', subGroup: 'Triceps' },

  // Back + Biceps
  { name: 'Lat Pulldown', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'Pull Ups', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'Seated Cable Row', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'Barbell Row', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'T-Bar Row', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'One Arm Dumbbell Row', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'Deadlift', groupId: 'back_biceps', subGroup: 'Back' },
  { name: 'Barbell Curl', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'EZ Bar Curl', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Dumbbell Curl', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Hammer Curl', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Preacher Curl', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Cable Curl with Rope', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Cable Curl with Straight Bar', groupId: 'back_biceps', subGroup: 'Biceps' },
  { name: 'Cable Curl with EZ Bar', groupId: 'back_biceps', subGroup: 'Biceps' },

  // Shoulders + Abs
  { name: 'Overhead Shoulder Press', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Machine Shoulder Press', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Arnold Press', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Seated Lateral Raise', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Standing Lateral Raise', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Front Raises', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Rear Delt Fly', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Face Pull', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Shrugs', groupId: 'shoulders_abs', subGroup: 'Shoulders' },
  { name: 'Plank', groupId: 'shoulders_abs', subGroup: 'Abs' },
  { name: 'Crunches', groupId: 'shoulders_abs', subGroup: 'Abs' },
  { name: 'Hanging Leg Raises', groupId: 'shoulders_abs', subGroup: 'Abs' },
  { name: 'Russian Twists', groupId: 'shoulders_abs', subGroup: 'Abs' },

  // Legs
  { name: 'Barbell Squat', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Leg Press', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Romanian Deadlift', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Leg Extension', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Leg Curl', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Walking Lunges', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Bulgarian Split Squat', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Calf Raises', groupId: 'legs', subGroup: 'Legs' },
  { name: 'Hip Thrust', groupId: 'legs', subGroup: 'Legs' }
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`Connected to database: ${dbName}`);

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ tokenHash: 1 });
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('workouts').createIndex({ userId: 1, workoutDate: 1 }, { unique: true });
  await db.collection('measurements').createIndex({ userId: 1, type: 1, measurementDate: 1 }, { unique: true });
  await db.collection('weeklyCheckins').createIndex({ userId: 1, weekKey: 1 }, { unique: true });

  console.log('Database indexes ensured.');

  // Seed Workout Groups
  for (const group of WORKOUT_GROUPS) {
    await db.collection('workoutGroups').updateOne(
      { groupId: group.groupId },
      { $set: group },
      { upsert: true }
    );
  }
  console.log(`Seeded ${WORKOUT_GROUPS.length} workout groups.`);

  // Seed Exercises
  let exerciseCount = 0;
  for (const ex of PRELOADED_EXERCISES) {
    await db.collection('exercises').updateOne(
      { name: ex.name, groupId: ex.groupId },
      { $set: { ...ex, updatedAt: new Date() } },
      { upsert: true }
    );
    exerciseCount++;
  }
  console.log(`Seeded ${exerciseCount} exercises.`);

  await client.close();
  console.log('Seeding completed successfully! 🎉');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
