import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const user = await getAuthenticatedUser(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const { id } = req.query || {};
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid workout ID' });
  }

  const workoutId = new ObjectId(id);
  const userId = new ObjectId(user._id || user.id);

  // Verify ownership
  const existing = await db.collection('workouts').findOne({ _id: workoutId, userId });
  if (!existing) {
    return res.status(404).json({ error: 'Workout record not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      workout: {
        id: existing._id.toString(),
        userId: existing.userId.toString(),
        workoutDate: existing.workoutDate,
        dayType: existing.dayType || 'workout',
        groupId: existing.groupId || null,
        notes: existing.notes || '',
        exercises: existing.exercises || [],
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt
      }
    });
  }

  if (req.method === 'PATCH') {
    try {
      const { dayType, groupId, notes, exercises } = req.body || {};

      const effectiveDayType = dayType ? (dayType === 'rest' ? 'rest' : 'workout') : existing.dayType;

      const updateFields = {
        dayType: effectiveDayType,
        groupId: effectiveDayType === 'rest' ? null : (groupId !== undefined ? groupId : existing.groupId),
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date()
      };

      if (effectiveDayType === 'rest') {
        updateFields.exercises = [];
      } else if (exercises !== undefined) {
        updateFields.exercises = exercises.map((ex, idx) => ({
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
        }));
      }

      await db.collection('workouts').updateOne({ _id: workoutId }, { $set: updateFields });

      const updated = await db.collection('workouts').findOne({ _id: workoutId });

      return res.status(200).json({
        message: 'Workout updated successfully',
        workout: {
          id: updated._id.toString(),
          userId: updated.userId.toString(),
          workoutDate: updated.workoutDate,
          dayType: updated.dayType,
          groupId: updated.groupId,
          notes: updated.notes,
          exercises: updated.exercises,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        }
      });
    } catch (error) {
      console.error('[PATCH Workout Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to update workout' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('workouts').deleteOne({ _id: workoutId });
      return res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
      console.error('[DELETE Workout Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to delete workout' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
