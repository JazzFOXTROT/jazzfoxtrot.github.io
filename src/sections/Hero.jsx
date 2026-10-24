import { useCallback, useEffect, useRef, useState } from 'react';
import RotatingText from '../components/reactbits/RotatingText.jsx';
import FlipCard from '../components/reactbits/FlipCard.jsx';
import GlassRefraction from '../components/GlassRefraction.jsx';
import { hero, resume } from '../content.js';
import { file } from '../asset.js';
// Bundled (not /public) so the glass shader can read them even from a local file:// preview.
import bridgeSrc from '../assets/v3/bridge.jpg';
import rockSrc from '../assets/v3/rock.jpg';
import Ornament from '../components/Ornament.jsx';
import { openAboutMe, scrollToSection } from '../scroll.js';

const NAV = [
  { label: 'Selected work', href: '#works' },
  { label: 'About me', href: '#me' },
  { label: 'Contacts', href: '#contacts' },
  { label: 'Resume ↗', href: 'resume' },
];

const go = (e, href) => {
  e.preventDefault();
  if (href === '#me') openAboutMe();
  else scrollToSection(href.slice(1));
};

// Collage geometry in Figma units (box 628 × 604, from x 732 / y 420 of the 1440 frame).
const BOX = { w: 628, h: 604 };
const BRIDGE = { x: 326, y: 0, w: 302, h: 437 };
const ROCK = { x: 0, y: 227, w: 302, h: 377, crop: { x: 0.0993, y: 0.1985, w: 0.8017, h: 0.8007 } };
const GLASS = { x: 142, y: 65, w: 335, h: 451 };
const pct = (v, of) => `${(v / of) * 100}%`;

const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Draw what sits behind the glass (in glass coordinates) for the refraction shader.
async function paintBehindGlass(ctx) {
  const [bridge, rock] = await Promise.all([loadImage(bridgeSrc), loadImage(rockSrc)]);
  // Same input as the Figma effect: page colour + both photos behind, then the glass layer's own 20% black.
  ctx.fillStyle = '#d5492b';
  ctx.fillRect(0, 0, GLASS.w, GLASS.h);
  const bx = BRIDGE.x - GLASS.x;
  const by = BRIDGE.y - GLASS.y;
  const s = Math.max(BRIDGE.w / bridge.width, BRIDGE.h / bridge.height); // object-fit: cover
  const dw = bridge.width * s;
  const dh = bridge.height * s;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, BRIDGE.w, BRIDGE.h);
  ctx.clip();
  ctx.drawImage(bridge, bx + (BRIDGE.w - dw) / 2, by + (BRIDGE.h - dh) / 2, dw, dh);
  ctx.restore();
  const c = ROCK.crop;
  ctx.drawImage(
    rock,
    c.x * rock.width, c.y * rock.height, c.w * rock.width, c.h * rock.height,
    ROCK.x - GLASS.x, ROCK.y - GLASS.y, ROCK.w, ROCK.h
  );
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, GLASS.w, GLASS.h);
}

function Collage() {
  const boxRef = useRef(null);
  const [k, setK] = useState(1);
  const [pointer, setPointer] = useState(null);
  const raf = useRef(0);

  useEffect(() => {
    const el = boxRef.current;
    const ro = new ResizeObserver(() => setK(el.clientWidth / BOX.w || 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMove = useCallback(e => {
    const r = e.currentTarget.getBoundingClientRect();
    const next = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setPointer(next));
  }, []);
  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setPointer(null);
  }, []);

  return (
    <div className="collage" ref={boxRef} aria-hidden="true">
      <img
        className="collage__photo"
        src={bridgeSrc}
        alt=""
        style={{ left: pct(BRIDGE.x, BOX.w), top: pct(BRIDGE.y, BOX.h), width: pct(BRIDGE.w, BOX.w), height: pct(BRIDGE.h, BOX.h) }}
      />
      <div
        className="collage__photo collage__photo--crop"
        style={{ left: pct(ROCK.x, BOX.w), top: pct(ROCK.y, BOX.h), width: pct(ROCK.w, BOX.w), height: pct(ROCK.h, BOX.h) }}
      >
        <img
          src={rockSrc}
          alt=""
          style={{
            width: `${100 / ROCK.crop.w}%`,
            height: `${100 / ROCK.crop.h}%`,
            left: `${(-ROCK.crop.x / ROCK.crop.w) * 100}%`,
            top: `${(-ROCK.crop.y / ROCK.crop.h) * 100}%`,
          }}
        />
      </div>
      <div
        className="collage__glass"
        style={{ left: pct(GLASS.x, BOX.w), top: pct(GLASS.y, BOX.h) }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onPointerUp={e => e.pointerType === 'touch' && onLeave()}
      >
        <FlipCard
          width={Math.round(GLASS.w * k)}
          height={Math.round(GLASS.h * k)}
          radius={0}
          background="transparent"
          flipOnClick={false}
          draggable={false}
          touchTilt
          tilt
          tiltMax={14}
          glare={false}
          hoverScale={1.04}
          shadow={false}
          ariaLabel="Glass"
          front={
            <div className="glass">
              <GlassRefraction width={GLASS.w} height={GLASS.h} paintBackdrop={paintBehindGlass} pointer={pointer} />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <section className="hero" aria-label="Intro">
      <span className="hero__logo serif">blik.</span>
      <Ornament corner="top-right" className="hero__ornament" />

      <div className="hero__intro">
        <p className="hero__label">{hero.label}</p>
        <h1 className="hero__title serif">
          <span className="hero__start">{hero.titleStart}</span>{' '}
          <span className="hero__end">
          {hero.titleJoin}{' '}
          <RotatingText
            texts={hero.rotating}
            mainClassName="hero__rotate"
            splitLevelClassName="hero__rotate-word"
            staggerFrom="last"
            staggerDuration={0.025}
            rotationInterval={2600}
            auto={!reduce}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          />
          <span className="hero__dot">.</span>
          </span>
        </h1>
        <p className="hero__lines">{hero.lines}</p>
        <a href="#works" className="hero__cta" onClick={e => go(e, '#works')}>
          {hero.cta} <span aria-hidden="true">↓</span>
        </a>
      </div>

      <nav className="hero__nav" aria-label="Main">
        {NAV.map(n => n.href === 'resume' ? (
          <a key={n.href} href={file(resume)} target="_blank" rel="noreferrer" className="tilde-link serif">
            <span className="tilde" aria-hidden="true">~</span>
            <span className="tilde-link__label">{n.label}</span>
            <span className="tilde" aria-hidden="true">~</span>
          </a>
        ) : (
          <a key={n.href} href={n.href} onClick={e => go(e, n.href)} className="tilde-link serif">
            <span className="tilde" aria-hidden="true">~</span>
            <span className="tilde-link__label">{n.label}</span>
            <span className="tilde" aria-hidden="true">~</span>
          </a>
        ))}
      </nav>

      <Collage />
    </section>
  );
}
