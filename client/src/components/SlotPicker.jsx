import { formatTime } from '../lib/format.js';
import { Loading, ErrorState, EmptyState } from './ui.jsx';

// Renders a grid of selectable time slots for the chosen day.
export default function SlotPicker({ status, slots, timezone, selected, onSelect, error, onRetry }) {
  if (status === 'loading') return <Loading label="Checking availability…" />;
  if (status === 'error') return <ErrorState message={error} onRetry={onRetry} />;
  if (status === 'ready' && slots.length === 0) {
    return (
      <EmptyState title="No open times on this day">
        Try another date — weekends and fully booked days won't show slots.
      </EmptyState>
    );
  }
  if (status !== 'ready') return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((iso) => {
        const isSelected = iso === selected;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={isSelected}
            className={
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors ' +
              (isSelected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700')
            }
          >
            {formatTime(iso, timezone)}
          </button>
        );
      })}
    </div>
  );
}
