import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { servicesRouter } from './routes/services.routes.js';
import { availabilityRouter } from './routes/availability.routes.js';
import { bookingsRouter } from './routes/bookings.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Liveness + DB connectivity check.
  app.get('/api/health', async (_req, res, next) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
      next(err);
    }
  });

  // Public routes.
  app.use('/api/services', servicesRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/bookings', bookingsRouter);

  // Admin routes are mounted here as they are built:
  //   app.use('/api/auth', authRouter);
  //   app.use('/api/admin', requireAuth, adminRouter);

  // 404 for unknown API routes.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler — never leak stack traces to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: err.expose ? err.message : 'Internal server error',
    });
  });

  return app;
}
