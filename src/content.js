// All site copy lives here so it can be edited in one place.
// Facts come from Kirill's resume (Oct 2026). Nothing invented.

export const hero = {
  titleStart: 'From insight',
  titleJoin: 'to', // kept with the rotating word so it never sits alone on a phone
  rotating: ['interaction', 'clarity', 'impact', 'experience'],
  lines:
    'UX/UI & Product Designer with a graphic design background. I take products from research to a working prototype.',
};

export const about = [
  "I'm Kirill, a UX/UI and Product Designer. I started in graphic design, and I still care about the craft: type, composition and the small details people notice without knowing why. Now I use it to design products that solve a real problem, end to end.",
  "From April 2025 to October 2026 I worked as a graphic designer in the Graphics & Media department of KSP, a high-traffic e-commerce platform. I made campaigns, banners, branded landing pages, newsletters, Instagram visuals and TikTok videos for brands like Samsung, LG, LEGO, L'Oréal, Disney, Razer and Xiaomi.",
  "I studied graphic design at Tiltan, hold a B.A. in Management & Digital Marketing from Western Galilee College, and completed the UX/UI & Product Design program at John Bryce. There I designed and built Leeway: research, personas, journey maps, flows, a 12-screen high-fidelity UI and a live prototype tested with 7 people.",
  "I'm comfortable on the front-end side too. I build my own prototypes in HTML, CSS and JavaScript, and I know how ready-made React components work, so what I design can actually ship. I work in Figma, Photoshop, Illustrator and InDesign, and I use AI tools to move faster through research and prototyping.",
];

export const works = {
  lines: 'Two products I designed end to end, and two websites designed in Figma. Pick one to open it.',
};

export const contacts = {
  email: 'kirillblik@gmail.com',
  linkedin: 'https://www.linkedin.com/in/kirillblik/',
};

export const projects = [
  {
    slug: 'decibuy',
    name: 'DeciBuy',
    card: 'v3/card-decibuy.jpg',
    cardTitle: 'Purchase decision app',
    about:
      'Share a product from any store and get one verdict, Buy, Wait for payday or Not now, based on your own money situation.',
    type: 'case',
    url: 'https://jazzfoxtrot.github.io/DeciBuy/case/',
  },
  {
    slug: 'leeway',
    name: 'Leeway',
    card: 'v3/card-leeway.jpg',
    cardTitle: 'Airport queue problem solution',
    about:
      'Pre-book a time slot for the security check at Ben Gurion Airport. UX/UI capstone at John Bryce: research, a 12-screen app and a live prototype.',
    type: 'case',
    url: 'https://jazzfoxtrot.github.io/leeway0.1/case/index-en.html',
  },
  {
    slug: 'travel',
    name: 'Travel Project',
    card: 'v3/card-travel.jpg',
    cardTitle: 'Travel Project',
    about: 'A travel blog website about Turkey: home and blog pages, a mobile version and a small design system, designed in Figma.',
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
    name: 'Photographer portfolio',
    card: 'v3/card-photographer.jpg',
    cardTitle: 'Photographer portfolio',
    about: 'A one-page portfolio website for a photographer, designed in Figma.',
    type: 'pages',
    pages: [{ src: 'photographer-home.jpg', label: 'Home', w: 2880, h: 8198 }],
  },
];
