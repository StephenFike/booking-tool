// Add a batch of random test bookings to upcoming open slots — handy for
// exercising the admin views without booking by hand each time.
//
// Appends (does not wipe). Re-run to add more.
//
//   npm run seed:bookings          # adds 12 by default
//   node src/db/seed-bookings.js 25   # or pass a count directly
//
// Every booking is placed in a genuinely open slot (working hours minus
// existing bookings, blackouts, and past times), so none ever conflict.

import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { pool } from './pool.js';
import { env } from '../config/env.js';
import { computeOpenSlots, luxonToDbWeekday } from '../domain/slots.js';

const TZ = env.businessTimezone;
const COUNT = Number(process.argv[2]) || 12;
const DAYS_AHEAD = 21;

const FIRST = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Devon', 'Harper', 'Reese', 'Rowan', 'Parker', 'Sasha'];
const LAST = ['Nguyen', 'Patel', 'Garcia', 'Kim', 'Johnson', 'Rossi', 'Silva', 'Cohen', 'Okafor', 'Santos', 'Ahmed', 'Brooks', 'Ivanov', 'Lee', 'Torres', 'Bauer'];
const NOTES = [null, null, null, null, 'First time — looking forward to it!', 'Please call when ready', 'Might be a few minutes late', 'Prefer a quiet session'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const { rows: services } = await pool.query(
    'SELECT id, duration_min AS "durationMin" FROM services WHERE active = TRUE'
  );
  if (services.length === 0) {
    console.error('No active services found. Run `npm run seed` first.');
    process.exit(1);
  }

  let created = 0;
  let attempts = 0;
  const maxAttempts = COUNT * 40;

  while (created < COUNT && attempts < maxAttempts) {
    attempts += 1;

    const day = DateTime.now()
      .setZone(TZ)
      .startOf('day')
      .plus({ days: 1 + Math.floor(Math.random() * DAYS_AHEAD) });
    const dateStr = day.toISODate();
    const service = pick(services);
    const weekday = luxonToDbWeekday(day.weekday);

    const { rows: hours } = await pool.query(
      'SELECT start_time, end_time FROM availability WHERE weekday = $1',
      [weekday]
    );
    if (hours.length === 0) continue; // closed that day

    const dayStart = day.startOf('day').toUTC().toJSDate();
    const dayEnd = day.endOf('day').toUTC().toJSDate();
    const { rows: bookings } = await pool.query(
      `SELECT start_at AS start, end_at AS end FROM bookings
        WHERE status = 'confirmed' AND start_at < $2 AND end_at > $1`,
      [dayStart, dayEnd]
    );
    const { rows: blackouts } = await pool.query(
      `SELECT start_at AS start, end_at AS end FROM blackouts
        WHERE start_at < $2 AND end_at > $1`,
      [dayStart, dayEnd]
    );

    const slots = computeOpenSlots({
      date: dateStr,
      timezone: TZ,
      durationMin: service.durationMin,
      workingHours: hours,
      busyIntervals: [...bookings, ...blackouts],
      now: new Date(),
    });
    if (slots.length === 0) continue;

    const start = new Date(pick(slots));
    const end = new Date(start.getTime() + service.durationMin * 60_000);
    const first = pick(FIRST);
    const last = pick(LAST);

    try {
      await pool.query(
        `INSERT INTO bookings
           (service_id, customer_name, customer_email, customer_phone, note,
            start_at, end_at, cancel_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          service.id,
          `${first} ${last}`,
          `${first}.${last}@example.com`.toLowerCase(),
          Math.random() < 0.7 ? `555-01${Math.floor(Math.random() * 90) + 10}` : null,
          pick(NOTES),
          start,
          end,
          crypto.randomUUID(),
        ]
      );
      created += 1;
    } catch (err) {
      if (err.code === '23P01') continue; // slot was taken — try another
      throw err;
    }
  }

  console.log(`Added ${created} test booking(s).`);
  if (created < COUNT) {
    console.log(`(Wanted ${COUNT}, but ran out of open slots in the next ${DAYS_AHEAD} days.)`);
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Failed:', err.message);
    await pool.end();
    process.exit(1);
  });
