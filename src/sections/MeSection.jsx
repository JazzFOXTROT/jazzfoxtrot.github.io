import { useCallback, useEffect, useRef, useState } from 'react';
import ScrollExpand from '../components/reactbits/ScrollExpand.jsx';
import { about } from '../content.js';
import { asset } from '../asset.js';

// Design frame is 1440 x 1024. Start state: red block 948,308 491x408 behind the photo.
// End state: red fills the screen, "Me" moves to the top-left in beige, the text appears.
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

export default function MeSection() {
  const desktop = useDesktop();
  const stageRef = useRef(null);
  const onProgress = useCallback((p, e) => {
    const root = stageRef.current?.closest('.me');
    if (root) root.style.setProperty('--me-p', e.toFixed(4));
  }, []);

  const photo = <img className="me__photo" src={asset('img/me-photo.jpg')} alt="Kirill in a pink T-shirt on the Thames embankment in London" />;

  if (!desktop) {
    return (
      <section id="me" className="me me--static" aria-labelledby="me-title">
        <h2 id="me-title" className="me__title serif">Me</h2>
        {photo}
        <div className="me__text">{about.map((t, i) => <p key={i}>{t}</p>)}</div>
      </section>
    );
  }

  return (
    <section id="me" className="me" aria-labelledby="me-title">
      <ScrollExpand
        useWindowScroll
        mediaType="color"
        mediaColor="#8e0e0c"
        startLeft={65.83}
        startTop={30.08}
        startWidth={34.17}
        startHeight={39.84}
        startRadius={0}
        endRadius={0}
        mediaZoom={1}
        overlayScrim={0}
        scrollDistance={1.1}
        holdDistance={0.6}
        smoothing={0.08}
        onProgress={onProgress}
        stageChildren={
          <div ref={stageRef} className="me__stage">
            {photo}
            <h2 id="me-title" className="me__title serif">Me</h2>
            <div className="me__text">{about.map((t, i) => <p key={i} style={{ '--i': i }}>{t}</p>)}</div>
          </div>
        }
      />
    </section>
  );
}
