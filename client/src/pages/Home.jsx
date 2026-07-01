import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { business } from '../config.js';
import { formatPrice, formatDuration } from '../lib/format.js';
import { fadeUp } from '../lib/motion.js';
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay-600">
          Book with us
        </p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl font-medium tracking-tight text-stone-800 leading-[1.05]">
          {business.tagline}
        </h1>
        <p className="mt-5 text-lg text-stone-500 leading-relaxed">{business.blurb}</p>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Choose a service
          </h2>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        {state.status === 'loading' && <Loading label="Loading services…" />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={load} />}
        {state.status === 'ready' && state.services.length === 0 && (
          <EmptyState title="No services available yet">
            Please check back soon.
          </EmptyState>
        )}

        {state.status === 'ready' && state.services.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {state.services.map((service, i) => (
              <motion.div key={service.id} {...fadeUp(i * 0.06)}>
                <ServiceCard service={service} />
              </motion.div>
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
      className="group relative flex flex-col rounded-3xl border border-stone-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(60,50,40,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(60,50,40,0.08)] hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl font-medium text-stone-800 group-hover:text-brand-700 transition-colors">
          {service.name}
        </h3>
        <span className="shrink-0 text-sm font-semibold text-clay-600">
          {formatPrice(service.priceCents)}
        </span>
      </div>
      {service.description && (
        <p className="mt-2 text-sm text-stone-500 leading-relaxed flex-1">{service.description}</p>
      )}
      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
        <span className="text-xs uppercase tracking-wider text-stone-400">
          {formatDuration(service.durationMin)}
        </span>
        <span className="text-sm font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
          Book →
        </span>
      </div>
    </Link>
  );
}
