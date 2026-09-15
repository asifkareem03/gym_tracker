import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../_lib/mongodb.js';
import { getAuthenticatedUser } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await getAuthenticatedUser(req, db);

    if (!user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const userId = new ObjectId(user._id || user.id);
    const { exerciseId } = req.query || {};
    const { from, to, groupId, sort = 'desc' } = req.query || {};

    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID or name is required' });
    }

    // Decode exercise parameter (could be name or ObjectId string)
    const targetExercise = decodeURIComponent(exerciseId).trim();

    // Query user's workouts that contain exercises matching the exerciseId or name
    const query = {
      userId,
      dayType: 'workout',
      exercises: {
        $elemMatch: {
          $or: [
            { exerciseName: { $regex: new RegExp(`^${targetExercise.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } },
            { exerciseId: targetExercise }
          ]
        }
      }
    };

    if (from || to) {
      query.workoutDate = {};
      if (from) query.workoutDate.$gte = from;
      if (to) query.workoutDate.$lte = to;
    }
    if (groupId) {
      query.groupId = groupId;
    }

    const sortOrder = sort === 'asc' ? 1 : -1;

    const workouts = await db.collection('workouts')
      .find(query)
      .sort({ workoutDate: sortOrder })
      .toArray();

    // Extract exercise history entries
    const historyEntries = [];
    let highestWeight = 0;
    let highestWeightReps = 0;
    let latestWeight = 0;
    let latestWeightReps = 0;
    let latestWorkoutDate = null;
    const sessionDates = new Set();

    workouts.forEach(w => {
      sessionDates.add(w.workoutDate);

      // Find matching exercises in this workout
      const matchingExs = (w.exercises || []).filter(ex => {
        const nameMatch = ex.exerciseName && ex.exerciseName.toLowerCase() === targetExercise.toLowerCase();
        const idMatch = ex.exerciseId && String(ex.exerciseId) === targetExercise;
        return nameMatch || idMatch;
      });

      matchingExs.forEach(ex => {
        const sets = ex.sets || [];
        const totalSets = sets.length;
        
        sets.forEach(set => {
          const weight = Number(set.weightKg) || 0;
          const reps = Number(set.reps) || 0;

          if (weight > highestWeight || (weight === highestWeight && reps > highestWeightReps)) {
            highestWeight = weight;
            highestWeightReps = reps;
          }

          historyEntries.push({
            workoutId: w._id.toString(),
            workoutDate: w.workoutDate,
            groupId: w.groupId,
            exerciseName: ex.exerciseName,
            setNumber: set.setNumber,
            reps,
            weightKg: weight,
            totalSets,
            completed: set.completed,
            notes: ex.notes || w.notes || ''
          });
        });
      });
    });

    // Determine latest weight & date from newest workouts
    if (workouts.length > 0) {
      const sortedByDateDesc = [...workouts].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
      const latestW = sortedByDateDesc[0];
      latestWorkoutDate = latestW.workoutDate;

      const latestMatchingEx = (latestW.exercises || []).find(ex => {
        return (ex.exerciseName && ex.exerciseName.toLowerCase() === targetExercise.toLowerCase()) ||
               (ex.exerciseId && String(ex.exerciseId) === targetExercise);
      });

      if (latestMatchingEx && latestMatchingEx.sets && latestMatchingEx.sets.length > 0) {
        let maxSet = latestMatchingEx.sets[0];
        latestMatchingEx.sets.forEach(s => {
          if ((Number(s.weightKg) || 0) > (Number(maxSet.weightKg) || 0)) {
            maxSet = s;
          }
        });
        latestWeight = Number(maxSet.weightKg) || 0;
        latestWeightReps = Number(maxSet.reps) || 0;
      }
    }

    return res.status(200).json({
      exerciseName: targetExercise,
      stats: {
        latestWeight,
        latestWeightReps,
        highestWeight,
        highestWeightReps,
        totalSessions: sessionDates.size,
        latestWorkoutDate: latestWorkoutDate || 'None'
      },
      history: historyEntries
    });
  } catch (error) {
    console.error('[Exercise Progress API Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch exercise progress' });
  }
}
