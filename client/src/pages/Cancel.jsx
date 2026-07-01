import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import { formatLongDate, formatTime } from '../lib/format.js';
import { Loading, ErrorState, Spinner } from '../components/ui.jsx';

const cardClass =
  'max-w-lg mx-auto rounded-3xl border border-stone-200/80 bg-white p-9 shadow-[0_1px_2px_rgba(60,50,40,0.04)]';

export default function Cancel() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', booking: null, error: null });
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  function load() {
    setState({ status: 'loading', booking: null, error: null });
    api
      .get(`/api/bookings/${token}`)
      .then((booking) => setState({ status: 'ready', booking, error: null }))
      .catch((err) => setState({ status: 'error', booking: null, error: err.message }));
  }

  useEffect(load, [token]);

  function cancelBooking() {
    setCancelling(true);
    setCancelError(null);
    api
      .post(`/api/bookings/${token}/cancel`)
      .then((booking) => setState({ status: 'ready', booking, error: null }))
      .catch((err) => setCancelError(err.message))
      .finally(() => setCancelling(false));
  }

  if (state.status === 'loading') return <Loading label="Loading your booking…" />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={load} />;

  const b = state.booking;

  if (b.status === 'cancelled') {
    return (
      <div className={`${cardClass} text-center`}>
        <h1 className="font-display text-4xl font-medium text-stone-800">Booking cancelled</h1>
        <p className="mt-2 text-stone-500">This appointment has been cancelled and the time freed up.</p>
        <Link
          to="/"
          className="mt-7 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h1 className="font-display text-4xl font-medium text-stone-800 text-center">Cancel booking?</h1>
      <p className="mt-2 text-stone-500 text-center">
        This will free up your time slot. This can’t be undone.
      </p>

      <dl className="mt-7 divide-y divide-stone-100 border-y border-stone-100">
        <Row label="Service" value={b.service?.name} />
        <Row label="Date" value={formatLongDate(b.start, business.timezone)} />
        <Row label="Time" value={formatTime(b.start, business.timezone)} />
      </dl>

      {cancelError && (
        <p className="mt-4 rounded-xl bg-clay-400/10 border border-clay-400/40 px-4 py-2.5 text-sm text-stone-700">
          {cancelError}
        </p>
      )}

      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={cancelBooking}
          disabled={cancelling}
          className="flex items-center justify-center gap-2 rounded-full bg-clay-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-500 transition-colors disabled:opacity-60"
        >
          {cancelling && <Spinner className="h-4 w-4 text-white" />}
          {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <Link
          to={`/confirm/${token}`}
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors text-center"
        >
          Keep my booking
        </Link>
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
