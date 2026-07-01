// Formatting helpers. Times are displayed in the business timezone returned by
// the API, since availability is computed in that single timezone.

/** "$80", "$110.50", or "Free" for a price in cents. */
export function formatPrice(priceCents) {
  if (!priceCents) return 'Free';
  const dollars = priceCents / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  });
}

/** "30 min", "1 hr", "1 hr 30 min". */
export function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];
  if (hrs) parts.push(`${hrs} hr`);
  if (mins) parts.push(`${mins} min`);
  return parts.join(' ') || '0 min';
}

/** "9:00 AM" for an ISO instant, rendered in the given timezone. */
export function formatTime(iso, timeZone) {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Wednesday, July 1, 2026" for an ISO instant, in the given timezone. */
export function formatLongDate(iso, timeZone) {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Short timezone label like "EDT" for display next to times. */
export function timeZoneLabel(iso, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
}

/** Today's date as YYYY-MM-DD in the given timezone (for the date input). */
export function todayInTimeZone(timeZone) {
  // en-CA formats as YYYY-MM-DD.
  return new Date().toLocaleDateString('en-CA', { timeZone });
}
