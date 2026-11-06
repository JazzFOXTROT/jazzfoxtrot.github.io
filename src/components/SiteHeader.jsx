import { useEffect, useRef, useState } from 'react';
import { NAV, go } from '../nav.js';
import { resume } from '../content.js';
import { animateScroll } from '../scroll.js';
import Arrow from './Arrow.jsx';
import { file } from '../asset.js';

const SECTIONS = ['works', 'me', 'contacts'];

/*
 * Liquid glass (Figma V4 nav: a rounded white bar, made of glass).
 * Every browser gets frosted glass with a bright rim (CSS). Chromium also bends what's behind the
 * rim like a lens: an SVG displacement map, drawn for the bar's exact size, used as a backdrop-filter.
 */
const CHROMIUM = typeof navigator !== 'undefined' && !!navigator.userAgentData?.brands?.some(b => /Chromium/.test(b.brand));

function displacementMap(w, h, r, bezel) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      // Signed distance to the rounded-rect edge (positive inside) and the outward normal.
      const qx = Math.max(Math.abs(x + 0.5 - w / 2) - (w / 2 - r), 0);
      const qy = Math.max(Math.abs(y + 0.5 - h / 2) - (h / 2 - r), 0);
      const len = Math.hypot(qx, qy);
      let d;
      let nx = 0;
      let ny = 0;
      if (len > 0) {
        d = r - len;
        nx = (qx / len) * Math.sign(x + 0.5 - w / 2);
        ny = (qy / len) * Math.sign(y + 0.5 - h / 2);
      } else {
        const dx = w / 2 - Math.abs(x + 0.5 - w / 2);
        const dy = h / 2 - Math.abs(y + 0.5 - h / 2);
        d = r + Math.min(dx - r, dy - r);
        if (dx < dy) nx = Math.sign(x + 0.5 - w / 2); else ny = Math.sign(y + 0.5 - h / 2);
      }
      const t = Math.max(0, Math.min(1, 1 - d / bezel));
      const m = t * t; // steeper right at the rim
      const i = (y * w + x) * 4;
      // Sample from further inside near the rim: the edge magnifies like a lens.
      img.data[i] = 128 - nx * m * 127;
      img.data[i + 1] = 128 - ny * m * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function useLiquidFilter(ref, id) {
  const [map, setMap] = useState(null);
  useEffect(() => {
    if (!CHROMIUM) return undefined;
    const el = ref.current;
    let t = 0;
    const make = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2;
      setMap({ w, h, href: displacementMap(w, h, Math.min(r, h / 2), Math.min(22, h / 2)) });
    };
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(make, 80); });
    ro.observe(el);
    make();
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [ref, id]);
  if (!map) return null;
  return (
    <svg className="liquid-filter" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id={id} x="0" y="0" width={map.w} height={map.h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={map.href} x="0" y="0" width={map.w} height={map.h} result="map" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="34" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

const rgba = c => (c.match(/[\d.]+/g) || []).map(Number);
const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// The colour of whatever section sits right under the header (sampled in the side gutter,
// so cards and photos never count — only the section backgrounds do).
function colourUnder(header) {
  const y = Math.min(header.offsetTop + header.offsetHeight / 2, window.innerHeight - 1);
  // The pinned "Me" stage paints its navy panel on a pointer-less layer, so read its progress instead.
  const me = document.querySelector('#me:not(.me--static)');
  if (me) {
    const r = me.getBoundingClientRect();
    if (r.top <= y && r.bottom > y) {
      const p = parseFloat(getComputedStyle(me).getPropertyValue('--me-p')) || 0;
      const media = me.querySelector('.scroll-expand__media');
      if (p > 0.9 && media) return getComputedStyle(media).backgroundColor;
    }
  }
  // Topmost painted layer first (elementsFromPoint already lists ancestors in paint order).
  for (const n of document.elementsFromPoint(2, y)) {
    if (header.contains(n) || n === document.documentElement) continue;
    const c = getComputedStyle(n).backgroundColor;
    const v = rgba(c);
    if (v.length === 3 || (v[3] ?? 1) > 0.5) return c;
  }
  return getComputedStyle(document.body).backgroundColor;
}

/*
 * Sticky header. Hidden while the hero's own menu is on screen, then slides in.
 * Its colour follows the section underneath (so Safari's status-bar strip matches too),
 * and the section you're in is marked on phones.
 */
export default function SiteHeader() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const [bg, setBg] = useState('');
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState('');
  const liquid = useLiquidFilter(ref, 'site-header-glass');

  useEffect(() => {
    const header = ref.current;
    const meta = document.querySelector('meta[name="theme-color"]') || Object.assign(document.head.appendChild(document.createElement('meta')), { name: 'theme-color' });
    let raf = 0;
    const update = () => {
      raf = 0;
      const heroNav = document.querySelector('.hero__nav');
      setShown(!heroNav || heroNav.getBoundingClientRect().bottom < 0);
      const c = colourUnder(header);
      const isDark = lum(rgba(c)) < 0.18; // orange (0.19) keeps black ink, navy/teal get white
      setBg(c);
      setDark(isDark);
      meta.content = c;
      const line = header.offsetTop + header.offsetHeight + 1;
      setActive(SECTIONS.find(id => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return r && r.top <= line && r.bottom > line;
      }) || '');
      document.documentElement.style.setProperty('--hdr-h', `${header.offsetTop + header.offsetHeight}px`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('me:progress', queue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('me:progress', queue);
    };
  }, []);

  return (
    <header
      ref={ref}
      className={`site-header${CHROMIUM ? ' site-header--liquid' : ''}`}
      data-shown={shown ? '' : undefined}
      data-dark={dark ? '' : undefined}
      style={bg ? { '--hdr-bg': bg } : undefined}
      inert={shown ? undefined : ''}
    >
      <a
        href="/"
        className="site-header__logo serif"
        onClick={e => { e.preventDefault(); animateScroll(0, Math.min(1600, 500 + window.scrollY / 6)); }}
        aria-label="blik. — back to top"
      >
        blik.
      </a>
      <nav className="site-header__nav" aria-label="Sections">
        {NAV.map(n => n.href === 'resume' ? (
          <a key={n.href} href={file(resume)} target="_blank" rel="noreferrer" className="tilde-link serif">
            <span className="tilde" aria-hidden="true">~</span>
            <span className="tilde-link__label">{n.label} <Arrow /></span>
            <span className="tilde" aria-hidden="true">~</span>
          </a>
        ) : (
          <a
            key={n.href}
            href={n.href}
            onClick={e => go(e, n.href)}
            className="tilde-link serif"
            aria-current={active === n.href.slice(1) ? 'location' : undefined}
          >
            <span className="tilde" aria-hidden="true">~</span>
            <span className="tilde-link__label">{n.label}</span>
            <span className="tilde" aria-hidden="true">~</span>
          </a>
        ))}
      </nav>
      {liquid}
    </header>
  );
}
