import { useEffect, useRef, useState } from 'react';
import { NAV, go } from '../nav.js';
import { resume } from '../content.js';
import { animateScroll } from '../scroll.js';
import Arrow from './Arrow.jsx';
import { asset, file } from '../asset.js';

const SECTIONS = ['works', 'me', 'contacts'];

const rgba = c => (c.match(/[\d.]+/g) || []).map(Number);
const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// The colour of whatever section sits right under the header (sampled in the side gutter,
// so cards and photos never count — only the section backgrounds do).
function colourUnder(header) {
  const y = Math.min(header.offsetHeight + 1, window.innerHeight - 1);
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
      const line = header.offsetHeight + 1;
      setActive(SECTIONS.find(id => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return r && r.top <= line && r.bottom > line;
      }) || '');
      document.documentElement.style.setProperty('--hdr-h', `${header.offsetHeight}px`);
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
      className="site-header"
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
      {/* Corner flourish: the same two ornament pieces, placed with the exact transforms from Figma (DESKTOP / Frame 3). */}
      <span className="site-header__corner" aria-hidden="true">
        <img src={asset('v3/ornament.png')} alt="" style={{ width: 38.28, height: 277, transform: 'matrix(-1, 0, 0, -1, 93.28, 80)' }} />
        <img src={asset('v3/ornament.png')} alt="" style={{ width: 39, height: 282.23, transform: 'matrix(0, 1, 1, 0, 0, -17)' }} />
      </span>
    </header>
  );
}
