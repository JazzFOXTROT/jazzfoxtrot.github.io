import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Commercial from './Commercial.jsx';
import { navigateWithTransition } from '../transition.js';
import { workHref } from '../routes.js';
import { groups, orderedProjects } from '../content.js';
import { asset } from '../asset.js';
import Arrow from '../components/Arrow.jsx';

const useNarrow = () => {
  const q = '(max-width: 899px)';
  const [ok, set] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => set(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return ok;
};

const Barcode = () => (
  <svg className="works__mark" width="96" height="64" viewBox="0 0 96 64" fill="none" aria-hidden="true">
    <path d="M27.0478 60.3348L27.0478 21.5333C27.0478 20.4772 26.6009 19.4708 25.8308 18.774L5.90711 0.907787C3.60242 -1.16029 2.27823e-08 0.52071 1.60072e-07 3.66154L1.85638e-06 42.4685C1.90255e-06 43.5247 0.446939 44.5311 1.21696 45.2278L21.1407 63.0885C23.4454 65.1566 27.0478 63.4756 27.0478 60.3348Z" fill="#7DA7D9" />
    <path d="M17.2366 3.66594C17.2366 4.7221 17.6835 5.72849 18.4536 6.42523L29.6647 16.4836L29.9447 16.738C30.7201 17.4347 31.1617 18.4356 31.1617 19.4918L31.1617 54.9644C31.1617 56.0205 31.6086 57.0269 32.3786 57.7237L38.3665 63.0929C40.6712 65.161 44.2736 63.48 44.2736 60.3392L44.2736 21.5377C44.2736 20.4816 43.8267 19.4752 43.0567 18.7784L23.1329 0.912186C20.8283 -1.1559 17.2258 0.525109 17.2258 3.67147L17.2366 3.66594Z" fill="#7DA7D9" />
    <path d="M34.4788 3.66594C34.4788 4.7221 34.9257 5.72849 35.6957 6.42523L46.9069 16.4836L47.1869 16.738C47.9623 17.4347 48.4038 18.4356 48.4038 19.4918L48.4039 54.9644C48.4039 56.0205 48.8508 57.0269 49.6208 57.7237L55.6087 63.0929C57.9134 65.161 61.5158 63.48 61.5158 60.3392L61.5158 21.5377C61.5158 20.4816 61.0689 19.4752 60.2988 18.7784L40.3751 0.912186C38.0704 -1.1559 34.468 0.525109 34.468 3.67147L34.4788 3.66594Z" fill="#7DA7D9" />
    <path d="M51.7156 3.66594C51.7156 4.7221 52.1625 5.72849 52.9326 6.42523L64.1437 16.4836L64.4237 16.738C65.1991 17.4347 65.6407 18.4356 65.6407 19.4918L65.6407 54.9644C65.6407 56.0205 66.0876 57.0269 66.8576 57.7237L72.8455 63.0929C75.1502 65.161 78.7526 63.48 78.7526 60.3392L78.7526 21.5377C78.7526 20.4816 78.3057 19.4752 77.5357 18.7784L57.6119 0.912186C55.3073 -1.1559 51.7048 0.525109 51.7048 3.67147L51.7156 3.66594Z" fill="#7DA7D9" />
    <path d="M68.9522 3.66594C68.9522 4.7221 69.3991 5.72849 70.1691 6.42523L81.3803 16.4836L81.6603 16.738C82.4357 17.4347 82.8772 18.4356 82.8772 19.4918L82.8772 54.9644C82.8772 56.0205 83.3242 57.0269 84.0942 57.7237L90.0821 63.0929C92.3868 65.161 95.9892 63.48 95.9892 60.3392L95.9892 21.5377C95.9892 20.4816 95.5423 19.4752 94.7722 18.7784L74.8485 0.912186C72.5438 -1.1559 68.9414 0.525109 68.9414 3.67147L68.9522 3.66594Z" fill="#7DA7D9" />
  </svg>
);

// Grainy blue marks between the small cards: Figma's own render of Group 10 / Group 11
// (layer blur 2.3 + texture), pixel-doubled so the grain stays as sharp as in Figma on retina screens.
function Deco({ kind }) {
  return <img className={`tile-deco tile-deco--${kind}`} src={asset(`v4/deco-${kind}.png`)} alt="" aria-hidden="true" draggable="false" />;
}

// Phones: the card under the middle of the screen is the "open" one (caption on, the rest dimmed),
// the same idea as the old scroll-driven accordion.
function useCenterTile(ref, enabled) {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (!enabled) { setIndex(-1); return undefined; }
    let raf = 0;
    const read = () => {
      raf = 0;
      const tiles = ref.current?.querySelectorAll('.tile');
      if (!tiles?.length) return;
      const mid = window.innerHeight * 0.5;
      let best = -1;
      let bestD = Infinity;
      tiles.forEach((t, i) => {
        const r = t.getBoundingClientRect();
        const d = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0;
        if (d < bestD) { bestD = d; best = i; }
      });
      setIndex(bestD < window.innerHeight * 0.35 ? best : -1);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, enabled]);
  return index;
}

