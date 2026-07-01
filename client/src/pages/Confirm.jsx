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
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={load} />;

  const b = state.booking;
  const cancelled = b.status === 'cancelled';

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-3xl border border-stone-200/80 bg-white p-9 shadow-[0_1px_2px_rgba(60,50,40,0.04)] text-center">
        {cancelled ? (
          <span className="inline-block rounded-full bg-stone-100 px-4 py-1 text-sm font-medium text-stone-500">
            Cancelled
          </span>
        ) : (
          <div className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-brand-50 ring-8 ring-brand-50/50">
            <svg className="h-8 w-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <h1 className="mt-5 font-display text-4xl font-medium text-stone-800">
          {cancelled ? 'Booking cancelled' : 'You’re all set'}
        </h1>
        <p className="mt-2 text-stone-500">
          {cancelled
            ? 'This appointment has been cancelled.'
            : `A confirmation has been sent to ${b.customerEmail}.`}
        </p>

        <dl className="mt-7 text-left divide-y divide-stone-100 border-y border-stone-100">
          <Row label="Service" value={b.service?.name} />
          <Row label="Date" value={formatLongDate(b.start, business.timezone)} />
          <Row
            label="Time"
            value={`${formatTime(b.start, business.timezone)} – ${formatTime(b.end, business.timezone)}`}
          />
          <Row label="Name" value={b.customerName} />
        </dl>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Book another
          </Link>
          {!cancelled && (
            <Link
              to={`/cancel/${token}`}
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
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
    <div className="flex justify-between gap-4 py-3.5">
      <dt className="text-sm text-stone-400">{label}</dt>
      <dd className="text-sm font-semibold text-stone-700 text-right">{value}</dd>
    </div>
  );
}
