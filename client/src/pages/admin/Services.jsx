import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api.js';
import { formatPrice, formatDuration } from '../../lib/format.js';
import { cardCls, inputCls, labelCls, btnPrimary, btnGhost, btnSm, btnDangerSm } from '../../lib/adminUi.js';
import { listItem, collapse } from '../../lib/motion.js';
import { Loading, ErrorState, EmptyState, Spinner } from '../../components/ui.jsx';

export default function AdminServices() {
  const [state, setState] = useState({ status: 'loading', rows: [], error: null });
  const [editing, setEditing] = useState(null); // null | 'new' | serviceObject
  const [busyId, setBusyId] = useState(null);

  function load() {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    api
      .get('/api/admin/services')
      .then((rows) => setState({ status: 'ready', rows, error: null }))
      .catch((err) => setState({ status: 'error', rows: [], error: err.message }));
  }

  useEffect(load, []);

  async function remove(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.del(`/api/admin/services/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium text-stone-800">Services</h1>
        {!editing && (
          <button onClick={() => setEditing('new')} className={btnPrimary}>
            + Add service
          </button>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div key="form" {...collapse}>
            <div className="mt-5">
              <ServiceForm
                initial={editing === 'new' ? null : editing}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  load();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        {state.status === 'loading' && <Loading label="Loading services…" />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={load} />}
        {state.status === 'ready' && state.rows.length === 0 && (
          <EmptyState title="No services yet">Add your first service to start taking bookings.</EmptyState>
        )}

        {state.status === 'ready' && state.rows.length > 0 && (
          <motion.ul layout className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
            {state.rows.map((s) => (
              <motion.li key={s.id} {...listItem}>
              <div className={`${cardCls} flex items-center gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-800 truncate">{s.name}</p>
                    {!s.active && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                        inactive
                      </span>
                    )}
                  </div>
                  {s.description && <p className="text-sm text-stone-500 truncate">{s.description}</p>}
                  <p className="text-sm text-stone-400">
                    {formatDuration(s.durationMin)} · {formatPrice(s.priceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditing(s)} className={btnSm}>
                    Edit
                  </button>
                  <button disabled={busyId === s.id} onClick={() => remove(s.id)} className={btnDangerSm}>
                    Delete
                  </button>
                </div>
              </div>
              </motion.li>
            ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function ServiceForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [durationMin, setDurationMin] = useState(initial?.durationMin ?? 30);
  const [priceDollars, setPriceDollars] = useState(
    initial ? (initial.priceCents / 100).toString() : '0'
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim(),
      durationMin: Number(durationMin),
      priceCents: Math.round(Number(priceDollars) * 100),
      active,
    };
    try {
      if (initial) await api.put(`/api/admin/services/${initial.id}`, body);
      else await api.post('/api/admin/services', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className={cardCls}>
      <h2 className="font-display text-2xl font-medium text-stone-800">
        {initial ? 'Edit service' : 'New service'}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea
            className={inputCls}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Duration (minutes)</label>
          <input
            className={inputCls}
            type="number"
            min="1"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Price (USD)</label>
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (bookable by customers)
      </label>

      {error && (
        <p className="mt-4 rounded-lg bg-clay-400/10 border border-clay-400/40 px-3 py-2 text-sm text-stone-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Spinner className="h-4 w-4 text-white" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
}
