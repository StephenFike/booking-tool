import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { pool, withTransaction } from '../db/pool.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { computeOpenSlots, luxonToDbWeekday } from '../domain/slots.js';

export const bookingsRouter = Router();

// Postgres error code for an exclusion-constraint violation (our no-overlap guard).
const EXCLUSION_VIOLATION = '23P01';

const createSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  start: z.string().datetime({ message: 'expected an ISO 8601 UTC timestamp' }),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().max(320),
  customerPhone: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
});

// Shape a DB row into the public booking JSON.
function toBookingResponse(row) {
  return {
    token: row.cancel_token,
    status: row.status,
    start: row.start_at,
    end: row.end_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    note: row.note,
    service: { id: row.service_id, name: row.service_name },
  };
}

// POST /api/bookings — create a booking, re-checking availability server-side.
bookingsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validate(createSchema, req.body);
    const tz = env.businessTimezone;

    const start = DateTime.fromISO(data.start, { zone: 'utc' });
    if (!start.isValid) throw new ApiError(400, 'Invalid start time');

    const created = await withTransaction(async (client) => {
      // Service must exist and be active.
      const { rows: services } = await client.query(
        'SELECT id, name, duration_min AS "durationMin" FROM services WHERE id = $1 AND active = TRUE',
        [data.serviceId]
      );
      const service = services[0];
      if (!service) throw new ApiError(400, 'Service not available');

      const end = start.plus({ minutes: service.durationMin });

      // Re-derive the open slots for that day and require the requested start
      // to be one of them. This keeps "what we offered" and "what we accept"
      // in sync, and rejects made-up or stale times.
      const local = start.setZone(tz);
      const date = local.toISODate();
      const weekday = luxonToDbWeekday(local.weekday);

      const { rows: workingHours } = await client.query(
        'SELECT start_time, end_time FROM availability WHERE weekday = $1',
        [weekday]
      );
      const dayStart = local.startOf('day').toUTC().toJSDate();
      const dayEnd = local.endOf('day').toUTC().toJSDate();
      const { rows: bookings } = await client.query(
        `SELECT start_at AS start, end_at AS end
           FROM bookings
          WHERE status = 'confirmed' AND start_at < $2 AND end_at > $1`,
        [dayStart, dayEnd]
      );
      const { rows: blackouts } = await client.query(
        `SELECT start_at AS start, end_at AS end
           FROM blackouts
          WHERE start_at < $2 AND end_at > $1`,
        [dayStart, dayEnd]
      );

      const openSlots = computeOpenSlots({
        date,
        timezone: tz,
        durationMin: service.durationMin,
        workingHours,
        busyIntervals: [...bookings, ...blackouts],
        now: new Date(),
      });
      const openMillis = new Set(
        openSlots.map((iso) => DateTime.fromISO(iso).toMillis())
      );
      if (!openMillis.has(start.toMillis())) {
        throw new ApiError(409, 'That time slot is not available');
      }

      // Insert. The exclusion constraint is the final guard against a race
      // where two requests both passed the check above concurrently.
      try {
        const { rows } = await client.query(
          `INSERT INTO bookings
             (service_id, customer_name, customer_email, customer_phone, note,
              start_at, end_at, cancel_token)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, cancel_token, status, start_at, end_at,
                     customer_name, customer_email, customer_phone, note, service_id`,
          [
            service.id,
            data.customerName,
            data.customerEmail,
            data.customerPhone ?? null,
            data.note ?? null,
            start.toUTC().toJSDate(),
            end.toUTC().toJSDate(),
            crypto.randomUUID(),
          ]
        );
        return { ...rows[0], service_name: service.name };
      } catch (err) {
        if (err.code === EXCLUSION_VIOLATION) {
          throw new ApiError(409, 'That time slot was just booked by someone else');
        }
        throw err;
      }
    });

    res.status(201).json(toBookingResponse(created));
  })
);

// GET /api/bookings/:token — view a booking (for the confirm/cancel screens).
bookingsRouter.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT b.cancel_token, b.status, b.start_at, b.end_at,
              b.customer_name, b.customer_email, b.customer_phone, b.note,
              b.service_id, s.name AS service_name
         FROM bookings b
         JOIN services s ON s.id = b.service_id
        WHERE b.cancel_token = $1`,
      [req.params.token]
    );
    if (!rows[0]) throw new ApiError(404, 'Booking not found');
    res.json(toBookingResponse(rows[0]));
  })
);

// POST /api/bookings/:token/cancel — cancel a booking, freeing the slot.
bookingsRouter.post(
  '/:token/cancel',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE bookings
          SET status = 'cancelled'
        WHERE cancel_token = $1 AND status = 'confirmed'
      RETURNING cancel_token, status, start_at, end_at,
                customer_name, customer_email, customer_phone, note, service_id`,
      [req.params.token]
    );

    if (!rows[0]) {
      // Either the token is unknown or it was already cancelled/completed.
      const { rows: existing } = await pool.query(
        'SELECT status FROM bookings WHERE cancel_token = $1',
        [req.params.token]
      );
      if (!existing[0]) throw new ApiError(404, 'Booking not found');
      throw new ApiError(409, `Booking is already ${existing[0].status}`);
    }

    res.json({ ...toBookingResponse({ ...rows[0], service_name: null }) });
  })
);