/*
 * Figma V4 · 02 Selected work. One mosaic for every work:
 * big cards (the case studies) alternate with small ones (the interface explorations),
 * and each small card shares its column with a grainy blue mark.
 * Desktop: 283 / 196 / 283 / 196 / 283 columns. Phones (Mobile view, 491 wide): the first card
 * runs full width, then 283 + 196 and 196 + 283.
 */
function Mosaic({ list }) {
  const narrow = useNarrow();
  const navigate = useNavigate();
  const ref = useRef(null);
  const center = useCenterTile(ref, narrow);
  let small = -1;
  const canonical = list.length === 5 && list.every((p, i) => (i % 2 === 0) === (p.group === groups[0]?.id));
  return (
    <ul className={`mosaic${canonical ? ' mosaic--five' : ''}${center >= 0 ? ' mosaic--focus' : ''}`} ref={ref} role="list">
      {list.map((p, i) => {
        const big = p.group === groups[0]?.id;
        if (!big) small += 1;
        const tile = (
          <a
            href={workHref(p.slug)}
            className={`tile tile--${big ? 'big' : 'small'}`}
            data-active={center === i ? '' : undefined}
            onClick={e => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navigateWithTransition(navigate, `/work/${p.slug}/`, e.currentTarget);
            }}
          >
            <img
              src={asset(p.card)}
              srcSet={p.card2x ? `${asset(p.card)} 1200w, ${asset(p.card2x)} 2400w` : undefined}
              sizes={big ? '(max-width: 899px) 100vw, 22vw' : '(max-width: 899px) 45vw, 16vw'}
              alt={`${p.name}: ${p.cardTitle}`}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
              draggable="false"
            />
            <span className="tile__shade" aria-hidden="true" />
            <span className="tile__caption">
              <span className="tile__tags">{p.tags}</span>
              <span className="tile__name serif">{p.name} <Arrow /></span>
              <span className="tile__line">{p.cardTitle}</span>
            </span>
          </a>
        );
        return (
          <li key={p.slug} className={`mosaic__cell mosaic__cell--${big ? 'big' : 'small'}${!big ? ` mosaic__cell--s${small % 2}` : ''}`}>
            {tile}
            {!big && <Deco kind={small % 2 === 0 ? 'pills' : 'cross'} />}
          </li>
        );
      })}
    </ul>
  );
}

export default function Works() {
  const [first] = groups;
  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <header className="works__head">
        <div className="section-rule">
          <h2 id="works-title" className="works__title serif">{first?.title}</h2>
          <span className="section-rule__line" aria-hidden="true" />
          <Barcode />
        </div>
        {first?.lines && <p className="works__lines">{first.lines}</p>}
      </header>

      <div className="works__mosaic">
        <Mosaic list={orderedProjects} />
      </div>

      <Commercial />
    </section>
  );
}
