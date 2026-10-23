import { useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { projects } from '../content.js';
import { asset } from '../asset.js';
import { navigateWithTransition } from '../transition.js';

export default function Project() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const index = Math.max(0, projects.findIndex(p => p.slug === slug));
  const p = projects[index];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const sheetRef = useRef(null);

  const goTo = target => navigateWithTransition(navigate, `/work/${target.slug}`, null);

  useEffect(() => {
    document.title = `${p.name} · Kirill Blik`;
    return () => { document.title = 'Kirill Blik · Product Designer'; };
  }, [p.name]);

  // Keyboard arrows + horizontal swipe / trackpad swipe between projects.
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowRight') goTo(next);
      if (e.key === 'ArrowLeft') goTo(prev);
      if (e.key === 'Escape') navigate('/');
    };
    let start = null;
    const onDown = e => { if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY }; };
    const onUp = e => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(dx < 0 ? next : prev);
    };
    let wheelX = 0;
    let lock = false;
    const onWheel = e => {
      if (lock || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      wheelX += e.deltaX;
      if (Math.abs(wheelX) > 140) {
        lock = true;
        goTo(wheelX > 0 ? next : prev);
        wheelX = 0;
        setTimeout(() => { lock = false; }, 900);
      }
    };
    const el = sheetRef.current;
    window.addEventListener('keydown', onKey);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  });

  return (
    <main className="project" ref={sheetRef} style={{ viewTransitionName: 'project-sheet' }}>
      <header className="project__head">
        <Link to="/" className="project__back" aria-label="Back to home">blik.</Link>
        <div className="project__intro">
          <h1 className="project__name serif">{p.name}</h1>
          <p className="project__about">{p.about}</p>
        </div>
        <nav className="project__pager" aria-label="Other projects">
          <button type="button" onClick={() => goTo(prev)} aria-label={`Previous: ${prev.name}`}>←</button>
          <span className="project__count">{index + 1} / {projects.length}</span>
          <button type="button" onClick={() => goTo(next)} aria-label={`Next: ${next.name}`}>→</button>
        </nav>
      </header>

      {p.type === 'case' ? (
        <div className="project__frame">
          <iframe src={p.url} title={`${p.name} case study`} loading="eager" />
          <a className="project__open" href={p.url} target="_blank" rel="noreferrer">Open in a new tab ↗</a>
        </div>
      ) : (
        <div className="project__pages">
          {p.pages.map(pg => (
            <figure key={pg.src} className={`project__page${pg.narrow ? ' project__page--narrow' : ''}`}>
              <figcaption>{pg.label}</figcaption>
              <img src={asset(`projects/${pg.src}`)} alt={`${p.name}, ${pg.label} page design`} width={pg.w} height={pg.h} loading="lazy" />
            </figure>
          ))}
        </div>
      )}

      <footer className="project__foot">
        <button type="button" className="tilde-link serif" onClick={() => goTo(next)}>
          <span className="tilde" aria-hidden="true">~</span>
          <span className="tilde-link__label">Next: {next.name}</span>
          <span className="tilde" aria-hidden="true">~</span>
        </button>
      </footer>
    </main>
  );
}
