import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';
import { ensureYesterdayRestDay } from './login.js';

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

    // Trigger yesterday auto rest day check asynchronously
    ensureYesterdayRestDay(db, user._id, user.timezone || 'UTC').catch(() => {});

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        hasCompletedInitialSetup: !!user.hasCompletedInitialSetup,
        timezone: user.timezone || 'UTC',
      },
    });
  } catch (error) {
    console.error('[Me API Error]', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
