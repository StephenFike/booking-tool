import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/errors.js';
import { validate } from '../../lib/validate.js';

export const adminServicesRouter = Router();

const FK_VIOLATION = '23503';

const SELECT = `
  SELECT id, name, description,
         duration_min AS "durationMin",
         price_cents  AS "priceCents",
         active,
         created_at   AS "createdAt"
    FROM services`;

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().default(''),
  durationMin: z.coerce.number().int().positive().max(1440),
  priceCents: z.coerce.number().int().min(0).default(0),
  active: z.boolean().optional().default(true),
});

// GET /api/admin/services — all services (including inactive).
adminServicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`${SELECT} ORDER BY active DESC, name`);
    res.json(rows);
  })
);

// POST /api/admin/services — create.
adminServicesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const d = validate(serviceSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO services (name, description, duration_min, price_cents, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [d.name, d.description, d.durationMin, d.priceCents, d.active]
    );
    const { rows: created } = await pool.query(`${SELECT} WHERE id = $1`, [rows[0].id]);
    res.status(201).json(created[0]);
  })
);

// PUT /api/admin/services/:id — update.
adminServicesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const d = validate(serviceSchema, req.body);
    const { rows } = await pool.query(
      `UPDATE services
          SET name = $2, description = $3, duration_min = $4, price_cents = $5, active = $6
        WHERE id = $1
      RETURNING id`,
      [req.params.id, d.name, d.description, d.durationMin, d.priceCents, d.active]
    );
    if (!rows[0]) throw new ApiError(404, 'Service not found');
    const { rows: updated } = await pool.query(`${SELECT} WHERE id = $1`, [req.params.id]);
    res.json(updated[0]);
  })
);

// DELETE /api/admin/services/:id — delete, or 409 if it has bookings.
adminServicesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const { rowCount } = await pool.query('DELETE FROM services WHERE id = $1', [
        req.params.id,
      ]);
      if (!rowCount) throw new ApiError(404, 'Service not found');
      res.json({ ok: true });
    } catch (err) {
      if (err.code === FK_VIOLATION) {
        throw new ApiError(
          409,
          'This service has bookings and can’t be deleted. Deactivate it instead.'
        );
      }
      throw err;
    }
  })
);
