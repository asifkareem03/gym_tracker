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
    return res.status(400).json({ error: 'Invalid measurement ID' });
  }

  const measurementId = new ObjectId(id);
  const userId = new ObjectId(user._id || user.id);

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

  return res.status(405).json({ error: 'Method not allowed' });
}
