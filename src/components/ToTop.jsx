import { useEffect, useState } from 'react';
import { animateScroll } from '../scroll.js';

// Small arrow in the corner that takes you back to the top once you've scrolled a screen down.
export default function ToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > window.innerHeight);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button
      type="button"
      className="to-top"
      data-shown={shown ? '' : undefined}
      onClick={() => animateScroll(0, Math.min(1600, 500 + window.scrollY / 6))}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
        <path d="M8 16V2M2 8l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
