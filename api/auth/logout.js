import { connectToDatabase } from '../_lib/mongodb.js';
import { clearSessionCookie, destroySession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    await destroySession(req, db);
    clearSessionCookie(res);

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Logout API Error]', error);
    clearSessionCookie(res);
    return res.status(200).json({ message: 'Logged out' });
  }
}
