import { useCallback, useEffect, useRef, useState } from 'react';
import ScrollExpand from '../components/reactbits/ScrollExpand.jsx';
import { about, aboutBackground } from '../content.js';
import { asset } from '../asset.js';

/*
 * Figma V3, 1440 × 1024 frame (V4 colours: light-blue panel, navy text).
 * Start: navy band 326×232 centred (y 396) behind a 406×201 rounded photo card, white "Me" on it.
 * End:   navy fills the screen, the photo becomes 406×586 on the right (x 1034, y 219),
 *        "Me" moves to the top-right, the text appears on the left, a star mark sits bottom-left.
 */
const useDesktop = () => {
  const q = '(min-width: 900px)';
  const [ok, set] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => set(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return ok;
};

// Figma V4: two white waves on the left of the About panel (replaced the star).
export const Waves = () => (
  <span className="me__waves" aria-hidden="true">
    <img className="me__wave me__wave--1" src={asset('v4/about-wave-1.svg')} alt="" />
    <img className="me__wave me__wave--2" src={asset('v4/about-wave-2.svg')} alt="" />
  </span>
);

export default function MeSection() {
  const desktop = useDesktop();
  const sectionRef = useRef(null);
  const onProgress = useCallback((p, e) => {
    sectionRef.current?.style.setProperty('--me-p', e.toFixed(4));
    window.dispatchEvent(new Event('me:progress')); // lets the sticky header re-check its colour
  }, []);

  const photo = (
    <div className="me__photo">
      <img src={asset('v3/me.jpg')} alt="Kirill in a black jacket and sunglasses in front of a stone fountain" />
      <span className="me__photo-shade" />
    </div>
  );
  const text = (
    <div className="me__text">
      {about.map((t, i) => (
        <p key={i} style={{ '--i': i }}>{t}</p>
      ))}
      <p className="me__background" style={{ '--i': about.length }}>
        <strong>Background:</strong> {aboutBackground}
      </p>
      <Waves />
    </div>
  );

  // Reduced motion: the section is shown already open, no scroll-driven reveal.
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!desktop || reduce) {
    return (
      <section id="me" className="me me--static" ref={sectionRef} aria-labelledby="me-title">
        <h2 id="me-title" className="me__title serif">Me</h2>
        {photo}
        {text}
      </section>
    );
  }

  return (
    <section id="me" className="me" ref={sectionRef} aria-labelledby="me-title">
      <ScrollExpand
        useWindowScroll
        mediaType="color"
        mediaColor="#ddeeff"
        startLeft={38.68}
        startTop={38.67}
        startWidth={22.64}
        startHeight={22.66}
        startRadius={0}
        endRadius={0}
        mediaZoom={1}
        overlayScrim={0}
        scrollDistance={1.1}
        holdDistance={0.3}
        smoothing={0.08}
        onProgress={onProgress}
        stayOpen
        stageChildren={
          <div className="me__stage">
            {photo}
            <h2 id="me-title" className="me__title serif">Me</h2>
            {text}
          </div>
        }
      />
    </section>
  );
}
