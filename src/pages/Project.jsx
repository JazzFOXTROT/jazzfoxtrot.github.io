import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderedProjects as projects } from '../content.js';
import { asset } from '../asset.js';
import { navigateWithTransition } from '../transition.js';
import Arrow from '../components/Arrow.jsx';

// Smaller copies made at build time (scripts/responsive-images.mjs): foo.jpg → foo@720.jpg, foo@1440.jpg.
// Not in the local file:// preview build, which has no such step.
const RESPONSIVE = import.meta.env.BASE_URL !== './';

// A recruiter's first pass: what the problem was, what I did, the decision that mattered,
// and what is still not proven.
const SUMMARY = [
  ['problem', 'Problem'],
  ['role', 'My role'],
  ['decision', 'Key decision'],
  // ['unvalidated', 'Not yet validated'], // hidden for now; the texts stay in works.json
];
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

/*
 * One layout for all projects: a fixed-height page with the curtain on top (name, one line,
 * and for the case studies a recruiter summary) and a scrolling area under it (an iframe for the
 * case studies, a div for the Figma pages).
 *
 * The curtain closes FIRST: while it is open, wheel, swipe and keyboard scrolling fold it
 * (--p 0 → 1) and the content underneath stays put. Only once it is a slim bar does the case
 * itself start to scroll. Scrolling back up to the very top of the case opens it again.
 * The case studies are on the same origin (blik.design), so their scroll and swipes can be read
 * from inside the iframe.
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
  const frameApiRef = useRef(null);

  const goTo = useCallback(target => navigateWithTransition(navigate, `/work/${target.slug}/`, null), [navigate]);
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

  // How far the curtain has folded, in px of scrolling (0 … its own height).
  const foldRef = useRef(0);
  // Measured once per project while the curtain is open: folding takes as much scrolling
  // as the curtain shrinks (240–480 px).
  const foldMaxRef = useRef(260);
  const foldMax = useCallback(() => foldMaxRef.current, []);
  const measureFold = useCallback(() => {
    const c = rootRef.current?.querySelector('.project__curtain');
    if (c && foldRef.current === 0) foldMaxRef.current = Math.min(480, Math.max(240, c.offsetHeight - 64));
  }, []);
  const setFold = useCallback(px => {
    const max = foldMax();
    foldRef.current = Math.min(max, Math.max(0, px));
    rootRef.current?.style.setProperty('--p', (foldRef.current / max).toFixed(3));
  }, [foldMax]);

  // Short eased glide of the curtain to fully open / fully closed (phones, after a swipe).
  const snapRef = useRef(null);
  const snapFold = useCallback(to => {
    snapRef.current?.cancel();
    const from = foldRef.current;
    const start = performance.now();
    const dur = 260;
    let raf = 0;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setFold(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    snapRef.current = { cancel: () => cancelAnimationFrame(raf) };
  }, [setFold]);

  /*
   * The curtain takes the scroll first. `getTop` reads how far the content underneath is scrolled,
   * `scrollBy` moves it. Returns a cleanup.
   */
  const attachFold = useCallback((target, { getTop, setTop, scrollBy, scrollEl }) => {
    const take = (dy, e) => {
      const max = foldMax();
      const f = foldRef.current;
      if (dy > 0 && f < max) {
        e?.cancelable && e.preventDefault();
        setFold(f + dy);
        return true;
      }
      if (dy < 0 && f > 0 && getTop() <= 0) {
        e?.cancelable && e.preventDefault();
        setFold(f + dy);
        return true;
      }
      return false;
    };
    const lineH = 40;
    const onWheel = e => {
      snapRef.current?.cancel();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // sideways swipes switch projects
      const dy = e.deltaMode === 1 ? e.deltaY * lineH : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      // Over the curtain (not over the content), a closed curtain passes the scroll on to the content.
      if (!take(dy, e) && scrollBy && !e.target.closest?.('.project__scroller')) scrollBy(dy);
    };
    let lastY = null;
    let lastDir = 0;
    let touching = false;
    let touchEndedAt = 0;
    const onStart = e => {
      touching = true;
      snapRef.current?.cancel();
      lastY = e.touches[0]?.clientY ?? null;
    };
    const onMove = e => {
      if (lastY === null || e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const dy = lastY - y;
      lastY = y;
      if (dy) lastDir = Math.sign(dy);
      take(dy, e);
    };
    // A half-folded curtain finishes the move on its own, in the direction of the swipe.
    const onEnd = () => {
      lastY = null;
      touching = false;
      touchEndedAt = performance.now();
      const max = foldMax();
      const f = foldRef.current;
      if (f > 0 && f < max) snapFold(lastDir > 0 ? max : 0);
    };
    // Keyboard and scrollbar drag: if the content moved while the curtain is still open,
    // hand that distance to the curtain and put the content back. Never during a touch
    // (iOS momentum would fight it and the page would jitter).
    const onScroll = () => {
      if (touching || performance.now() - touchEndedAt < 900) return;
      const top = getTop();
      const max = foldMax();
      const f = foldRef.current;
      if (top > 0 && f < max) {
        const use = Math.min(max - f, top);
        setFold(f + use);
        setTop(top - use);
      }
    };
    target.addEventListener('wheel', onWheel, { passive: false });
    target.addEventListener('touchstart', onStart, { passive: true });
    target.addEventListener('touchmove', onMove, { passive: false });
    target.addEventListener('touchend', onEnd, { passive: true });
    target.addEventListener('touchcancel', onEnd, { passive: true });
    const scrolls = scrollEl || target;
    scrolls.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('wheel', onWheel);
      target.removeEventListener('touchstart', onStart);
      target.removeEventListener('touchmove', onMove);
      target.removeEventListener('touchend', onEnd);
      target.removeEventListener('touchcancel', onEnd);
      scrolls.removeEventListener('scroll', onScroll);
    };
  }, [foldMax, setFold, snapFold]);

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

  // Curtain + Figma pages (a scrolling div), and the curtain area of every project.
  useEffect(() => {
    setFold(0);
    measureFold();
    const el = scrollerRef.current;
    if (el) el.scrollTop = 0;
    return attachFold(window, el ? {
      getTop: () => el.scrollTop,
      setTop: v => { el.scrollTop = v; },
      scrollBy: dy => { el.scrollTop += dy; },
      scrollEl: el,
    } : {
      getTop: () => frameApiRef.current?.top() ?? 0,
      setTop: () => {},
      scrollBy: dy => frameApiRef.current?.by(dy),
      scrollEl: document.createElement('div'), // the iframe's own scroll is handled below
    });
  }, [slug, setFold, attachFold, measureFold]);

  // Curtain + gestures inside the case-study iframe.
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
        const se = () => doc.scrollingElement || doc.documentElement;
        const offFold = attachFold(win, {
          getTop: () => win.scrollY || se().scrollTop || 0,
          setTop: v => win.scrollTo(0, v),
          scrollBy: null,
        });
        const offGestures = attachGestures(win, { keys: false }); // arrow keys stay with the case itself
        // Scrolling the page around the iframe (curtain area) moves the case once the curtain is closed.
        frameApiRef.current = { top: () => win.scrollY || se().scrollTop || 0, by: dy => win.scrollBy(0, dy) };
        cleanup = () => { offFold(); offGestures(); frameApiRef.current = null; };
      } catch {
        // Different origin: the curtain then folds as soon as the pointer enters the case.
        const fold = () => setFold(foldMax());
        frame.addEventListener('pointerenter', fold);
        cleanup = () => frame.removeEventListener('pointerenter', fold);
      }
    };
    frame.addEventListener('load', hook);
    return () => { frame.removeEventListener('load', hook); cleanup(); };
  }, [slug, setFold, foldMax, attachFold, attachGestures]);

  return (
    <main className="project" ref={rootRef} style={{ viewTransitionName: 'project-sheet' }}>
      <header className="project__curtain">
        <div className="project__titles">
          <h1 className="project__name serif">{p.name}</h1>
          <p className="project__about">{p.about}</p>
          {p.summary && (
            <dl className="project__summary" aria-label="Summary">
              {SUMMARY.map(([key, label]) => p.summary[key] && (
                <div key={key} className="project__fact">
                  <dt>{label}</dt>
                  <dd>{p.summary[key]}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="project__tools">
          {p.type === 'case' && (
            <a className="project__open" href={p.url} target="_blank" rel="noreferrer" aria-label={`Open the ${p.name} case study as its own page`}>
              <span className="project__open-label">Open as a page</span> <Arrow />
            </a>
          )}
          <span className="project__count" aria-label={`Project ${index + 1} of ${projects.length}`}>{index + 1} / {projects.length}</span>
          <button type="button" className="project__close" onClick={close} aria-label="Close and go back to Selected work">
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
