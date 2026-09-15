import { connectToDatabase } from '../_lib/mongodb.js';
import { getAuthenticatedUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const user = await getAuthenticatedUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  if (req.method === 'GET') {
    try {
      const { groupId } = req.query || {};
      const query = {};
      if (groupId && groupId !== 'all' && groupId !== 'full_body' && groupId !== 'custom') {
        query.groupId = groupId;
      }

      const dbExercises = await db.collection('exercises').find(query).toArray();
      const formatted = dbExercises.map(e => ({
        _id: e._id.toString(),
        name: e.name,
        groupId: e.groupId,
        subGroup: e.subGroup || 'Chest'
      }));

      return res.status(200).json({ exercises: formatted });
    } catch (error) {
      console.error('[Exercises GET API Error]', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, groupId, subGroup } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Exercise name is required' });
      }

      const trimmedName = name.trim();
      const targetGroup = groupId || 'chest_triceps';
      const targetSubGroup = subGroup || (targetGroup === 'chest_triceps' ? 'Chest' : targetGroup === 'back_biceps' ? 'Back' : targetGroup === 'shoulders_abs' ? 'Shoulders' : targetGroup === 'legs' ? 'Legs' : 'Chest');

      const existing = await db.collection('exercises').findOne({
        name: { $regex: new RegExp(`^${trimmedName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });

      if (existing) {
        if (subGroup && existing.subGroup !== subGroup) {
          await db.collection('exercises').updateOne(
            { _id: existing._id },
            { $set: { subGroup: targetSubGroup, groupId: targetGroup } }
          );
        }

        return res.status(200).json({
          message: 'Exercise updated',
          exercise: {
            _id: existing._id.toString(),
            name: existing.name,
            groupId: targetGroup,
            subGroup: targetSubGroup
          }
        });
      }

      const newEx = {
        name: trimmedName,
        groupId: targetGroup,
        subGroup: targetSubGroup,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('exercises').insertOne(newEx);

      return res.status(201).json({
        message: 'Exercise created successfully',
        exercise: {
          _id: result.insertedId.toString(),
          name: newEx.name,
          groupId: newEx.groupId,
          subGroup: newEx.subGroup
        }
      });
    } catch (error) {
      console.error('[Exercises POST API Error]', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
