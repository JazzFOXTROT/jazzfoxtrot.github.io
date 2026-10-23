import Hero from '../sections/Hero.jsx';
import MeSection from '../sections/MeSection.jsx';
import Campaigns from '../sections/Campaigns.jsx';
import Works from '../sections/Works.jsx';
import Contacts from '../sections/Contacts.jsx';

export default function Home() {
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
