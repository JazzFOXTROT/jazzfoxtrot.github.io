const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let current = null;

/*
 * Smooth window scroll with our own easing, so steps can be chained.
 * `to` can be a number or a function: a function is re-read every frame, which keeps the
 * landing exact on phones where the browser bars collapse (and the layout shifts) mid-scroll.
 */
export function animateScroll(to, duration = 900) {
  if (current) current.cancel();
  const target = typeof to === 'function' ? to : () => to;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = window.scrollY;
  if (reduce || Math.abs(target() - from) < 2) {
    window.scrollTo(0, target());
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    let raf = 0;
    let done = false;
    const start = performance.now();
    const events = ['wheel', 'touchstart', 'keydown'];
    const remove = () => events.forEach(t => window.removeEventListener(t, stop));
    const stop = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      remove();
      resolve(false);
    };
    events.forEach(t => window.addEventListener(t, stop, { passive: true }));
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (target() - from) * ease(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      done = true;
      remove();
      // One quiet correction after the browser UI has settled.
      setTimeout(() => {
        const y = target();
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
        resolve(true);
      }, 220);
    };
    raf = requestAnimationFrame(tick);
    current = { cancel: stop };
  });
}

const topOf = el => () => el.getBoundingClientRect().top + window.scrollY;

// "About me": glide to the closed card, then ~400 ms after it stops (incl. the 220 ms
// settle inside animateScroll) it opens by itself.
// No extra scrolling is needed, the expansion plays in place.
export async function openAboutMe() {
  const me = document.getElementById('me');
  if (!me) return;
  const arrived = await animateScroll(topOf(me), 900);
  if (!arrived || me.classList.contains('me--static')) return;
  await new Promise(r => setTimeout(r, 180));
  me.querySelector('.scroll-expand')?.dispatchEvent(new Event('se:open'));
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) animateScroll(topOf(el), 1000);
}
