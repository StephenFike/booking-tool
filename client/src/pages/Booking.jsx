import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import {
  formatPrice,
  formatDuration,
  formatTime,
  formatLongDate,
  timeZoneLabel,
  todayInTimeZone,
} from '../lib/format.js';
import { Loading, ErrorState } from '../components/ui.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import BookingForm from '../components/BookingForm.jsx';

const cardClass =
  'rounded-3xl border border-stone-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(60,50,40,0.04)]';

export default function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState({ status: 'loading', data: null, error: null });
  const [date, setDate] = useState(() => todayInTimeZone(business.timezone));
  const [avail, setAvail] = useState({ status: 'idle', slots: [], timezone: business.timezone, error: null });
  const [selected, setSelected] = useState(null);
  const [submit, setSubmit] = useState({ pending: false, error: null });

  // Load the service being booked (from the services list).
  const loadService = useCallback(() => {
    setService({ status: 'loading', data: null, error: null });
    api
      .get('/api/services')
      .then((services) => {
        const found = services.find((s) => String(s.id) === String(serviceId));
        if (!found) setService({ status: 'error', data: null, error: 'Service not found.' });
        else setService({ status: 'ready', data: found, error: null });
      })
      .catch((err) => setService({ status: 'error', data: null, error: err.message }));
  }, [serviceId]);

  useEffect(loadService, [loadService]);

  // Load availability whenever the service or date changes.
  const loadAvailability = useCallback(() => {
    setSelected(null);
    setAvail((a) => ({ ...a, status: 'loading', error: null }));
    api
      .get(`/api/availability?serviceId=${serviceId}&date=${date}`)
      .then((res) =>
        setAvail({ status: 'ready', slots: res.slots, timezone: res.timezone, error: null })
      )
      .catch((err) =>
        setAvail({ status: 'error', slots: [], timezone: business.timezone, error: err.message })
      );
  }, [serviceId, date]);

  useEffect(loadAvailability, [loadAvailability]);

  function handleSubmit(details) {
    setSubmit({ pending: true, error: null });
    api
      .post('/api/bookings', { serviceId: Number(serviceId), start: selected, ...details })
      .then((booking) => navigate(`/confirm/${booking.token}`))
      .catch((err) => {
        setSubmit({ pending: false, error: err.message });
        // The slot may have been taken — refresh availability so the user can repick.
        loadAvailability();
      });
  }

  if (service.status === 'loading') return <Loading label="Loading service…" />;
  if (service.status === 'error')
    return (
      <div className="max-w-lg mx-auto">
        <ErrorState message={service.error} onRetry={loadService} />
        <div className="mt-4 text-center">
          <Link to="/" className="text-brand-700 hover:underline text-sm">
            ← Back to services
          </Link>
        </div>
      </div>
    );

  const svc = service.data;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-stone-400 hover:text-brand-700 transition-colors">
        ← All services
      </Link>

      {/* Service header */}
      <div className={`mt-4 ${cardClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-medium text-stone-800">{svc.name}</h1>
            {svc.description && <p className="mt-1.5 text-stone-500 leading-relaxed">{svc.description}</p>}
          </div>
          <span className="shrink-0 text-base font-semibold text-clay-600">
            {formatPrice(svc.priceCents)}
          </span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-stone-400">
          {formatDuration(svc.durationMin)}
        </p>
      </div>

      {/* Date + slots */}
      <div className={`mt-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-display text-2xl font-medium text-stone-800">Pick a time</h2>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-stone-400">Date</span>
            <input
              type="date"
              value={date}
              min={todayInTimeZone(business.timezone)}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-stone-800 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </div>

        <div className="mt-5">
          <SlotPicker
            status={avail.status}
            slots={avail.slots}
            timezone={avail.timezone}
            selected={selected}
            onSelect={setSelected}
            error={avail.error}
            onRetry={loadAvailability}
          />
        </div>
        {avail.status === 'ready' && avail.slots.length > 0 && (
          <p className="mt-4 text-xs text-stone-400">
            Times shown in {timeZoneLabel(avail.slots[0], avail.timezone)}.
          </p>
        )}
      </div>

      {/* Details form (appears once a slot is chosen) */}
      {selected && (
        <div className={`mt-6 ${cardClass}`}>
          <h2 className="font-display text-2xl font-medium text-stone-800">Your details</h2>
          <p className="mt-1.5 text-sm text-stone-500">
            {svc.name} on{' '}
            <span className="font-semibold text-stone-700">
              {formatLongDate(selected, avail.timezone)}
            </span>{' '}
            at{' '}
            <span className="font-semibold text-stone-700">
              {formatTime(selected, avail.timezone)}
            </span>
          </p>
          <div className="mt-5">
            <BookingForm
              onSubmit={handleSubmit}
              submitting={submit.pending}
              serverError={submit.error}
            />
          </div>
        </div>
      )}
    </div>
  );
}
