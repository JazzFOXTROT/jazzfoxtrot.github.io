import { useCallback, useEffect, useRef, useState } from 'react';
import ScrollExpand from '../components/reactbits/ScrollExpand.jsx';
import { about, aboutBackground } from '../content.js';
import { asset } from '../asset.js';

/*
 * Figma V3, 1440 × 1024 frame.
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

export const Star = () => (
  <svg className="me__star" width="371" height="371" viewBox="-93 0 371 371" fill="none" aria-hidden="true">
    <path
      d="M277.988 185.506C254.863 185.506 234.633 185.506 216.925 185.148C216.913 184.863 216.913 184.591 216.888 184.307C216.727 182.279 216.641 180.238 216.406 178.222C214.699 162.047 210.198 146.342 203.211 131.837C196.212 117.331 186.691 104.037 175.042 92.648C173.595 91.2135 172.062 89.8779 170.566 88.4929C169.045 87.1326 167.437 85.8713 165.879 84.5481C164.296 83.2496 162.651 82.0377 161.019 80.7764C159.374 79.5645 157.656 78.4268 155.974 77.2396C149.123 72.7012 141.803 68.744 134.099 65.5906C126.395 62.4743 118.345 60.0134 110.072 58.5666C108.007 58.2451 105.929 57.8741 103.852 57.602C101.762 57.3794 99.6722 57.095 97.57 56.9342C95.9748 56.86 94.3673 56.7735 92.7721 56.7116C92.4877 40.0543 92.4876 21.2576 92.4876 0C92.4876 21.2452 92.4877 40.0296 92.2032 56.6869C91.8817 56.6869 91.5726 56.6498 91.2511 56.6498C89.1489 56.6622 87.0219 56.588 84.9198 56.6869C68.028 57.2805 51.2228 61.4974 35.9139 68.7935C20.6297 76.1267 6.75525 86.5761 -4.33691 99.4247C-15.4662 112.224 -23.9739 127.236 -29.2417 143.263C-33.7058 156.792 -35.8945 171.05 -35.5854 185.209C-52.4277 185.506 -71.4463 185.506 -93 185.506C-71.434 185.506 -52.4029 185.506 -35.573 185.803C-35.5112 188.214 -35.3875 190.613 -35.1773 193.012C-33.7923 209.719 -28.71 225.944 -20.9937 240.524C-17.1232 247.82 -12.5231 254.683 -7.40363 261.101C-6.12995 262.709 -4.75735 264.23 -3.4342 265.8C-2.09869 267.346 -0.639519 268.793 0.745453 270.289C2.14279 271.786 3.65142 273.171 5.09823 274.605C6.56976 276.027 8.14022 277.338 9.64886 278.698C22.0271 289.358 36.3467 297.606 51.668 303.183C64.6027 307.858 78.2793 310.677 92.1661 311.296C92.5 328.683 92.5 348.456 92.5 371C92.5 348.481 92.5 328.72 92.8339 311.345C95.1834 311.432 97.5453 311.481 99.8948 311.444C108.155 311.333 116.453 310.381 124.602 308.612C132.738 306.819 140.727 304.185 148.369 300.76C163.641 293.847 177.503 283.583 188.508 270.846C199.563 258.158 207.601 242.985 212.226 227.044C214.539 219.068 215.985 210.882 216.678 202.695C216.801 200.642 216.962 198.602 217.036 196.549C217.049 194.496 217.135 192.456 217.098 190.416C217.036 188.895 217.024 187.373 216.962 185.852C234.67 185.494 254.901 185.494 278 185.494L277.988 185.506ZM97.063 69.5354C98.9674 69.5231 100.859 69.622 102.764 69.6467C104.668 69.7333 106.56 69.9188 108.477 70.0425C116.069 70.7968 123.674 72.1076 131.106 74.2223C145.958 78.4144 160.302 85.4632 172.544 95.4427C184.861 105.323 194.976 118.11 201.962 132.418C208.937 146.738 212.745 162.604 212.882 178.42C212.919 180.634 212.882 182.835 212.77 185.036C112.681 182.612 95.8759 167.229 93.0565 69.5849C94.392 69.5602 95.7275 69.5602 97.063 69.5231V69.5354ZM-16.9624 147.529C-11.7193 133.283 -3.75571 120.113 6.40901 108.984C16.5861 97.8665 28.7912 88.6784 42.3194 82.0254C55.8353 75.3476 70.6001 71.2544 85.6988 70.0054C87.5784 69.8322 89.4828 69.7704 91.3747 69.6467C91.5602 69.6467 91.7333 69.6467 91.9188 69.6344C89.1365 166.054 72.7147 182.254 -24.1099 184.962C-23.7018 172.163 -21.3152 159.488 -16.9501 147.529H-16.9624ZM53.1024 298.991C38.1645 294.057 24.29 285.834 12.7403 275.199C1.12879 264.601 -7.98483 251.443 -14.2172 237.222C-21.3028 220.985 -24.5674 203.413 -24.1593 186.038C73.7039 188.771 89.4704 205.267 92.0054 304.383C78.9347 304.89 65.6661 303.146 53.1148 298.979L53.1024 298.991ZM203.929 224.175C192.082 252.791 170.491 276.336 143.348 290.434C129.808 297.52 114.895 302.231 99.4373 303.864C97.2856 304.086 95.1339 304.247 92.9699 304.346C95.542 204.068 111.667 188.4 212.721 185.951C212.004 199.183 208.863 212.155 203.929 224.163V224.175Z"
      fill="#1D4352"
    />
  </svg>
);

export default function MeSection() {
  const desktop = useDesktop();
  const sectionRef = useRef(null);
  const onProgress = useCallback((p, e) => {
    sectionRef.current?.style.setProperty('--me-p', e.toFixed(4));
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
        <Star />
      </section>
    );
  }

  return (
    <section id="me" className="me" ref={sectionRef} aria-labelledby="me-title">
      <ScrollExpand
        useWindowScroll
        mediaType="color"
        mediaColor="#132d37"
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
            <Star />
            {photo}
            <h2 id="me-title" className="me__title serif">Me</h2>
            {text}
          </div>
        }
      />
    </section>
  );
}
