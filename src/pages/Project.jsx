import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderedProjects as projects } from '../content.js';
import { asset } from '../asset.js';
import { navigateWithTransition } from '../transition.js';
import Arrow from '../components/Arrow.jsx';

// Smaller copies made at build time (scripts/responsive-images.mjs): foo.jpg → foo@720.jpg, foo@1440.jpg.
// Not in the local file:// preview build, which has no such step.
const RESPONSIVE = import.meta.env.BASE_URL !== './';
const srcSetOf = pg => {
  if (!RESPONSIVE || !pg.w) return undefined;
  const at = w => asset(pg.src.replace(/(\.[a-z]+)$/i, `@${w}$1`));
  const list = [720, 1440].filter(w => pg.w > w).map(w => `${at(w)} ${w}w`);
  return list.length ? [...list, `${asset(pg.src)} ${pg.w}w`].join(', ') : undefined;
};

// Warm up the neighbours so switching projects doesn't start from zero.
function prefetch(project) {
  if (!project || typeof document === 'undefined') return;
  const href = project.type === 'case' ? project.url : (() => {
    const pg = project.pages?.[0];
    if (!pg) return null;
    const wide = window.innerWidth * (window.devicePixelRatio || 1);
    const w = [720, 1440].find(x => RESPONSIVE && pg.w > x && x >= Math.min(wide, pg.w));
    return asset(w ? pg.src.replace(/(\.[a-z]+)$/i, `@${w}$1`) : pg.src);
  })();
  if (!href || document.head.querySelector(`link[data-prefetch="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.dataset.prefetch = href;
  document.head.appendChild(link);
}

const COLLAPSE_AT = 240; // px of scrolling until the red curtain is fully folded

/*
 * One layout for all four projects: a fixed-height page with the red curtain on top
 * and a scrolling area under it (an iframe for the case studies, a div for the Figma pages).
 * Whatever scrolls inside drives --p (0 → 1), so the curtain folds into a slim bar the same way
 * everywhere. The case studies are on the same origin (jazzfoxtrot.github.io), so their
 * scroll and swipes can be read from inside the iframe.
 */
export default function Project() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const index = Math.max(0, projects.findIndex(p => p.slug === slug));
  const p = projects[index];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const rootRef = useRef(null);
  const scrollerRef = useRef(null);
  const frameRef = useRef(null);
  const goRef = useRef(null);

  const goTo = useCallback(target => navigateWithTransition(navigate, `/work/${target.slug}`, null), [navigate]);
  const close = useCallback(() => navigate('/', { state: { scrollTo: 'works' } }), [navigate]);
  goRef.current = { goTo, close, prev, next };

  // Once this project is on screen, quietly fetch the next and previous ones.
  useEffect(() => {
    const t = setTimeout(() => { prefetch(next); prefetch(prev); }, 1200);
    return () => clearTimeout(t);
  }, [next, prev]);

  useEffect(() => {
    document.title = `${p.name} · Kirill Blik`;
    return () => { document.title = 'Kirill Blik · Product Designer'; };
  }, [p.name]);

  const setProgress = useCallback(y => {
    const v = Math.min(1, Math.max(0, y / COLLAPSE_AT));
    rootRef.current?.style.setProperty('--p', v.toFixed(3));
  }, []);

  // Horizontal trackpad swipe and keyboard → previous / next project (desktop).
  // No touch swipe on phones: case studies have their own swipeable carousels (DeciBuy's cards),
  // so on phones projects switch with the side arrows.
  const attachGestures = useCallback((target, { keys = true } = {}) => {
    let wheelX = 0;
    let lock = false;
    const fire = dir => {
      if (lock) return;
      lock = true;
      const g = goRef.current;
      g.goTo(dir > 0 ? g.next : g.prev);
      setTimeout(() => { lock = false; }, 900);
    };
    // Don't steal swipes from things that scroll sideways themselves (carousels, wide tables, maps).
    const scrollsSideways = el => {
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const v = n.ownerDocument.defaultView;
        const ox = v.getComputedStyle(n).overflowX;
        if (n.scrollWidth > n.clientWidth + 2 && (ox === 'auto' || ox === 'scroll')) return true;
        if (n.matches?.('[data-swipe], [draggable="true"], input, textarea, [role="slider"]')) return true;
      }
      return false;
    };
    const onWheel = e => {
      if (scrollsSideways(e.target)) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.5) return;
      wheelX += e.deltaX;
      if (Math.abs(wheelX) > 160) { fire(wheelX > 0 ? 1 : -1); wheelX = 0; }
      clearTimeout(onWheel.t);
      onWheel.t = setTimeout(() => { wheelX = 0; }, 200);
    };
    const onKey = e => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return;
      if (e.key === 'ArrowRight') fire(1);
      if (e.key === 'ArrowLeft') fire(-1);
      if (e.key === 'Escape') goRef.current.close();
    };
    target.addEventListener('wheel', onWheel, { passive: true });
    if (keys) target.addEventListener('keydown', onKey);
    return () => {
      target.removeEventListener('wheel', onWheel);
      target.removeEventListener('keydown', onKey);
    };
  }, []);

  // Gestures on the page itself.
  useEffect(() => attachGestures(window), [attachGestures]);

  // Scroll of the Figma pages.
  useEffect(() => {
    setProgress(0);
    const el = scrollerRef.current;
    if (!el) return undefined;
    el.scrollTop = 0;
    const on = () => setProgress(el.scrollTop);
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, [slug, setProgress]);

  // Scroll + gestures inside the case-study iframe.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    let cleanup = () => {};
    const hook = () => {
      cleanup();
      try {
        const win = frame.contentWindow;
        const doc = frame.contentDocument;
        if (!win || !doc) return;
        const on = () => setProgress(win.scrollY || doc.scrollingElement?.scrollTop || 0);
        win.addEventListener('scroll', on, { passive: true });
        const off = attachGestures(win, { keys: false }); // arrow keys stay with the case itself
        on();
        cleanup = () => { win.removeEventListener('scroll', on); off(); };
      } catch {
        // Different origin: the curtain then folds as soon as the pointer enters the case.
        const fold = () => setProgress(COLLAPSE_AT);
        frame.addEventListener('pointerenter', fold);
        cleanup = () => frame.removeEventListener('pointerenter', fold);
      }
    };
    frame.addEventListener('load', hook);
    return () => { frame.removeEventListener('load', hook); cleanup(); };
  }, [slug, setProgress, attachGestures]);

  return (
    <main className="project" ref={rootRef} style={{ viewTransitionName: 'project-sheet' }}>
      <header className="project__curtain">
        <div className="project__titles">
          <h1 className="project__name serif">{p.name}</h1>
          <p className="project__about">{p.about}</p>
        </div>
        <div className="project__tools">
          {p.type === 'case' && (
            <a className="project__open" href={p.url} target="_blank" rel="noreferrer">Open in a new tab <Arrow /></a>
          )}
          <span className="project__count" aria-label={`Project ${index + 1} of ${projects.length}`}>{index + 1} / {projects.length}</span>
          <button type="button" className="project__close" onClick={close} aria-label="Close and go back to My works">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      {p.type === 'case' ? (
        <iframe key={p.slug} ref={frameRef} className="project__frame" src={p.url} title={`${p.name} case study`} />
      ) : (
        <div className="project__scroller" ref={scrollerRef}>
          <div className="project__pages">
            {p.pages.map((pg, i) => (
              <figure key={pg.src} className={`project__page${pg.narrow ? ' project__page--narrow' : ''}`}>
                <figcaption>{pg.label}</figcaption>
                <img
                  src={asset(pg.src)}
                  srcSet={srcSetOf(pg)}
                  sizes={pg.narrow ? '390px' : '100vw'}
                  alt={`${p.name}, ${pg.label} page design`}
                  width={pg.w}
                  height={pg.h}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchpriority={i === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="project__side project__side--prev" onClick={() => goTo(prev)} aria-label={`Previous project: ${prev.name}`}>
        <svg width="14" height="24" viewBox="0 0 14 24" aria-hidden="true"><path d="M12 2L2 12l10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="project__side project__side--next" onClick={() => goTo(next)} aria-label={`Next project: ${next.name}`}>
        <svg width="14" height="24" viewBox="0 0 14 24" aria-hidden="true"><path d="M2 2l10 10L2 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </main>
  );
}
