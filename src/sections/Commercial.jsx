import { useEffect, useRef, useState } from 'react';
import CircularGallery from '../components/reactbits/CircularGallery.jsx';
import { commercial, commercialIntro } from '../commercial.js';
import { asset } from '../asset.js';

const CLOSE_MS = 600; // matches the grid-rows transition in styles.css

// One category: an underlined serif title + "/" + description; the title opens its gallery below.
function Category({ cat, open, onToggle }) {
  const [mounted, setMounted] = useState(open);
  const items = useRef(cat.items.map(it => ({ ...it, image: asset(it.image) }))).current;

  // Keep the WebGL gallery mounted while the panel folds away, then free it.
  const panelRef = useRef(null);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Once unfolded, bring the whole gallery into view if it ended up below the fold.
      const t = setTimeout(() => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        panelRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      }, CLOSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open]);

  const panelId = `commercial-${cat.id}`;
  return (
    <li className={`commercial__item${open ? ' is-open' : ''}`}>
      <div className="commercial__row">
        <button
          type="button"
          className="commercial__toggle serif"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="commercial__name">{cat.title}</span>
          <span className="commercial__slash" aria-hidden="true"> /</span>
        </button>
        <p className="commercial__lines">{cat.lines}</p>
      </div>
      <div id={panelId} ref={panelRef} className="commercial__panel" role="region" aria-label={`${cat.title} gallery`}>
        <div className="commercial__panel-inner">
          {mounted && (
            <div className="commercial__gallery">
              <CircularGallery
                items={items}
                bend={2}
                textColor="#ffffff"
                font="400 22px 'Geist Variable'"
                borderRadius={0.04}
                itemAspect={0.9}
                itemSize={1}
                gap={0.22}
                scrollEase={0.06}
                shadow={0.22}
                fadeEdges={0.1}
                aria-label={`${cat.title}: ${cat.items.length} works`}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Commercial() {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="works__more commercial" id="commercial">
      <h3 className="works__more-title serif">{commercialIntro.title}</h3>
      <p className="works__more-lines">{commercialIntro.lines}</p>
      <ul className="commercial__list" role="list">
        {commercial.map(cat => (
          <Category
            key={cat.id}
            cat={cat}
            open={openId === cat.id}
            onToggle={() => setOpenId(id => (id === cat.id ? null : cat.id))}
          />
        ))}
      </ul>
    </div>
  );
}
