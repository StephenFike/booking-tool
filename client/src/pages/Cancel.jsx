import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import { formatLongDate, formatTime } from '../lib/format.js';
import { Loading, ErrorState, Spinner } from '../components/ui.jsx';

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
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900">Booking cancelled</h1>
        <p className="mt-1 text-slate-600">This appointment has been cancelled and the time freed up.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 text-center">Cancel booking?</h1>
      <p className="mt-1 text-slate-600 text-center">
        This will free up your time slot. This can’t be undone.
      </p>

      <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
        <Row label="Service" value={b.service?.name} />
        <Row label="Date" value={formatLongDate(b.start, business.timezone)} />
        <Row label="Time" value={formatTime(b.start, business.timezone)} />
      </dl>

      {cancelError && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {cancelError}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={cancelBooking}
          disabled={cancelling}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {cancelling && <Spinner className="h-4 w-4 text-white" />}
          {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <Link
          to={`/confirm/${token}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Keep my booking
        </Link>
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
