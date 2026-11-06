import RotatingText from '../components/reactbits/RotatingText.jsx';
import { hero, resume } from '../content.js';
import { asset, file } from '../asset.js';
import { NAV, go } from '../nav.js';
import Arrow from '../components/Arrow.jsx';

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

      {/* Figma V4 "Hero pic": one flower photo three times (the side copies frosted) with a green
          square and a soft blue glow, exported from Figma at 2x as a single picture. */}
      <img
        className="hero__pic"
        src={asset('v4/hero-pic.webp')}
        alt=""
        aria-hidden="true"
        width="441"
        height="617"
        decoding="async"
        fetchpriority="high"
      />
    </section>
  );
}
