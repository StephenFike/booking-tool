import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { computeOpenSlots, luxonToDbWeekday } from '../domain/slots.js';

export const availabilityRouter = Router();

const querySchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
});

// GET /api/availability?serviceId=&date= — open slot start times for one day.
availabilityRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { serviceId, date } = validate(querySchema, req.query);
    const tz = env.businessTimezone;

    const day = DateTime.fromISO(date, { zone: tz });
    if (!day.isValid) throw new ApiError(400, 'Invalid date');

    // Service must exist and be active.
    const { rows: services } = await pool.query(
      'SELECT id, duration_min AS "durationMin" FROM services WHERE id = $1 AND active = TRUE',
      [serviceId]
    );
    const service = services[0];
    if (!service) throw new ApiError(404, 'Service not found');

    // Recurring working hours for this weekday (0=Sun … 6=Sat).
    const weekday = luxonToDbWeekday(day.weekday);
    const { rows: workingHours } = await pool.query(
      'SELECT start_time, end_time FROM availability WHERE weekday = $1 ORDER BY start_time',
      [weekday]
    );

    // Anything that could overlap this calendar day (in the business tz).
    const dayStart = day.startOf('day').toUTC().toJSDate();
    const dayEnd = day.endOf('day').toUTC().toJSDate();

    const { rows: bookings } = await pool.query(
      `SELECT start_at AS start, end_at AS end
         FROM bookings
        WHERE status = 'confirmed' AND start_at < $2 AND end_at > $1`,
      [dayStart, dayEnd]
    );
    const { rows: blackouts } = await pool.query(
      `SELECT start_at AS start, end_at AS end
         FROM blackouts
        WHERE start_at < $2 AND end_at > $1`,
      [dayStart, dayEnd]
    );

    const slots = computeOpenSlots({
      date,
      timezone: tz,
      durationMin: service.durationMin,
      workingHours,
      busyIntervals: [...bookings, ...blackouts],
      now: new Date(),
    });

    res.json({
      serviceId: service.id,
      date,
      durationMin: service.durationMin,
      timezone: tz,
      slots,
    });
  })
);
