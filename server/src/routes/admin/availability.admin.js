import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/errors.js';
import { validate } from '../../lib/validate.js';

export const adminAvailabilityRouter = Router();

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM, 24h

const SELECT = `
  SELECT id, weekday,
         to_char(start_time, 'HH24:MI') AS "startTime",
         to_char(end_time,   'HH24:MI') AS "endTime"
    FROM availability`;

const blockSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_RE, 'expected HH:MM'),
    endTime: z.string().regex(TIME_RE, 'expected HH:MM'),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

// GET /api/admin/availability — all weekly working-hour blocks.
adminAvailabilityRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`${SELECT} ORDER BY weekday, start_time`);
    res.json(rows);
  })
);

// POST /api/admin/availability — add a working-hour block.
adminAvailabilityRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const d = validate(blockSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO availability (weekday, start_time, end_time)
       VALUES ($1, $2, $3) RETURNING id`,
      [d.weekday, d.startTime, d.endTime]
    );
    const { rows: created } = await pool.query(`${SELECT} WHERE id = $1`, [rows[0].id]);
    res.status(201).json(created[0]);
  })
);

// PUT /api/admin/availability/:id — update a block.
adminAvailabilityRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const d = validate(blockSchema, req.body);
    const { rows } = await pool.query(
      `UPDATE availability SET weekday = $2, start_time = $3, end_time = $4
        WHERE id = $1 RETURNING id`,
      [req.params.id, d.weekday, d.startTime, d.endTime]
    );
    if (!rows[0]) throw new ApiError(404, 'Availability block not found');
    const { rows: updated } = await pool.query(`${SELECT} WHERE id = $1`, [req.params.id]);
    res.json(updated[0]);
  })
);

// DELETE /api/admin/availability/:id — remove a block.
adminAvailabilityRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM availability WHERE id = $1', [
      req.params.id,
    ]);
    if (!rowCount) throw new ApiError(404, 'Availability block not found');
    res.json({ ok: true });
  })
);
