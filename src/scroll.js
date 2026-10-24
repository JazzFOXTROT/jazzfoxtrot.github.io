const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let current = null;

// Smooth window scroll with our own easing (so we can chain steps and know when they end).
export function animateScroll(to, duration = 900) {
  if (current) current.cancel();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = window.scrollY;
  if (reduce || Math.abs(to - from) < 2) {
    window.scrollTo(0, to);
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    let raf = 0;
    let done = false;
    const start = performance.now();
    const stop = () => { if (!done) { done = true; cancelAnimationFrame(raf); remove(); resolve(false); } };
    const remove = () => ['wheel', 'touchstart', 'keydown'].forEach(t => window.removeEventListener(t, stop));
    ['wheel', 'touchstart', 'keydown'].forEach(t => window.addEventListener(t, stop, { passive: true }));
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else { done = true; remove(); resolve(true); }
    };
    raf = requestAnimationFrame(tick);
    current = { cancel: stop };
  });
}

const top = el => el.getBoundingClientRect().top + window.scrollY;

// "About me": land on the closed card, wait a beat, then let it open by itself.
export async function openAboutMe() {
  const me = document.getElementById('me');
  if (!me) return;
  const arrived = await animateScroll(top(me), 900);
  if (!arrived || me.classList.contains('me--static')) return;
  await new Promise(r => setTimeout(r, 800));
  // ScrollExpand reaches its end state after 1.1 screen heights of scrolling.
  await animateScroll(top(me) + window.innerHeight * 1.15, 1600);
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) animateScroll(top(el), 1000);
}
