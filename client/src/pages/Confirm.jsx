import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import { formatLongDate, formatTime } from '../lib/format.js';
import { Loading, ErrorState } from '../components/ui.jsx';

export default function Confirm() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', booking: null, error: null });

  function load() {
    setState({ status: 'loading', booking: null, error: null });
    api
      .get(`/api/bookings/${token}`)
      .then((booking) => setState({ status: 'ready', booking, error: null }))
      .catch((err) => setState({ status: 'error', booking: null, error: err.message }));
  }

  useEffect(load, [token]);

  if (state.status === 'loading') return <Loading label="Loading your booking…" />;
  if (state.status === 'error')
    return <ErrorState message={state.error} onRetry={load} />;

  const b = state.booking;
  const cancelled = b.status === 'cancelled';

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        {cancelled ? (
          <Badge tone="slate" label="Cancelled" />
        ) : (
          <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {cancelled ? 'Booking cancelled' : 'You’re booked!'}
        </h1>
        <p className="mt-1 text-slate-600">
          {cancelled
            ? 'This appointment has been cancelled.'
            : `A confirmation has been sent to ${b.customerEmail}.`}
        </p>

        <dl className="mt-6 text-left divide-y divide-slate-100 border-y border-slate-100">
          <Row label="Service" value={b.service?.name} />
          <Row label="Date" value={formatLongDate(b.start, business.timezone)} />
          <Row
            label="Time"
            value={`${formatTime(b.start, business.timezone)} – ${formatTime(b.end, business.timezone)}`}
          />
          <Row label="Name" value={b.customerName} />
        </dl>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Book another
          </Link>
          {!cancelled && (
            <Link
              to={`/cancel/${token}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel this booking
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 text-right">{value}</dd>
    </div>
  );
}

function Badge({ label }) {
  return (
    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
      {label}
    </span>
  );
}
