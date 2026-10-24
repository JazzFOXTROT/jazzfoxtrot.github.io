import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../sections/Hero.jsx';
import MeSection from '../sections/MeSection.jsx';
import Campaigns from '../sections/Campaigns.jsx';
import Works from '../sections/Works.jsx';
import Contacts from '../sections/Contacts.jsx';

export default function Home() {
  const { state } = useLocation();

  // Closing a project brings you back to "My works", not to the top of the page.
  useLayoutEffect(() => {
    if (state?.scrollTo) document.getElementById(state.scrollTo)?.scrollIntoView({ block: 'start' });
  }, [state]);

  return (
    <main className="home">
      <Hero />
      <MeSection />
      <Campaigns />
      <Works />
      <Contacts />
    </main>
  );
}
