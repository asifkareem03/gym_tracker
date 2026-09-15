import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../_lib/mongodb.js';
import { createSession, setSessionCookie, clearSessionCookie, destroySession, getAuthenticatedUser } from '../_lib/auth.js';

const AVATAR_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
];

export function getDateStringInTimezone(dateObj, timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(dateObj);
  } catch (e) {
    return dateObj.toISOString().split('T')[0];
  }
}

export async function ensureYesterdayRestDay(db, userId, userTimezone = 'UTC') {
  try {
    const now = new Date();
    const todayStr = getDateStringInTimezone(now, userTimezone);
    const yesterdayObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getDateStringInTimezone(yesterdayObj, userTimezone);

    if (!yesterdayStr || yesterdayStr >= todayStr) return;

    const existing = await db.collection('workouts').findOne({
      userId,
      workoutDate: yesterdayStr,
    });

    if (!existing) {
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
  const action = req.query.action || (req.url ? req.url.split('/').pop().split('?')[0] : '');

  const { db } = await connectToDatabase();

  if (action === 'register' && req.method === 'POST') {
    try {
      const { name, email, password, confirmPassword, timezone } = req.body || {};

      if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required' });
      if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Valid email address is required' });
      if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

      const normalizedEmail = email.trim().toLowerCase();
      await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});

      const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
      if (existingUser) return res.status(400).json({ error: 'An account with this email address already exists' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        avatarColor,
        hasCompletedInitialSetup: false,
        timezone: timezone || 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId;

      const rawToken = await createSession(db, userId);
      setSessionCookie(res, rawToken);

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: userId.toString(),
          name: newUser.name,
          email: newUser.email,
          avatarColor: newUser.avatarColor,
          hasCompletedInitialSetup: newUser.hasCompletedInitialSetup,
          timezone: newUser.timezone,
        },
      });
    } catch (error) {
      console.error('[Register API Error]', error);
      return res.status(500).json({ error: error.message || 'Server error during registration' });
    }
  }

  if (action === 'login' && req.method === 'POST') {
    try {
      const { email, password, timezone } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.collection('users').findOne({ email: normalizedEmail });
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

      const effectiveTimezone = timezone || user.timezone || 'UTC';
      if (timezone && timezone !== user.timezone) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { timezone: effectiveTimezone, updatedAt: new Date() } }
        );
      }

      const rawToken = await createSession(db, user._id);
      setSessionCookie(res, rawToken);

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

  if (action === 'logout' && req.method === 'POST') {
    try {
      await destroySession(req, db);
      clearSessionCookie(res);
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      clearSessionCookie(res);
      return res.status(200).json({ message: 'Logged out' });
    }
  }

  if (action === 'me' && req.method === 'GET') {
    try {
      const user = await getAuthenticatedUser(req, db);
      if (!user) return res.status(401).json({ error: 'Unauthenticated' });

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

  return res.status(405).json({ error: 'Method not allowed' });
}
