import { useCallback, useEffect, useRef, useState } from 'react';
import RotatingText from '../components/reactbits/RotatingText.jsx';
import FlipCard from '../components/reactbits/FlipCard.jsx';
import GlassBlob, { BLOB, BLOB_PATH } from '../components/GlassBlob.jsx';
import { hero, resume } from '../content.js';
import { asset, file } from '../asset.js';
// Bundled (not /public) so the glass shader can read them even from a local file:// preview.
import bridgeSrc from '../assets/v3/bridge.jpg';
import rockSrc from '../assets/v3/rock.jpg';
import { NAV, go } from '../nav.js';
import Arrow from '../components/Arrow.jsx';

// Collage geometry in Figma units (box 592 × 592 from x 768 / y 380 of the 1440 frame, Figma V4).
// Photos: bridge 1058/380, rock 768/595. The glass is now the blue blob (Vector 107:846) at 893/442.
const BOX = { w: 592, h: 592 };
const BRIDGE = { x: 290, y: 0, w: 302, h: 437 };
const ROCK = { x: 0, y: 215, w: 302, h: 377, crop: { x: 0.0993, y: 0.1985, w: 0.8017, h: 0.8007 } };
const GLASS = { x: 125, y: 62, w: BLOB.w, h: BLOB.h };
const pct = (v, of) => `${(v / of) * 100}%`;

const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Draw what sits behind the glass (in glass coordinates) for the refraction shader:
// the white page and both photos.
async function paintBehindGlass(ctx) {
  const [bridge, rock] = await Promise.all([loadImage(bridgeSrc), loadImage(rockSrc)]);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-40, -40, GLASS.w + 80, GLASS.h + 80);
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
        alt="Kirill Blik on a bridge at night"
        style={{ left: pct(BRIDGE.x, BOX.w), top: pct(BRIDGE.y, BOX.h), width: pct(BRIDGE.w, BOX.w), height: pct(BRIDGE.h, BOX.h) }}
      />
      <div
        className="collage__photo collage__photo--crop"
        style={{ left: pct(ROCK.x, BOX.w), top: pct(ROCK.y, BOX.h), width: pct(ROCK.w, BOX.w), height: pct(ROCK.h, BOX.h) }}
      >
        <img
          src={rockSrc}
          alt="Kirill Blik sitting on a rock by the sea"
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
        style={{ left: pct(GLASS.x, BOX.w), top: pct(GLASS.y, BOX.h), width: pct(GLASS.w, BOX.w), height: pct(GLASS.h, BOX.h) }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onPointerUp={e => e.pointerType === 'touch' && onLeave()}
      >
        <FlipCard
          focusable={false}
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
              <GlassBlob paintBackdrop={paintBehindGlass} pointer={pointer} />
              <svg className="glass-blob__fallback" viewBox={`0 0 ${BLOB.w} ${BLOB.h}`} aria-hidden="true"><path d={BLOB_PATH} /></svg>
            </div>
          }
        />
      </div>
    </div>
  );
}

const words = hero.rotating;
const heroSentence = `${hero.titleStart} ${hero.titleJoin} ${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}.`;

export default function Hero() {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <section className="hero" aria-label="Intro">
      <span className="hero__logo serif">blik<span className="hero__logo-dot">.</span></span>
      {/* Figma V4: two grainy squiggles in the top-right corner (blue under, cream on top). */}
      <img className="hero__squiggle hero__squiggle--blue" src={asset('v4/hero-squiggle-blue.svg')} alt="" aria-hidden="true" />
      <img className="hero__squiggle hero__squiggle--cream" src={asset('v4/hero-squiggle-yellow.svg')} alt="" aria-hidden="true" />

      <div className="hero__intro">
        <p className="hero__label">{hero.label}</p>
        <h1 className="hero__title serif">
          {/* Screen readers and crawlers get one steady sentence; the animated version is visual only. */}
          <span className="visually-hidden">{heroSentence}</span>
          <span aria-hidden="true">
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
            <span className="tilde-link__label">{n.label} <Arrow /></span>
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
