import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ShinyText from '../components/reactbits/ShinyText.jsx';
import Cubes from '../components/reactbits/Cubes.jsx';
import { hero } from '../content.js';
import { asset } from '../asset.js';

const NAV = [
  { label: 'About me', href: '#me' },
  { label: 'My works', href: '#works' },
  { label: 'Contacts', href: '#contacts' },
];

// Must match the <Cubes> props below: the logo is placed on this grid.
const GRID = 11;
const GAP = 0.06;

const go = (e, href) => {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
};

// Puts "blik." on the cube grid: the "b" sits in the first full cell,
// its bowl touching the cell's right wall, baseline on a grid line.
function useLogoOnGrid(mediaRef) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    const media = mediaRef.current;
    if (!media) return undefined;
    let cancelled = false;

    const place = () => {
      const W = media.clientWidth;
      const H = media.clientHeight;
      const S = Math.max(W, H); // .hero__cubes is a square of the long side, centred
      const pitch = S / (GRID + 0.9);
      const cube = (1 - GAP) * pitch;
      const ox = (W - S) / 2;
      const oy = (H - S) / 2;
      const mid = (GRID - 1) / 2;
      const cellLeft = c => ox + S / 2 + (c - mid) * pitch - cube / 2;
      const cellTop = r => oy + S / 2 + (r - mid) * pitch - cube / 2;
      let col = 0;
      while (cellLeft(col) < 0 && col < GRID) col++;
      let row = 0;
      while (cellTop(row) < 0 && row < GRID) row++;
      row += 1; // leave room for the ascender in the cell above

      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '100px "Instrument Serif"';
      const m = ctx.measureText('b');
      const inkL = -m.actualBoundingBoxLeft; // usually ~0
      const inkR = m.actualBoundingBoxRight;
      const inkW = inkR - inkL || 50;
      const size = (cube * 0.86 * 100) / inkW; // "b" fills the cell width
      const k = size / 100;
      const right = cellLeft(col) + cube; // bowl touches this wall
      const left = right - inkR * k;
      const baseline = cellTop(row) + cube; // sits on the grid line
      // With line-height: 1 the baseline is this far below the box top.
      const fa = (m.fontBoundingBoxAscent ?? 90) * k;
      const fd = (m.fontBoundingBoxDescent ?? 25) * k;
      const top = baseline - ((size - (fa + fd)) / 2 + fa);
      if (!cancelled) setStyle({ left: `${left}px`, top: `${top}px`, fontSize: `${size}px` });
    };

    const ro = new ResizeObserver(place);
    ro.observe(media);
    document.fonts?.ready.then(place);
    place();
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [mediaRef]);

  return style;
}

// Frosted-glass photo: blurred by default, sharp under the cursor.
function useReveal(mediaRef) {
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, raf: 0 };
    const MAX = () => Math.max(140, Math.min(el.clientWidth, el.clientHeight) * 0.26);

    const tick = () => {
      s.raf = 0;
      const k = reduce ? 1 : 0.16;
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      s.r += (s.tr - s.r) * (reduce ? 1 : 0.1);
      el.style.setProperty('--mx', `${s.x.toFixed(1)}px`);
      el.style.setProperty('--my', `${s.y.toFixed(1)}px`);
      el.style.setProperty('--mr', `${s.r.toFixed(1)}px`);
      if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) + Math.abs(s.tr - s.r) > 0.5) s.raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!s.raf) s.raf = requestAnimationFrame(tick); };
    const move = e => {
      const r = el.getBoundingClientRect();
      s.tx = e.clientX - r.left;
      s.ty = e.clientY - r.top;
      if (s.r < 1) { s.x = s.tx; s.y = s.ty; }
      s.tr = MAX();
      wake();
    };
    const leave = () => { s.tr = 0; wake(); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    return () => {
      cancelAnimationFrame(s.raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
    };
  }, [mediaRef]);
}

export default function Hero() {
  const mediaRef = useRef(null);
  const logo = useLogoOnGrid(mediaRef);
  useReveal(mediaRef);
  const photo = asset('img/hero-photo.jpg');

  return (
    <section className="hero" aria-label="Intro">
      <div className="hero__media" ref={mediaRef}>
        <img className="hero__photo hero__photo--glass" src={photo} alt="" aria-hidden="true" />
        <img className="hero__photo hero__photo--sharp" src={photo} alt="Kirill framing the camera with his hands on a bridge at night" />
        <div className="hero__cubes">
          <Cubes
            gridSize={GRID}
            gap={GAP}
            faceColor="#120F17"
            faceOpacity={0}
            edgeColor="#bbb598"
            edgeWidth={1}
            shading={0.5}
            maxAngle={55}
            radius={3.2}
            speed={0.9}
            rippleColor="#C8102E"
            rippleSpeed={1.2}
          />
        </div>
        <span className="hero__logo serif" style={logo ?? undefined}>blik.</span>
      </div>

      <div className="hero__text">
        <h1 className="hero__title serif">
          {hero.title}{' '}
          <ShinyText text={hero.shiny} color="#8e0e0c" shineColor="#f3d6b8" speed={2.6} delay={1.2} angle={110} shineWidth={34} glow={0.25} />.
        </h1>
        <p className="hero__lines">{hero.lines}</p>

        <nav className="hero__nav" aria-label="Main">
          {NAV.map(n => (
            <a key={n.href} href={n.href} onClick={e => go(e, n.href)} className="tilde-link serif">
              <span className="tilde" aria-hidden="true">~</span>
              <span className="tilde-link__label">{n.label}</span>
              <span className="tilde" aria-hidden="true">~</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
