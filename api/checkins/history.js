import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

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
    const history = await db.collection('weeklyCheckins')
      .find({ userId })
      .sort({ weekKey: -1 })
      .toArray();

    const formatted = history.map(h => ({
      id: h._id.toString(),
      weekKey: h.weekKey,
      status: h.status,
      completedAt: h.completedAt,
    }));

    return res.status(200).json({ checkins: formatted });
  } catch (error) {
    console.error('[Checkin History API Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch checkin history' });
  }
}
