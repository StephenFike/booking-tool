import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { business } from '../../config.js';
import { formatLongDate, formatTime } from '../../lib/format.js';
import { cardCls, btnSm, btnDangerSm, statusBadge } from '../../lib/adminUi.js';
import { Loading, ErrorState, EmptyState } from '../../components/ui.jsx';

const SCOPES = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past & closed' },
  { key: 'all', label: 'All' },
];

export default function AdminBookings() {
  const [scope, setScope] = useState('upcoming');
  const [state, setState] = useState({ status: 'loading', rows: [], error: null });
  const [busyId, setBusyId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    api
      .get(`/api/admin/bookings?scope=${scope}`)
      .then((rows) => setState({ status: 'ready', rows, error: null }))
      .catch((err) => setState({ status: 'error', rows: [], error: err.message }));
  }, [scope]);

  useEffect(load, [load]);

  async function act(id, action) {
    setBusyId(id);
    try {
      await api.post(`/api/admin/bookings/${id}/${action}`);
      setConfirmCancelId(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-stone-800">Bookings</h1>

      <div className="mt-5 flex gap-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ' +
              (scope === s.key ? 'bg-brand-600 text-white' : 'text-stone-500 hover:bg-stone-100')
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {state.status === 'loading' && <Loading label="Loading bookings…" />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={load} />}
        {state.status === 'ready' && state.rows.length === 0 && (
          <EmptyState title="No bookings here">Try a different filter.</EmptyState>
        )}

        {state.status === 'ready' && state.rows.length > 0 && (
          <div className="space-y-3">
            {state.rows.map((b) => (
              <div key={b.id} className={`${cardCls} flex flex-col sm:flex-row sm:items-center gap-4`}>
                <div className="sm:w-44 shrink-0">
                  <p className="font-medium text-stone-800">
                    {formatLongDate(b.start, business.timezone)}
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatTime(b.start, business.timezone)} – {formatTime(b.end, business.timezone)}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-800 truncate">{b.customerName}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 truncate">{b.serviceName}</p>
                  <p className="text-sm text-stone-400 truncate">
                    {b.customerEmail}
                    {b.customerPhone ? ` · ${b.customerPhone}` : ''}
                  </p>
                  {b.note && <p className="mt-1 text-sm text-stone-500 italic">“{b.note}”</p>}
                </div>

                {b.status === 'confirmed' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmCancelId === b.id ? (
                      <>
                        <span className="text-sm text-stone-500">Sure?</span>
                        <button
                          disabled={busyId === b.id}
                          onClick={() => act(b.id, 'cancel')}
                          className={btnDangerSm}
                        >
                          Yes, cancel
                        </button>
                        <button onClick={() => setConfirmCancelId(null)} className={btnSm}>
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          disabled={busyId === b.id}
                          onClick={() => act(b.id, 'complete')}
                          className={btnSm}
                        >
                          Mark complete
                        </button>
                        <button onClick={() => setConfirmCancelId(b.id)} className={btnDangerSm}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
