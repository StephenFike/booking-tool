import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import { api } from '../../lib/api.js';
import { business } from '../../config.js';
import { formatLongDate, formatTime } from '../../lib/format.js';
import { cardCls, inputCls, labelCls, btnPrimary, btnSm, btnDangerSm, WEEKDAYS } from '../../lib/adminUi.js';
import { listItem } from '../../lib/motion.js';
import { Loading, ErrorState } from '../../components/ui.jsx';

export default function AdminAvailability() {
  const [state, setState] = useState({ status: 'loading', hours: [], blackouts: [], error: null });

  function load({ quiet = false } = {}) {
    if (!quiet) setState((s) => ({ ...s, status: 'loading', error: null }));
    Promise.all([api.get('/api/admin/availability'), api.get('/api/admin/blackouts')])
      .then(([hours, blackouts]) => setState({ status: 'ready', hours, blackouts, error: null }))
      .catch((err) => setState({ status: 'error', hours: [], blackouts: [], error: err.message }));
  }

  useEffect(() => {
    load();
  }, []);

  const reload = () => load({ quiet: true });
  const removeHour = (id) => setState((s) => ({ ...s, hours: s.hours.filter((h) => h.id !== id) }));
  const removeBlackout = (id) =>
    setState((s) => ({ ...s, blackouts: s.blackouts.filter((b) => b.id !== id) }));

  if (state.status === 'loading') return <Loading label="Loading hours…" />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={() => load()} />;

  return (
    <div className="space-y-10">
      <WeeklyHours hours={state.hours} reload={reload} onRemoved={removeHour} />
      <Blackouts blackouts={state.blackouts} reload={reload} onRemoved={removeBlackout} />
    </div>
  );
}

/* ---------------- Weekly working hours ---------------- */

function WeeklyHours({ hours, reload, onRemoved }) {
  const [weekday, setWeekday] = useState('1');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const byDay = WEEKDAYS.map((_, i) => hours.filter((h) => h.weekday === i));

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/api/admin/availability', {
        weekday: Number(weekday),
        startTime: start,
        endTime: end,
      });
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.del(`/api/admin/availability/${id}`);
      onRemoved(id);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <section>
      <h1 className="font-display text-3xl font-medium text-stone-800">Weekly hours</h1>
      <p className="mt-1 text-stone-500">The recurring hours customers can book within.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={cardCls}>
            <p className="font-semibold text-stone-800">{day}</p>
            <div className="mt-2 space-y-1.5">
              {byDay[i].length === 0 ? (
                <p className="text-sm text-stone-400">Closed</p>
              ) : (
                byDay[i].map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-stone-600">
                      {h.startTime} – {h.endTime}
                    </span>
                    <button onClick={() => remove(h.id)} className={btnDangerSm}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={add} className={`mt-5 ${cardCls}`}>
        <p className="font-semibold text-stone-800">Add hours</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls}>Day</label>
            <select className={inputCls} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAYS.map((day, i) => (
                <option key={day} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>From</label>
            <input type="time" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="time" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className={btnPrimary}>
            Add
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-clay-600">{error}</p>}
      </form>
    </section>
  );
}

/* ---------------- One-off blackouts ---------------- */

function Blackouts({ blackouts, reload, onRemoved }) {
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Interpret the datetime-local value as business-timezone wall time.
  function toUtcIso(local) {
    return DateTime.fromISO(local, { zone: business.timezone }).toUTC().toISO();
  }

  async function add(e) {
    e.preventDefault();
    setError(null);
    if (!startLocal || !endLocal) {
      setError('Please set both a start and end time.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/blackouts', {
        startAt: toUtcIso(startLocal),
        endAt: toUtcIso(endLocal),
        reason: reason.trim(),
      });
      setStartLocal('');
      setEndLocal('');
      setReason('');
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.del(`/api/admin/blackouts/${id}`);
      onRemoved(id);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <section>
      <h2 className="font-display text-3xl font-medium text-stone-800">Blocked dates</h2>
      <p className="mt-1 text-stone-500">One-off holidays or breaks that override your weekly hours.</p>

      <div className="mt-5">
        {blackouts.length === 0 ? (
          <p className="text-sm text-stone-400">No blocked dates.</p>
        ) : (
          <motion.ul layout className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {blackouts.map((b) => (
                <motion.li key={b.id} {...listItem}>
                  <div className={`${cardCls} flex items-center justify-between gap-4`}>
                    <div>
                      <p className="font-medium text-stone-800">
                        {formatLongDate(b.startAt, business.timezone)}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatTime(b.startAt, business.timezone)} –{' '}
                        {formatTime(b.endAt, business.timezone)}
                        {b.reason ? ` · ${b.reason}` : ''}
                      </p>
                    </div>
                    <button onClick={() => remove(b.id)} className={btnDangerSm}>
                      Remove
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <form onSubmit={add} className={`mt-5 ${cardCls}`}>
        <p className="font-semibold text-stone-800">Add blocked period</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>From</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Reason (optional)</label>
            <input
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Holiday, staff training, etc."
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-clay-600">{error}</p>}
        <button type="submit" disabled={saving} className={`mt-4 ${btnPrimary}`}>
          {saving ? 'Adding…' : 'Add blocked period'}
        </button>
      </form>
    </section>
  );
}
