// All site copy lives here so it can be edited in one place.
// Facts come from Kirill's resume (Oct 2026). Nothing invented.

export const hero = {
  label: 'Kirill Blik · Product Designer', // never animated, so the role is clear at a glance
  titleStart: 'Making complex things',
  titleJoin: 'feel', // kept with the rotating word so it never sits alone on a phone
  // Each word finishes the same sentence.
  rotating: ['intuitive', 'clear', 'simple', 'effortless'],
  lines:
    'I combine product thinking, visual design and business understanding to turn complex problems into useful digital experiences.',
  cta: 'Explore selected work',
};

export const bring = [
  { n: '01', title: 'Think', text: 'Understand users and define the problem.' },
  { n: '02', title: 'Design', text: 'Make ideas clear, useful and visually compelling.' },
  { n: '03', title: 'Connect', text: 'Balance user needs with business goals.' },
];

export const about = [
  "I'm Kirill, a product designer with a background in graphic design, management and digital marketing.",
  'My experience in e-commerce taught me how visual decisions connect with audiences, brands and business goals. Today, I bring that perspective into product design, combining user research, thoughtful interfaces and hands-on prototyping.',
  'I enjoy making complicated things easier to understand, use and navigate. From the first question to the final interaction.',
];
export const aboutBackground =
  'Graphic Designer at KSP · B.A. in Management & Digital Marketing · UX/UI & Product Design at John Bryce';

export const works = {
  title: 'Selected work',
  years: '2025–2026',
  lines: 'Product work where I took a real problem from research to a working prototype.',
  moreTitle: 'Interface explorations',
  moreLines: 'Website concepts designed in Figma: layout, type and responsive UI.',
};

export const campaigns = {
  title: 'Campaigns I’ve contributed to',
  note: "Selected brands I've created campaign assets for while working at KSP.",
};

export const resume = 'Kirill_Blik_Resume.pdf';

export const contacts = {
  email: 'kirillblik@gmail.com',
  linkedin: 'https://www.linkedin.com/in/kirillblik/',
};

export const projects = [
  {
    slug: 'decibuy',
    name: 'DeciBuy',
    tier: 'main',
    card: 'v3/card-decibuy.jpg',
    cardTitle: 'Smarter decisions before checkout',
    tags: 'Independent concept · Product design · Research & prototyping',
    about:
      'A phone app that looks at a price, your spare money and your payday, and answers before you pay: Buy, Wait for payday or Not now.',
    type: 'case',
    url: 'https://jazzfoxtrot.github.io/DeciBuy/case/',
  },
  {
    slug: 'leeway',
    name: 'Leeway',
    tier: 'main',
    card: 'v3/card-leeway.jpg',
    cardTitle: 'A more predictable airport experience',
    tags: 'John Bryce capstone · UX/UI · Research & usability testing',
    about:
      'Pre-book a time slot for the security check at Ben Gurion Airport, and get guided until check-in is done. Research, a 12-screen app and a live prototype.',
    type: 'case',
    url: 'https://jazzfoxtrot.github.io/leeway0.1/case/index-en.html',
  },
  {
    slug: 'travel',
    name: 'Turkey Travel Editorial',
    tier: 'more',
    card: 'v3/card-travel.jpg',
    cardTitle: 'Web design · Responsive UI',
    tags: 'Web design · Responsive UI · Design system',
    about: 'A travel blog about Turkey: home and blog pages, a mobile version and a small design system, designed in Figma.',
    type: 'pages',
    pages: [
      { src: 'travel-home.jpg', label: 'Home', w: 2880, h: 11646 },
      { src: 'travel-blog.jpg', label: 'Blog', w: 2880, h: 6182 },
      { src: 'travel-mobile.jpg', label: 'Mobile', w: 320, h: 6277, narrow: true },
      { src: 'travel-design-system.jpg', label: 'Design system', w: 2235, h: 1800 },
    ],
  },
  {
    slug: 'photographer',
    name: 'William Smith Photography',
    tier: 'more',
    card: 'v3/card-photographer.jpg',
    cardTitle: 'Web design · Visual design',
    tags: 'Web design · Visual design · Concept',
    about: 'A one-page portfolio for a wedding and commercial photographer (fictional client), designed in Figma.',
    type: 'pages',
    pages: [{ src: 'photographer-home.jpg', label: 'Home', w: 2880, h: 8198 }],
  },
];
