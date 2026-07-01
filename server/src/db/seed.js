// Seed the database with sample data so the app looks alive on first run.
//
// Re-runnable: it clears the domain tables (not schema_migrations) and inserts
// a fresh set of services, weekly availability, a blackout, one admin user,
// and a few upcoming bookings.
//
//   npm run seed --workspace=server

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { pool, withTransaction } from './pool.js';
import { env } from '../config/env.js';

const TZ = env.businessTimezone;

/** The next `count` weekdays (Mon–Fri), starting tomorrow, in the business tz. */
function nextWeekdays(count) {
  const days = [];
  let d = DateTime.now().setZone(TZ).startOf('day').plus({ days: 1 });
  while (days.length < count) {
    if (d.weekday >= 1 && d.weekday <= 5) days.push(d); // 1=Mon … 5=Fri
    d = d.plus({ days: 1 });
  }
  return days;
}

/** A UTC Date for the given local wall-clock time on `day` (a Luxon DateTime). */
function atLocal(day, hour, minute = 0) {
  return day.set({ hour, minute, second: 0, millisecond: 0 }).toUTC().toJSDate();
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

    const [day1, day2, day3] = nextWeekdays(3);

    // --- A sample blackout (a midday break on the first weekday) ------------
    await client.query(
      'INSERT INTO blackouts (start_at, end_at, reason) VALUES ($1, $2, $3)',
      [atLocal(day1, 12, 0), atLocal(day1, 14, 0), 'Team lunch']
    );

    // --- A few upcoming confirmed bookings (local wall-clock times) ---------
    const sampleBookings = [
      [serviceIds[0], 'Jordan Lee', 'jordan@example.com', '555-0101', atLocal(day1, 10, 0), 30],
      [serviceIds[1], 'Priya Shah', 'priya@example.com', '555-0102', atLocal(day2, 14, 0), 60],
      [serviceIds[2], 'Marco Diaz', 'marco@example.com', null, atLocal(day3, 11, 30), 90],
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
