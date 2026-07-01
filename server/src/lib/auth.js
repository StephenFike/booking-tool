import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

export const SESSION_COOKIE = 'session';

/** Parse a duration like "7d", "24h", "30m", "3600s" into milliseconds. */
function durationToMs(str) {
  const match = /^(\d+)\s*([smhd])$/.exec(String(str).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // sensible default: 7 days
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return value * unit;
}

const SESSION_MAX_AGE_MS = durationToMs(env.jwtExpiresIn);

/** Sign a session JWT for an authenticated admin user. */
export function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

/** Verify a session JWT, returning its payload (throws if invalid/expired). */
export function verifySession(token) {
  return jwt.verify(token, env.jwtSecret);
}

/** Cookie options for the session cookie. httpOnly so JS can't read it. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}
