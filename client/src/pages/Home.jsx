import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import { formatPrice, formatDuration } from '../lib/format.js';
import { Loading, ErrorState, EmptyState } from '../components/ui.jsx';

export default function Home() {
  const [state, setState] = useState({ status: 'loading', services: [], error: null });

  function load() {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    api
      .get('/api/services')
      .then((services) => setState({ status: 'ready', services, error: null }))
      .catch((err) => setState({ status: 'error', services: [], error: err.message }));
  }

  useEffect(load, []);

  return (
    <div>
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          {business.tagline}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{business.blurb}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Choose a service
        </h2>

        {state.status === 'loading' && <Loading label="Loading services…" />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={load} />}
        {state.status === 'ready' && state.services.length === 0 && (
          <EmptyState title="No services available yet">
            Please check back soon.
          </EmptyState>
        )}

        {state.status === 'ready' && state.services.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {state.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ServiceCard({ service }) {
  return (
    <Link
      to={`/book/${service.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
          {service.name}
        </h3>
        <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          {formatPrice(service.priceCents)}
        </span>
      </div>
      {service.description && (
        <p className="mt-2 text-sm text-slate-600 flex-1">{service.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">{formatDuration(service.durationMin)}</span>
        <span className="text-sm font-medium text-brand-600 group-hover:translate-x-0.5 transition-transform">
          Book →
        </span>
      </div>
    </Link>
  );
}
