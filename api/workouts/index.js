import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';
import { getDateStringInTimezone } from '../auth/login.js';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const user = await getAuthenticatedUser(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const userId = new ObjectId(user._id || user.id);

  // Ensure unique index
  await db.collection('workouts').createIndex({ userId: 1, workoutDate: 1 }, { unique: true }).catch(() => {});

  if (req.method === 'GET') {
    try {
      const { from, to, groupId, dayType } = req.query || {};

      const query = { userId };
      if (from || to) {
        query.workoutDate = {};
        if (from) query.workoutDate.$gte = from;
        if (to) query.workoutDate.$lte = to;
      }
      if (groupId && groupId !== 'all') query.groupId = groupId;
      if (dayType) query.dayType = dayType;

      const workouts = await db.collection('workouts')
        .find(query)
        .sort({ workoutDate: -1 })
        .toArray();

      const formatted = workouts.map(w => ({
        id: w._id.toString(),
        userId: w.userId.toString(),
        workoutDate: w.workoutDate,
        dayType: w.dayType || 'workout',
        groupId: w.groupId || null,
        notes: w.notes || '',
        exercises: w.exercises || [],
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      }));

      return res.status(200).json({ workouts: formatted });
    } catch (error) {
      console.error('[GET Workouts Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch workouts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { workoutDate, dayType, groupId, notes, exercises } = req.body || {};

      if (!workoutDate || !/^\d{4}-\d{2}-\d{2}$/.test(workoutDate)) {
        return res.status(400).json({ error: 'Valid workoutDate (YYYY-MM-DD) is required' });
      }

      // Check future date restriction
      const todayStr = getDateStringInTimezone(new Date(), user.timezone || 'UTC');
      if (workoutDate > todayStr) {
        return res.status(400).json({ error: 'Cannot log workout records for future dates' });
      }

      const effectiveDayType = dayType === 'rest' ? 'rest' : 'workout';

      // Check duplicate
      const existing = await db.collection('workouts').findOne({ userId, workoutDate });

      const workoutData = {
        userId,
        workoutDate,
        dayType: effectiveDayType,
        groupId: effectiveDayType === 'rest' ? null : (groupId || 'custom'),
        notes: notes || '',
        exercises: effectiveDayType === 'rest' ? [] : (exercises || []).map((ex, idx) => ({
          exerciseId: ex.exerciseId || null,
          exerciseName: ex.exerciseName || 'Exercise',
          orderIndex: idx,
          sets: (ex.sets || []).map((s, sIdx) => ({
            setNumber: s.setNumber || (sIdx + 1),
            reps: Number(s.reps) || 0,
            weightKg: Number(s.weightKg) || 0,
            completed: s.completed !== undefined ? Boolean(s.completed) : true
          })),
          notes: ex.notes || ''
        })),
        updatedAt: new Date()
      };

      if (existing) {
        await db.collection('workouts').updateOne(
          { _id: existing._id },
          { $set: workoutData }
        );
        return res.status(200).json({
          message: 'Workout updated successfully',
          workout: { id: existing._id.toString(), ...workoutData, userId: userId.toString() }
        });
      } else {
        workoutData.createdAt = new Date();
        const result = await db.collection('workouts').insertOne(workoutData);
        return res.status(201).json({
          message: 'Workout created successfully',
          workout: { id: result.insertedId.toString(), ...workoutData, userId: userId.toString() }
        });
      }
    } catch (error) {
      console.error('[POST Workout Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to save workout' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
