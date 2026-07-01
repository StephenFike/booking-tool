import { Router } from 'express';
import { DateTime } from 'luxon';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

export const adminStatsRouter = Router();

// GET /api/admin/stats — dashboard summary strip.
adminStatsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const now = DateTime.now().setZone(env.businessTimezone);
    const weekStart = now.startOf('week').toUTC().toJSDate(); // Monday
    const weekEnd = now.endOf('week').toUTC().toJSDate();

    const [thisWeek, upcoming, topService] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS n FROM bookings
          WHERE status IN ('confirmed', 'completed')
            AND start_at >= $1 AND start_at <= $2`,
        [weekStart, weekEnd]
      ),
      pool.query(
        `SELECT count(*)::int AS n FROM bookings
          WHERE status = 'confirmed' AND start_at >= now()`
      ),
      pool.query(
        `SELECT s.name, count(*)::int AS n
           FROM bookings b
           JOIN services s ON s.id = b.service_id
          WHERE b.status IN ('confirmed', 'completed')
          GROUP BY s.name
          ORDER BY n DESC
          LIMIT 1`
      ),
    ]);

    res.json({
      bookingsThisWeek: thisWeek.rows[0].n,
      upcomingCount: upcoming.rows[0].n,
      mostBookedService: topService.rows[0]
        ? { name: topService.rows[0].name, count: topService.rows[0].n }
        : null,
    });
  })
);
