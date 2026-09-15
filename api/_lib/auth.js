import crypto from 'crypto';
import cookie from 'cookie';
import { ObjectId } from 'mongodb';

const COOKIE_NAME = 'gym_tracker_session';
const SESSION_EXPIRY_DAYS = 30;

// Hash token for database storage
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Parse request cookies
export function getCookie(req, name = COOKIE_NAME) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookie.parse(cookieHeader);
  return cookies[name] || null;
}

// Set session cookie header
export function setSessionCookie(res, token, maxAgeSeconds = SESSION_EXPIRY_DAYS * 24 * 60 * 60) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieSerialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
  });

  const existing = res.getHeader ? res.getHeader('Set-Cookie') : null;
  if (existing) {
    if (Array.isArray(existing)) {
      res.setHeader('Set-Cookie', [...existing, cookieSerialized]);
    } else {
      res.setHeader('Set-Cookie', [existing, cookieSerialized]);
    }
  } else {
    res.setHeader('Set-Cookie', cookieSerialized);
  }
}

// Clear session cookie
export function clearSessionCookie(res) {
  const cookieSerialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookieSerialized);
}

// Create a new session in database
export async function createSession(db, userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.collection('sessions').insertOne({
    userId: new ObjectId(userId),
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  return rawToken;
}

// Authenticate user from session cookie
export async function getAuthenticatedUser(req, db) {
  const token = getCookie(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.collection('sessions').findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  const user = await db.collection('users').findOne({ _id: session.userId });
  if (!user) return null;

  // Omit sensitive fields and ensure both _id (ObjectId) and id (String) exist
  const { passwordHash, ...safeUser } = user;
  safeUser.id = user._id.toString();
  return safeUser;
}

// Destroy session
export async function destroySession(req, db) {
  const token = getCookie(req);
  if (!token) return;

  const tokenHash = hashToken(token);
  await db.collection('sessions').deleteOne({ tokenHash });
}
