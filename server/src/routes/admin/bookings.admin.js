import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/errors.js';
import { validate } from '../../lib/validate.js';

export const adminBookingsRouter = Router();

const SELECT = `
  SELECT b.id,
         b.status,
         b.start_at       AS "start",
         b.end_at         AS "end",
         b.customer_name  AS "customerName",
         b.customer_email AS "customerEmail",
         b.customer_phone AS "customerPhone",
         b.note,
         b.created_at     AS "createdAt",
         s.id             AS "serviceId",
         s.name           AS "serviceName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id`;

const listSchema = z.object({
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
});

// GET /api/admin/bookings?scope=upcoming|past|all
adminBookingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { scope } = validate(listSchema, req.query);

    let where = '';
    let order = 'b.start_at ASC';
    if (scope === 'upcoming') {
      where = "WHERE b.end_at >= now() AND b.status = 'confirmed'";
    } else if (scope === 'past') {
      where = "WHERE b.end_at < now() OR b.status <> 'confirmed'";
      order = 'b.start_at DESC';
    }

    const { rows } = await pool.query(`${SELECT} ${where} ORDER BY ${order}`);
    res.json(rows);
  })
);

// Move a booking to a new status, only from 'confirmed'.
function transition(targetStatus) {
  return asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE bookings SET status = $2
        WHERE id = $1 AND status = 'confirmed'
      RETURNING id`,
      [req.params.id, targetStatus]
    );
    if (!rows[0]) {
      const { rows: existing } = await pool.query('SELECT status FROM bookings WHERE id = $1', [
        req.params.id,
      ]);
      if (!existing[0]) throw new ApiError(404, 'Booking not found');
      throw new ApiError(409, `Booking is already ${existing[0].status}`);
    }
    const { rows: updated } = await pool.query(`${SELECT} WHERE b.id = $1`, [req.params.id]);
    res.json(updated[0]);
  });
}

// POST /api/admin/bookings/:id/cancel
adminBookingsRouter.post('/:id/cancel', transition('cancelled'));

// POST /api/admin/bookings/:id/complete
adminBookingsRouter.post('/:id/complete', transition('completed'));
