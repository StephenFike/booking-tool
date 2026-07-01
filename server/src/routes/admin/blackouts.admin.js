import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/errors.js';
import { validate } from '../../lib/validate.js';

export const adminBlackoutsRouter = Router();

const SELECT = `
  SELECT id,
         start_at AS "startAt",
         end_at   AS "endAt",
         reason
    FROM blackouts`;

const blackoutSchema = z
  .object({
    startAt: z.string().datetime({ message: 'expected an ISO 8601 timestamp' }),
    endAt: z.string().datetime({ message: 'expected an ISO 8601 timestamp' }),
    reason: z.string().trim().max(200).optional().default(''),
  })
  .refine((d) => new Date(d.startAt) < new Date(d.endAt), {
    message: 'End must be after start',
    path: ['endAt'],
  });

// GET /api/admin/blackouts — all blocked periods, soonest first.
adminBlackoutsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`${SELECT} ORDER BY start_at`);
    res.json(rows);
  })
);

// POST /api/admin/blackouts — add a blocked period.
adminBlackoutsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const d = validate(blackoutSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO blackouts (start_at, end_at, reason)
       VALUES ($1, $2, $3) RETURNING id`,
      [d.startAt, d.endAt, d.reason]
    );
    const { rows: created } = await pool.query(`${SELECT} WHERE id = $1`, [rows[0].id]);
    res.status(201).json(created[0]);
  })
);

// PUT /api/admin/blackouts/:id — update a blocked period.
adminBlackoutsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const d = validate(blackoutSchema, req.body);
    const { rows } = await pool.query(
      `UPDATE blackouts SET start_at = $2, end_at = $3, reason = $4
        WHERE id = $1 RETURNING id`,
      [req.params.id, d.startAt, d.endAt, d.reason]
    );
    if (!rows[0]) throw new ApiError(404, 'Blackout not found');
    const { rows: updated } = await pool.query(`${SELECT} WHERE id = $1`, [req.params.id]);
    res.json(updated[0]);
  })
);

// DELETE /api/admin/blackouts/:id — remove a blocked period.
adminBlackoutsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM blackouts WHERE id = $1', [
      req.params.id,
    ]);
    if (!rowCount) throw new ApiError(404, 'Blackout not found');
    res.json({ ok: true });
  })
);
