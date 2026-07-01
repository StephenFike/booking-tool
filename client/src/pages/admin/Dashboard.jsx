import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { business } from '../../config.js';
import { formatLongDate, formatTime } from '../../lib/format.js';
import { cardCls, statusBadge } from '../../lib/adminUi.js';
import { Loading, ErrorState, EmptyState } from '../../components/ui.jsx';

export default function Dashboard() {
  const [state, setState] = useState({ status: 'loading', stats: null, upcoming: [], error: null });

  function load() {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    Promise.all([api.get('/api/admin/stats'), api.get('/api/admin/bookings?scope=upcoming')])
      .then(([stats, upcoming]) => setState({ status: 'ready', stats, upcoming, error: null }))
      .catch((err) => setState({ status: 'error', stats: null, upcoming: [], error: err.message }));
  }

  useEffect(load, []);

  if (state.status === 'loading') return <Loading label="Loading dashboard…" />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={load} />;

  const { stats, upcoming } = state;

  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-stone-800">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Bookings this week" value={stats.bookingsThisWeek} />
        <Stat label="Upcoming" value={stats.upcomingCount} />
        <Stat
          label="Most booked"
          value={stats.mostBookedService?.name ?? '—'}
          sub={stats.mostBookedService ? `${stats.mostBookedService.count} bookings` : null}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium text-stone-800">Next up</h2>
        <Link to="/admin/bookings" className="text-sm font-semibold text-brand-700 hover:underline">
          View all →
        </Link>
      </div>

      <div className="mt-4">
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming bookings">New bookings will appear here.</EmptyState>
        ) : (
          <div className={`${cardCls} divide-y divide-stone-100 p-0`}>
            {upcoming.slice(0, 6).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{b.customerName}</p>
                  <p className="text-sm text-stone-500 truncate">{b.serviceName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-stone-700">
                    {formatLongDate(b.start, business.timezone)}
                  </p>
                  <p className="text-sm text-stone-500">{formatTime(b.start, business.timezone)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className={cardCls}>
      <p className="text-xs uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-2 font-display text-4xl font-medium text-stone-800">{value}</p>
      {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
    </div>
  );
}
