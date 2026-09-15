import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

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

    const nowLocal = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = nowLocal.getDay();
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
  const action = req.query.action || (req.url ? req.url.split('/').pop().split('?')[0] : '');

  const { db } = await connectToDatabase();
  const user = await getAuthenticatedUser(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const userId = new ObjectId(user._id || user.id);
  const timezone = user.timezone || 'UTC';

  if (action === 'current' && req.method === 'GET') {
    try {
      const now = new Date();
      const { isMonday, weekKey } = getMondayWeekKey(now, timezone);

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

  if (action === 'history' && req.method === 'GET') {
    try {
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

  if (req.method === 'POST') {
    try {
      const { weight, waist, neck, notes } = req.body || {};
      const { weekKey } = getMondayWeekKey(new Date(), timezone);
      const currentDateStr = new Date().toISOString().split('T')[0];

      await db.collection('weeklyCheckins')
        .createIndex({ userId: 1, weekKey: 1 }, { unique: true })
        .catch(() => {});

      const measurementsToInsert = [];
      if (weight && Number(weight) > 0) measurementsToInsert.push({ type: 'weight', value: Number(weight), unit: 'kg' });
      if (waist && Number(waist) > 0) measurementsToInsert.push({ type: 'waist', value: Number(waist), unit: 'cm' });
      if (neck && Number(neck) > 0) measurementsToInsert.push({ type: 'neck', value: Number(neck), unit: 'cm' });

      for (const m of measurementsToInsert) {
        await db.collection('measurements').findOneAndUpdate(
          { userId, type: m.type, measurementDate: currentDateStr },
          {
            $set: {
              value: m.value,
              unit: m.unit,
              notes: notes || 'Weekly check-in',
              updatedAt: new Date(),
            },
            $setOnInsert: {
              userId,
              type: m.type,
              measurementDate: currentDateStr,
              isInitial: false,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }

      await db.collection('weeklyCheckins').updateOne(
        { userId, weekKey },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId,
            weekKey,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return res.status(200).json({
        message: 'Weekly check-in completed successfully',
        weekKey,
        status: 'completed',
      });
    } catch (error) {
      console.error('[POST Checkin API Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to complete check-in' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
