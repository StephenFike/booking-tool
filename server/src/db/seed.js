// Seed the database with sample data so the app looks alive on first run.
//
// Re-runnable: it clears the domain tables (not schema_migrations) and inserts
// a fresh set of services, weekly availability, a blackout, one admin user,
// and a few upcoming bookings.
//
//   npm run seed --workspace=server

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool.js';
import { env } from '../config/env.js';

/** Build a UTC Date `days` from today at the given hour:minute. */
function upcoming(days, hour, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function seed() {
  await withTransaction(async (client) => {
    // Wipe domain data; RESTART IDENTITY resets the SERIAL counters, CASCADE
    // clears dependent rows (bookings reference services).
    await client.query(
      'TRUNCATE bookings, availability, blackouts, services, users RESTART IDENTITY CASCADE'
    );

    // --- Admin user ---------------------------------------------------------
    const passwordHash = await bcrypt.hash(env.seedAdminPassword, 10);
    await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      [env.seedAdminEmail, passwordHash, 'admin']
    );

    // --- Services -----------------------------------------------------------
    const services = [
      ['Consultation', 'A 30-minute intro call to scope your needs.', 30, 0],
      ['Standard Session', 'A focused 60-minute working session.', 60, 8000],
      ['Extended Session', 'A deep-dive 90-minute session.', 90, 11000],
      ['Follow-up', 'A 45-minute check-in for existing clients.', 45, 6000],
    ];
    const serviceIds = [];
    for (const [name, description, durationMin, priceCents] of services) {
      const { rows } = await client.query(
        `INSERT INTO services (name, description, duration_min, price_cents)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, description, durationMin, priceCents]
      );
      serviceIds.push(rows[0].id);
    }

    // --- Weekly availability: Mon-Fri, 09:00-17:00 --------------------------
    for (let weekday = 1; weekday <= 5; weekday += 1) {
      await client.query(
        `INSERT INTO availability (weekday, start_time, end_time)
         VALUES ($1, '09:00', '17:00')`,
        [weekday]
      );
    }

    // --- A sample blackout (a two-hour break 3 days out) --------------------
    await client.query(
      'INSERT INTO blackouts (start_at, end_at, reason) VALUES ($1, $2, $3)',
      [upcoming(3, 12), upcoming(3, 14), 'Team lunch']
    );

    // --- A few upcoming confirmed bookings ----------------------------------
    const sampleBookings = [
      [serviceIds[0], 'Jordan Lee', 'jordan@example.com', '555-0101', upcoming(1, 9, 0), 30],
      [serviceIds[1], 'Priya Shah', 'priya@example.com', '555-0102', upcoming(1, 13, 0), 60],
      [serviceIds[2], 'Marco Diaz', 'marco@example.com', null, upcoming(2, 10, 0), 90],
    ];
    for (const [serviceId, name, email, phone, startAt, durationMin] of sampleBookings) {
      const endAt = new Date(startAt.getTime() + durationMin * 60_000);
      await client.query(
        `INSERT INTO bookings
           (service_id, customer_name, customer_email, customer_phone,
            start_at, end_at, cancel_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [serviceId, name, email, phone, startAt, endAt, crypto.randomUUID()]
      );
    }
  });

  console.log('Seed complete.');
  console.log(`Demo admin login: ${env.seedAdminEmail} / ${env.seedAdminPassword}`);
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await pool.end();
    process.exit(1);
  });
