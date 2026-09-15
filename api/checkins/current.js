import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

// Calculate Monday weekKey in YYYY-MM-DD format for a given date string or date object
export function getMondayWeekKey(dateObj, timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const parts = formatter.formatToParts(dateObj);
    const partMap = {};
    parts.forEach(p => (partMap[p.type] = p.value));

    // Determine current day of week in timezone
    const nowLocal = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = nowLocal.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const mondayDate = new Date(nowLocal.getTime() + diffToMonday * 24 * 60 * 60 * 1000);

    const year = mondayDate.getFullYear();
    const month = String(mondayDate.getMonth() + 1).padStart(2, '0');
    const day = String(mondayDate.getDate()).padStart(2, '0');

    return {
      isMonday: dayOfWeek === 1,
      weekKey: `${year}-${month}-${day}`,
      currentDateStr: `${partMap.year}-${partMap.month}-${partMap.day}`,
      dayOfWeek
    };
  } catch (e) {
    const iso = dateObj.toISOString().split('T')[0];
    return { isMonday: dateObj.getDay() === 1, weekKey: iso, currentDateStr: iso, dayOfWeek: dateObj.getDay() };
  }
}

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
    const timezone = user.timezone || 'UTC';
    const now = new Date();

    const { isMonday, weekKey } = getMondayWeekKey(now, timezone);

    // Check if check-in record exists for this weekKey
    const checkin = await db.collection('weeklyCheckins').findOne({
      userId,
      weekKey,
    });

    return res.status(200).json({
      isMonday,
      weekKey,
      isCompleted: !!checkin && checkin.status === 'completed',
      completedAt: checkin ? checkin.completedAt : null,
    });
  } catch (error) {
    console.error('[Current Checkin API Error]', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
