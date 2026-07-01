import { DateTime, Interval } from 'luxon';

/**
 * Convert Luxon's weekday (1=Mon … 7=Sun) to the DB/JS convention
 * (0=Sun … 6=Sat) used by the `availability.weekday` column.
 */
export function luxonToDbWeekday(luxonWeekday) {
  return luxonWeekday % 7;
}

/**
 * Compute the open booking slots for a single day.
 *
 * Implements the algorithm from the spec:
 *   1. Start from the recurring working hours for that weekday.
 *   2. Generate candidate slots on a fixed grid at the service's duration.
 *   3. Drop slots overlapping a busy interval (confirmed booking or blackout).
 *   4. Drop slots in the past (relative to `now`).
 *   5. Return the remaining slot start times.
 *
 * All wall-clock reasoning happens in the business timezone; the returned
 * start times are UTC ISO strings.
 *
 * @param {object}   args
 * @param {string}   args.date          Calendar date 'YYYY-MM-DD' in the business tz.
 * @param {string}   args.timezone      IANA business timezone.
 * @param {number}   args.durationMin   Service duration in minutes (also the grid step).
 * @param {Array<{start_time: string, end_time: string}>} args.workingHours
 *        Working-hour blocks for the date's weekday ('HH:MM:SS' wall-clock).
 * @param {Array<{start: Date, end: Date}>} args.busyIntervals
 *        Confirmed bookings and blackouts that may overlap the day.
 * @param {Date}     args.now           Current instant (for past-slot filtering).
 * @returns {string[]} UTC ISO start times of open slots, ascending.
 */
export function computeOpenSlots({
  date,
  timezone,
  durationMin,
  workingHours,
  busyIntervals,
  now,
}) {
  const nowDt = DateTime.fromJSDate(now).setZone(timezone);
  const busy = busyIntervals.map((b) =>
    Interval.fromDateTimes(
      DateTime.fromJSDate(b.start),
      DateTime.fromJSDate(b.end)
    )
  );

  const slots = [];

  for (const block of workingHours) {
    const windowStart = DateTime.fromISO(`${date}T${block.start_time}`, {
      zone: timezone,
    });
    const windowEnd = DateTime.fromISO(`${date}T${block.end_time}`, {
      zone: timezone,
    });
    if (!windowStart.isValid || !windowEnd.isValid) continue;

    let cursor = windowStart;
    // A slot fits only if it ends on or before the window closes.
    while (cursor.plus({ minutes: durationMin }) <= windowEnd) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: durationMin });
      const slot = Interval.fromDateTimes(slotStart, slotEnd);

      const isPast = slotStart <= nowDt;
      const isBusy = busy.some((b) => b.overlaps(slot));

      if (!isPast && !isBusy) {
        slots.push(slotStart.toUTC().toISO({ suppressMilliseconds: true }));
      }

      // Fixed grid: step by the service duration.
      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  return slots.sort();
}
