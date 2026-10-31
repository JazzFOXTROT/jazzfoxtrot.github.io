import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Commercial from './Commercial.jsx';
import { navigateWithTransition } from '../transition.js';
import { workHref } from '../routes.js';
import AccordionGallery from '../components/reactbits/AccordionGallery.jsx';
import { groups, projects } from '../content.js';
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
    <path d="M27.0478 60.3348L27.0478 21.5333C27.0478 20.4772 26.6009 19.4708 25.8308 18.774L5.90711 0.907787C3.60242 -1.16029 2.27823e-08 0.52071 1.60072e-07 3.66154L1.85638e-06 42.4685C1.90255e-06 43.5247 0.446939 44.5311 1.21696 45.2278L21.1407 63.0885C23.4454 65.1566 27.0478 63.4756 27.0478 60.3348Z" fill="black" />
    <path d="M17.2366 3.66594C17.2366 4.7221 17.6835 5.72849 18.4536 6.42523L29.6647 16.4836L29.9447 16.738C30.7201 17.4347 31.1617 18.4356 31.1617 19.4918L31.1617 54.9644C31.1617 56.0205 31.6086 57.0269 32.3786 57.7237L38.3665 63.0929C40.6712 65.161 44.2736 63.48 44.2736 60.3392L44.2736 21.5377C44.2736 20.4816 43.8267 19.4752 43.0567 18.7784L23.1329 0.912186C20.8283 -1.1559 17.2258 0.525109 17.2258 3.67147L17.2366 3.66594Z" fill="black" />
    <path d="M34.4788 3.66594C34.4788 4.7221 34.9257 5.72849 35.6957 6.42523L46.9069 16.4836L47.1869 16.738C47.9623 17.4347 48.4038 18.4356 48.4038 19.4918L48.4039 54.9644C48.4039 56.0205 48.8508 57.0269 49.6208 57.7237L55.6087 63.0929C57.9134 65.161 61.5158 63.48 61.5158 60.3392L61.5158 21.5377C61.5158 20.4816 61.0689 19.4752 60.2988 18.7784L40.3751 0.912186C38.0704 -1.1559 34.468 0.525109 34.468 3.67147L34.4788 3.66594Z" fill="black" />
    <path d="M51.7156 3.66594C51.7156 4.7221 52.1625 5.72849 52.9326 6.42523L64.1437 16.4836L64.4237 16.738C65.1991 17.4347 65.6407 18.4356 65.6407 19.4918L65.6407 54.9644C65.6407 56.0205 66.0876 57.0269 66.8576 57.7237L72.8455 63.0929C75.1502 65.161 78.7526 63.48 78.7526 60.3392L78.7526 21.5377C78.7526 20.4816 78.3057 19.4752 77.5357 18.7784L57.6119 0.912186C55.3073 -1.1559 51.7048 0.525109 51.7048 3.67147L51.7156 3.66594Z" fill="black" />
    <path d="M68.9522 3.66594C68.9522 4.7221 69.3991 5.72849 70.1691 6.42523L81.3803 16.4836L81.6603 16.738C82.4357 17.4347 82.8772 18.4356 82.8772 19.4918L82.8772 54.9644C82.8772 56.0205 83.3242 57.0269 84.0942 57.7237L90.0821 63.0929C92.3868 65.161 95.9892 63.48 95.9892 60.3392L95.9892 21.5377C95.9892 20.4816 95.5423 19.4752 94.7722 18.7784L74.8485 0.912186C72.5438 -1.1559 68.9414 0.525109 68.9414 3.67147L68.9522 3.66594Z" fill="black" />
  </svg>
);

const CARD_RATIO = 1030 / 1138; // width / height of the exported cards
const GAP = { h: 12, v: 8 };
const RATIO = { h: 0.56, v: 0.62 };

