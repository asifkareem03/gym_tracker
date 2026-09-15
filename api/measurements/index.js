import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const user = await getAuthenticatedUser(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const userId = new ObjectId(user._id || user.id);
  const { id } = req.query || {};

  // If ID is provided, handle individual item operations (PATCH, DELETE)
  if (id) {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid measurement ID' });
    }

    const measurementId = new ObjectId(id);
    const existing = await db.collection('measurements').findOne({ _id: measurementId, userId });
    if (!existing) {
      return res.status(404).json({ error: 'Measurement record not found' });
    }

    if (req.method === 'PATCH') {
      try {
        const { value, measurementDate, notes } = req.body || {};
        const updates = { updatedAt: new Date() };

        if (value !== undefined) {
          const numVal = Number(value);
          if (isNaN(numVal) || numVal <= 0) {
            return res.status(400).json({ error: 'Value must be a positive number' });
          }
          updates.value = numVal;
        }

        if (measurementDate) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(measurementDate)) {
            return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' });
          }
          updates.measurementDate = measurementDate;
        }

        if (notes !== undefined) {
          updates.notes = notes;
        }

        await db.collection('measurements').updateOne({ _id: measurementId }, { $set: updates });
        const updated = await db.collection('measurements').findOne({ _id: measurementId });

        return res.status(200).json({
          message: 'Measurement updated successfully',
          measurement: {
            id: updated._id.toString(),
            userId: updated.userId.toString(),
            type: updated.type,
            value: updated.value,
            unit: updated.unit,
            measurementDate: updated.measurementDate,
            isInitial: updated.isInitial,
            notes: updated.notes,
          }
        });
      } catch (error) {
        console.error('[PATCH Measurement Error]', error);
        return res.status(500).json({ error: error.message || 'Failed to update measurement' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        await db.collection('measurements').deleteOne({ _id: measurementId });
        return res.status(200).json({ message: 'Measurement deleted successfully' });
      } catch (error) {
        console.error('[DELETE Measurement Error]', error);
        return res.status(500).json({ error: error.message || 'Failed to delete measurement' });
      }
    }
  }

  // Ensure index
  await db.collection('measurements')
    .createIndex({ userId: 1, type: 1, measurementDate: 1 }, { unique: true })
    .catch(() => {});

  if (req.method === 'GET') {
    try {
      const { type } = req.query || {};
      const query = { userId };
      if (type && ['weight', 'waist', 'neck'].includes(type)) {
        query.type = type;
      }

      const records = await db.collection('measurements')
        .find(query)
        .sort({ measurementDate: -1, createdAt: -1 })
        .toArray();

      const formatted = records.map(m => ({
        id: m._id.toString(),
        userId: m.userId.toString(),
        type: m.type,
        value: m.value,
        unit: m.unit,
        measurementDate: m.measurementDate,
        isInitial: !!m.isInitial,
        notes: m.notes || '',
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));

      return res.status(200).json({ measurements: formatted });
    } catch (error) {
      console.error('[GET Measurements Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch measurements' });
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      const isInitialSetup = req.body && req.body.isInitialSetup === true;
      const itemsToSave = isInitialSetup ? (req.body.items || []) : payload;

      if (!itemsToSave.length) {
        return res.status(400).json({ error: 'Measurement data is required' });
      }

      const savedRecords = [];

      for (const item of itemsToSave) {
        const { type, value, unit, measurementDate, isInitial, notes } = item;

        if (!['weight', 'waist', 'neck'].includes(type)) {
          return res.status(400).json({ error: `Invalid measurement type: ${type}` });
        }

        const numVal = Number(value);
        if (isNaN(numVal) || numVal <= 0) {
          return res.status(400).json({ error: `${type} value must be a positive number` });
        }

        if (type === 'weight' && numVal > 500) {
          return res.status(400).json({ error: 'Weight value exceeds maximum limit (500 kg)' });
        }
        if ((type === 'waist' || type === 'neck') && numVal > 300) {
          return res.status(400).json({ error: `${type} value exceeds maximum limit (300 cm)` });
        }

        const mDate = measurementDate || new Date().toISOString().split('T')[0];
        const defaultUnit = type === 'weight' ? 'kg' : 'cm';

        const filter = { userId, type, measurementDate: mDate };
        const update = {
          $set: {
            value: numVal,
            unit: unit || defaultUnit,
            isInitial: isInitial !== undefined ? Boolean(isInitial) : false,
            notes: notes || '',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId,
            type,
            measurementDate: mDate,
            createdAt: new Date(),
          },
        };

        const result = await db.collection('measurements').findOneAndUpdate(
          filter,
          update,
          { upsert: true, returnDocument: 'after' }
        );

        if (result) {
          savedRecords.push({
            id: result._id.toString(),
            userId: result.userId.toString(),
            type: result.type,
            value: result.value,
            unit: result.unit,
            measurementDate: result.measurementDate,
            isInitial: result.isInitial,
            notes: result.notes,
          });
        }
      }

      if (isInitialSetup) {
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { hasCompletedInitialSetup: true, updatedAt: new Date() } }
        );
      }

      return res.status(201).json({
        message: 'Measurements saved successfully',
        measurements: savedRecords,
        hasCompletedInitialSetup: true
      });
    } catch (error) {
      console.error('[POST Measurements Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to save measurement' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
