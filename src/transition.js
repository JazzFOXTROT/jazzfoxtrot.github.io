import { flushSync } from 'react-dom';

// Smoothly morphs one element into the next page's element with the same
// view-transition-name. Falls back to a plain navigation where unsupported.
export function navigateWithTransition(navigate, to, el) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) {
    navigate(to);
    return;
  }
  if (el) el.style.viewTransitionName = 'project-sheet';
  const t = document.startViewTransition(() => {
    if (el) el.style.viewTransitionName = '';
    flushSync(() => navigate(to));
  });
  t.finished.finally(() => {
    if (el) el.style.viewTransitionName = '';
  });
}
