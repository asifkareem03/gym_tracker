import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

export const DEFAULT_WORKOUT_GROUPS = [
  { id: 'chest_triceps', name: 'Chest + Triceps', color: '#10B981', orderIndex: 1 },
  { id: 'back_biceps', name: 'Back + Biceps', color: '#3B82F6', orderIndex: 2 },
  { id: 'shoulders_abs', name: 'Shoulders + Abs', color: '#F59E0B', orderIndex: 3 },
  { id: 'legs', name: 'Legs', color: '#8B5CF6', orderIndex: 4 },
  { id: 'full_body', name: 'Full Body', color: '#06B6D4', orderIndex: 5 },
  { id: 'custom', name: 'Custom', color: '#6B7280', orderIndex: 6 }
];

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

    const groups = await db.collection('workoutGroups').find({}).sort({ orderIndex: 1 }).toArray();

    if (!groups || groups.length === 0) {
      return res.status(200).json({ groups: DEFAULT_WORKOUT_GROUPS });
    }

    const mapped = groups.map(g => ({
      id: g.groupId || g._id.toString(),
      name: g.name,
      color: g.color || '#10B981',
      orderIndex: g.orderIndex
    }));

    return res.status(200).json({ groups: mapped });
  } catch (error) {
    console.error('[Workout Groups API Error]', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