// Height that makes the open panel exactly card-shaped, so nothing on the card is cropped.
function useGalleryHeight(ref, narrow, count) {
  const [h, setH] = useState(narrow ? 380 : 680);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const calc = () => {
      const W = el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight);
      if (!narrow) {
        const usable = W - GAP.h * (count - 1);
        setH(Math.round(Math.min((usable * RATIO.h) / CARD_RATIO, window.innerHeight * 0.86)));
      } else {
        const openH = W / CARD_RATIO;
        const total = openH / RATIO.v + GAP.v * (count - 1);
        setH(Math.round(total / 1.6)); // the gallery multiplies vertical height by 1.6
      }
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, narrow, count]);
  return h;
}

// Phones: the card under the middle of the screen opens as you scroll past the gallery.
function useScrollIndex(ref, enabled, count) {
  const [index, setIndex] = useState(undefined);
  useEffect(() => {
    if (!enabled) { setIndex(undefined); return undefined; }
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.5 - r.top) / Math.max(1, r.height);
      setIndex(Math.min(count - 1, Math.max(0, Math.floor(p * count))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, enabled, count]);
  return index;
}

// Big hover/scroll accordion (the main case studies).
function AccordionBlock({ list }) {
  const narrow = useNarrow();
  const galleryRef = useRef(null);
  const height = useGalleryHeight(galleryRef, narrow, list.length);
  const scrollIndex = useScrollIndex(galleryRef, narrow, list.length);
  const navigate = useNavigate();
  const items = list.map(p => ({
    image: asset(p.card),
    label: `${p.name}: ${p.cardTitle}`,
    alt: `${p.name}: ${p.cardTitle}`,
    link: workHref(p.slug),
    slug: p.slug,
    caption: (
      <>
        <span className="ag-caption__tags">{p.tags}</span>
        <span className="ag-caption__name serif">{p.name} <Arrow /></span>
        <span className="ag-caption__line">{p.cardTitle}</span>
      </>
    ),
  }));
  return (
    <div className="works__gallery" ref={galleryRef}>
      <AccordionGallery
        key={narrow ? 'v' : 'h'}
        items={items}
        onOpen={(item, el) => navigateWithTransition(navigate, `/work/${item.slug}/`, el)}
        defaultIndex={0}
        orientation={narrow ? 'vertical' : 'horizontal'}
        trigger={narrow ? 'click' : 'hover'}
        height={height}
        gap={narrow ? GAP.v : GAP.h}
        radius={16}
        expandRatio={narrow ? RATIO.v : RATIO.h}
        overlayColor="#132d37"
        accentColor="#ffffff"
        showLabels={false}
        grayscale
        tilt={6}
        activeIndex={scrollIndex}
      />
    </div>
  );
}

// Smaller two-column cards (interface explorations and any extra rows).
function GridBlock({ list }) {
  const navigate = useNavigate();
  return (
    <ul className="more-grid" role="list">
      {list.map(p => (
        <li key={p.slug}>
          <a
            href={workHref(p.slug)}
            className="more-card"
            onClick={e => {
              e.preventDefault();
              navigateWithTransition(navigate, `/work/${p.slug}/`, e.currentTarget);
            }}
          >
            <span className="more-card__img"><img src={asset(p.card)} alt={`${p.name}: ${p.cardTitle}`} loading="lazy" /></span>
            <span className="more-card__text">
              <span className="more-card__name serif">{p.name} <Arrow /></span>
              <span className="more-card__tags">{p.tags}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const Block = ({ group, list }) =>
  group.layout === 'accordion' && list.length > 1 ? <AccordionBlock list={list} /> : <GridBlock list={list} />;

export default function Works() {
  const [first, ...rest] = groups;
  const of = g => projects.filter(p => p.group === g.id);

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

      {first && of(first).length > 0 && <Block group={first} list={of(first)} />}

      {rest.map(g => {
        const list = of(g);
        if (!list.length) return null;
        return (
          <div className="works__more" key={g.id}>
            <h3 className="works__more-title serif">{g.title}</h3>
            {g.lines && <p className="works__more-lines">{g.lines}</p>}
            <Block group={g} list={list} />
          </div>
        );
      })}

      <Commercial />
    </section>
  );
}
