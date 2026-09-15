import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';
import { getMondayWeekKey } from './current.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const { weight, waist, neck, notes } = req.body || {};

    const { weekKey } = getMondayWeekKey(new Date(), timezone);
    const currentDateStr = new Date().toISOString().split('T')[0];

    // Ensure unique compound index on userId + weekKey
    await db.collection('weeklyCheckins')
      .createIndex({ userId: 1, weekKey: 1 }, { unique: true })
      .catch(() => {});

    // Save individual measurements if provided
    const measurementsToInsert = [];
    if (weight && Number(weight) > 0) {
      measurementsToInsert.push({ type: 'weight', value: Number(weight), unit: 'kg' });
    }
    if (waist && Number(waist) > 0) {
      measurementsToInsert.push({ type: 'waist', value: Number(waist), unit: 'cm' });
    }
    if (neck && Number(neck) > 0) {
      measurementsToInsert.push({ type: 'neck', value: Number(neck), unit: 'cm' });
    }

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

    // Insert or update check-in record
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
