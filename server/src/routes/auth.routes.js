import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { signSession, sessionCookieOptions, SESSION_COOKIE } from '../lib/auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// POST /api/auth/login — verify credentials, set the session cookie.
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validate(loginSchema, req.body);

    const { rows } = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    // Same message whether the email is unknown or the password is wrong,
    // so the endpoint can't be used to enumerate accounts.
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) throw new ApiError(401, 'Invalid email or password');

    const token = signSession(user);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  })
);

// POST /api/auth/logout — clear the session cookie.
authRouter.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/auth/me — current admin, or 401.
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: { id: req.user.sub, email: req.user.email, role: req.user.role } });
  })
);
