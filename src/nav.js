import { openAboutMe, scrollToSection } from './scroll.js';

// One menu for the hero and the sticky header.
export const NAV = [
  { label: 'Selected work', href: '#works' },
  { label: 'About me', href: '#me' },
  { label: 'Contacts', href: '#contacts' },
  { label: 'Resume', href: 'resume' },
];

export const go = (e, href) => {
  e.preventDefault();
  if (href === '#me') openAboutMe();
  else scrollToSection(href.slice(1));
};
