// Small shared UI primitives: spinner, and loading / error / empty states.

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={`animate-spin text-brand-600 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-stone-500 py-16 justify-center">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-clay-400/40 bg-clay-400/10 p-6 text-center">
      <p className="font-display text-xl text-stone-800">Something went wrong</p>
      <p className="mt-1 text-sm text-stone-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
      <p className="font-display text-xl text-stone-700">{title}</p>
      {children && <p className="mt-1 text-sm text-stone-500">{children}</p>}
    </div>
  );
}
