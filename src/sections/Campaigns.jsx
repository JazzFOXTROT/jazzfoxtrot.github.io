import { campaigns } from '../content.js';
import LogoLoop from '../components/reactbits/LogoLoop.jsx';
import samsung from '../assets/logos/samsung.svg';
import lg from '../assets/logos/lg.svg';
import lego from '../assets/logos/lego.png';
import loreal from '../assets/logos/loreal.svg';
import disney from '../assets/logos/disney.svg';
import mattel from '../assets/logos/mattel.svg';
import razer from '../assets/logos/razer.svg';
import xiaomi from '../assets/logos/xiaomi.svg';

// Heights follow the Figma frame (logos sit on a ~45px line, Disney/Mattel are taller marks).
const LOGOS = [
  { src: samsung, alt: 'Samsung', width: 293, height: 45 },
  { src: lg, alt: 'LG', width: 144, height: 63 },
  { src: lego, alt: 'LEGO', width: 153, height: 73 },
  { src: loreal, alt: "L'Oréal", width: 251, height: 46 },
  { src: disney, alt: 'Disney', width: 216, height: 90 },
  { src: mattel, alt: 'Mattel', width: 99, height: 99 },
  { src: razer, alt: 'Razer', width: 217, height: 35 },
  { src: xiaomi, alt: 'Xiaomi', width: 211, height: 35 },
];

export default function Campaigns() {
  return (
    <section className="campaigns" aria-labelledby="campaigns-title">
      <h2 id="campaigns-title" className="campaigns__title serif">{campaigns.title}</h2>
      <p className="campaigns__note">{campaigns.note}</p>
      <LogoLoop
        logos={LOGOS}
        speed={70}
        direction="left"
        logoHeight={64}
        gap={48}
        pauseOnHover
        draggable={false}
        fadeOut
        fadeOutWidth={0.08}
        renderItem={item => (
          <img src={item.src} alt={item.alt} style={{ height: `calc(${item.height}px * var(--logo-k, 0.9))`, width: 'auto' }} draggable={false} />
        )}
        ariaLabel="Brands I made campaigns for"
      />
    </section>
  );
}
