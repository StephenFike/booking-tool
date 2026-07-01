// Shared Framer Motion presets, tuned for a calm/smooth feel (gentle easing,
// modest distances, no bounce). Reused across lists and pages for consistency.

const easeOut = [0.22, 0.61, 0.36, 1];

// A list row that fades/rises in, and on removal slides off to the right while
// collapsing its height — so the surrounding rows (which use `layout`) slide up
// to fill the gap. Spread onto a <motion.li>; provide a stable `key`.
export const listItem = {
  layout: true,
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: 48, height: 0, marginTop: 0, marginBottom: 0 },
  transition: { duration: 0.3, ease: easeOut },
  style: { overflow: 'hidden' },
};

// Content that reveals by expanding height (e.g. a form appearing).
export const collapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.3, ease: easeOut },
  style: { overflow: 'hidden' },
};

// A gentle fade-up for cards/sections; pass a per-item delay for a stagger.
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: easeOut, delay },
  };
}
