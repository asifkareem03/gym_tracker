import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../_lib/mongodb.js';
import { createSession, setSessionCookie } from '../_lib/auth.js';

const AVATAR_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, confirmPassword, timezone } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const { db } = await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure unique index exists
    await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists' });
    }

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

    // Create session token and set cookie
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
