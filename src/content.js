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


export const campaigns = {
  title: 'Campaigns I’ve contributed to',
  note: "Selected brands I've created campaign assets for while working at KSP.",
};

export const resume = 'Kirill_Blik_Resume.pdf';

export const contacts = {
  email: 'kirillblik@gmail.com',
  linkedin: 'https://www.linkedin.com/in/kirillblik/',
};

// Works and their groups live in data/works.json, which the private editor (/admin/) updates.
// Order in the file = order on the site. Hidden works stay in the file but are not shown.
import worksData from './data/works.json';

export const groups = worksData.groups;
export const projects = worksData.projects.filter(p => !p.hidden && groups.some(g => g.id === p.group));
// Same order as on the home page: group by group.
export const orderedProjects = groups.flatMap(g => projects.filter(p => p.group === g.id));
