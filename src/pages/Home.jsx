import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { headerOffset } from '../scroll.js';
import Hero from '../sections/Hero.jsx';
import MeSection from '../sections/MeSection.jsx';
import Campaigns from '../sections/Campaigns.jsx';
import Works from '../sections/Works.jsx';
import Contacts from '../sections/Contacts.jsx';
import Bring from '../sections/Bring.jsx';
import ToTop from '../components/ToTop.jsx';
import SiteHeader from '../components/SiteHeader.jsx';

export default function Home() {
  const { state } = useLocation();

  // Closing a project brings you back to "My works", not to the top of the page.
  // The "Me" ScrollExpand sets its height after mount, so jump once layout has settled.
  useEffect(() => {
    if (!state?.scrollTo) return undefined;
    const jump = () => {
      const el = document.getElementById(state.scrollTo);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - headerOffset(el));
    };
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(jump); });
    const t = setTimeout(jump, 350);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, [state]);

  return (
    <main className="home">
      {/* Hidden until a keyboard user presses Tab: jumps past the intro and menu. */}
      <a href="#works" className="skip-link">Skip to selected work</a>
      <SiteHeader />
      <Hero />
      <Works />
      <Campaigns />
      <MeSection />
      <Bring />
      <Contacts />
      <ToTop />
    </main>
  );
}
