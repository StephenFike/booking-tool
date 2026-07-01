import { verifySession, SESSION_COOKIE } from '../lib/auth.js';
import { ApiError } from '../lib/errors.js';

/**
 * Guard middleware for admin routes. Requires a valid session cookie and
 * attaches the decoded payload to req.user.
 */
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next(new ApiError(401, 'Not authenticated'));
  try {
    req.user = verifySession(token);
    next();
  } catch {
    next(new ApiError(401, 'Your session has expired. Please log in again.'));
  }
}
