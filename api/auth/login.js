import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../_lib/mongodb.js';
import { createSession, setSessionCookie } from '../_lib/auth.js';

// Helper function to calculate date string in user timezone
export function getDateStringInTimezone(dateObj, timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(dateObj); // YYYY-MM-DD
  } catch (e) {
    return dateObj.toISOString().split('T')[0];
  }
}

// Automatic yesterday rest day check & creation helper
export async function ensureYesterdayRestDay(db, userId, userTimezone = 'UTC') {
  try {
    const now = new Date();
    const todayStr = getDateStringInTimezone(now, userTimezone);
    
    // Calculate yesterday date
    const yesterdayObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getDateStringInTimezone(yesterdayObj, userTimezone);

    if (!yesterdayStr || yesterdayStr >= todayStr) return;

    // Check if yesterday record exists
    const existing = await db.collection('workouts').findOne({
      userId,
      workoutDate: yesterdayStr,
    });

    if (!existing) {
      // Create Rest Day record atomically using upsert to avoid race conditions
      await db.collection('workouts').updateOne(
        { userId, workoutDate: yesterdayStr },
        {
          $setOnInsert: {
            userId,
            workoutDate: yesterdayStr,
            dayType: 'rest',
            groupId: null,
            notes: 'Rest day',
            exercises: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      ).catch(() => {});
    }
  } catch (err) {
    console.error('Error auto-creating rest day:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, timezone } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.collection('users').findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update timezone if provided
    const effectiveTimezone = timezone || user.timezone || 'UTC';
    if (timezone && timezone !== user.timezone) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { timezone: effectiveTimezone, updatedAt: new Date() } }
      );
    }

    // Create session token and set cookie
    const rawToken = await createSession(db, user._id);
    setSessionCookie(res, rawToken);

    // Auto rest day check for yesterday
    await ensureYesterdayRestDay(db, user._id, effectiveTimezone);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        hasCompletedInitialSetup: !!user.hasCompletedInitialSetup,
        timezone: effectiveTimezone,
      },
    });
  } catch (error) {
    console.error('[Login API Error]', error);
    return res.status(500).json({ error: error.message || 'Server error during login' });
  }
}
