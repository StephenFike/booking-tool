// Shared Tailwind class strings for the admin screens, so the look stays
// consistent without repeating long class lists everywhere.

export const cardCls =
  'rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(60,50,40,0.04)]';

export const inputCls =
  'block w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

export const labelCls = 'block text-sm font-semibold text-stone-700 mb-1';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed';

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50';

export const btnDangerSm =
  'inline-flex items-center rounded-full border border-clay-500/60 px-3 py-1 text-xs font-semibold text-clay-600 transition-colors hover:bg-clay-400/10';

export const btnSm =
  'inline-flex items-center rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const statusBadge = {
  confirmed: 'bg-brand-50 text-brand-700',
  completed: 'bg-stone-100 text-stone-500',
  cancelled: 'bg-clay-400/15 text-clay-600',
};
