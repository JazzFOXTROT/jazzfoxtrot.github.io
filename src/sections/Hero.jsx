import ShinyText from '../components/reactbits/ShinyText.jsx';
import Cubes from '../components/reactbits/Cubes.jsx';
import { hero } from '../content.js';
import { asset } from '../asset.js';

const NAV = [
  { label: 'About me', href: '#me' },
  { label: 'My works', href: '#works' },
  { label: 'Contacts', href: '#contacts' },
];

const go = (e, href) => {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
};

export default function Hero() {
  return (
    <section className="hero" aria-label="Intro">
      <div className="hero__media">
        <img className="hero__photo" src={asset('img/hero-photo.jpg')} alt="Kirill framing the camera with his hands on a bridge at night" />
        <div className="hero__cubes">
          <Cubes
            gridSize={11}
            gap={0.06}
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
        <span className="hero__logo serif">blik.</span>
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
