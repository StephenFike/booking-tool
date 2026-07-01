import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const servicesRouter = Router();

// GET /api/services — active services for the public landing page.
servicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT id,
              name,
              description,
              duration_min AS "durationMin",
              price_cents  AS "priceCents"
         FROM services
        WHERE active = TRUE
        ORDER BY name`
    );
    res.json(rows);
  })
);
