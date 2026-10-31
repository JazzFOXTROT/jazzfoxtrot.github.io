// After `vite build`: make the site readable without JavaScript.
//
// Search engines and AI assistants (ChatGPT, Claude, Perplexity…) often read only the raw HTML.
// The app renders everything with JS, so here every page gets:
//   • its own <title>, description, canonical URL, Open Graph / Twitter preview tags
//   • JSON-LD: who Kirill is (Person) and what each work is (CreativeWork)
//   • a plain-HTML copy of the page's text inside #root (React replaces it on load;
//     browsers with JS hide it instantly, so visitors never see it)
// Plus /work/<slug>/index.html for every project, 404.html, sitemap.xml, robots.txt, llms.txt.
// All text comes from src/content.js, src/commercial.js and src/data/works.json (the editor's file).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const SITE = 'https://blik.design';
const GITHUB = 'https://github.com/JazzFOXTROT';

const vite = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const c = await vite.ssrLoadModule('/src/content.js');
const { commercial, commercialIntro } = await vite.ssrLoadModule('/src/commercial.js');
await vite.close();

const { hero, about, aboutBackground, bring, contacts, resume, groups, orderedProjects: projects } = c;
const today = new Date().toISOString().slice(0, 10);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = u => (/^https?:/.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);
const asset = p => `/assets/${p}`;
const caseUrl = p => (p.type === 'case' && p.url ? abs(p.url) : null);

const NAME = 'Kirill Blik';
const ROLE = 'Product Designer';
const HOME_TITLE = `${NAME} · ${ROLE}`;
const HOME_DESC =
  `${NAME} is a product and UX/UI designer with a graphic design background. ` +
  `Case studies: ${projects.filter(p => p.type === 'case').map(p => p.name).join(' and ')}, ` +
  `web design and commercial design for global brands.`;

const person = {
  '@type': 'Person',
  '@id': `${SITE}/#person`,
  name: NAME,
  jobTitle: ROLE,
  description: hero.lines,
  url: `${SITE}/`,
  image: abs(asset('v3/me.jpg')),
  email: `mailto:${contacts.email}`,
  sameAs: [contacts.linkedin, GITHUB],
  alumniOf: [
    { '@type': 'EducationalOrganization', name: 'Tiltan School of Design and Visual Communication' },
    { '@type': 'CollegeOrUniversity', name: 'Western Galilee College' },
    { '@type': 'EducationalOrganization', name: 'John Bryce' },
  ],
  knowsAbout: ['Product design', 'UX design', 'UI design', 'User research', 'Prototyping', 'Figma', 'Graphic design', 'Design systems'],
};
const website = { '@type': 'WebSite', '@id': `${SITE}/#website`, name: HOME_TITLE, url: `${SITE}/`, author: { '@id': person['@id'] } };

const workLd = p => ({
  '@type': 'CreativeWork',
  '@id': `${SITE}/work/${p.slug}/#work`,
  name: p.name,
  headline: p.cardTitle,
  description: p.about,
  url: `${SITE}/work/${p.slug}/`,
  image: abs(asset(p.card)),
  keywords: p.tags,
  author: { '@id': person['@id'] },
  creator: { '@id': person['@id'] },
  ...(caseUrl(p) ? { mainEntityOfPage: caseUrl(p) } : {}),
});

/* ---------- plain-HTML copies of the pages ---------- */

const homeText = () => `
<header>
  <p>${esc(hero.label)}</p>
  <h1>${esc(NAME)}, ${esc(ROLE)}: ${esc(hero.titleStart)} ${esc(hero.titleJoin)} ${esc(hero.rotating[0])}.</h1>
  <p>${esc(hero.lines)}</p>
  <nav><a href="#works">Selected work</a> · <a href="#me">About me</a> · <a href="#contacts">Contacts</a> · <a href="/${esc(resume)}">Resume (PDF)</a></nav>
</header>
<main>
${groups.map((g, i) => {
  const list = projects.filter(p => p.group === g.id);
  if (!list.length) return '';
  return `  <section${i === 0 ? ' id="works"' : ''}>
    <h2>${esc(g.title)}</h2>
    ${g.lines ? `<p>${esc(g.lines)}</p>` : ''}
    <ul>
${list.map(p => `      <li><a href="/work/${p.slug}/"><strong>${esc(p.name)}</strong>: ${esc(p.cardTitle)}</a>. ${esc(p.about)} <em>${esc(p.tags)}</em>${caseUrl(p) ? ` <a href="${esc(caseUrl(p))}">Read the case study</a>` : ''}</li>`).join('\n')}
    </ul>
  </section>`;
}).join('\n')}
  <section>
    <h2>${esc(commercialIntro.title)}</h2>
    <p>${esc(commercialIntro.lines)}</p>
${commercial.map(cat => `    <h3>${esc(cat.title)}</h3>
    <p>${esc(cat.lines)}</p>
    <p>${cat.items.map(it => esc(it.text)).join(', ')}.</p>`).join('\n')}
  </section>
  <section id="me">
    <h2>About me</h2>
${about.map(t => `    <p>${esc(t)}</p>`).join('\n')}
    <p><strong>Background:</strong> ${esc(aboutBackground)}</p>
  </section>
  <section>
    <h2>What I bring to the table</h2>
    <ul>${bring.map(b => `<li><strong>${esc(b.title)}</strong>: ${esc(b.text)}</li>`).join('')}</ul>
  </section>
</main>
<footer id="contacts">
  <h2>Contacts</h2>
  <p>Email: <a href="mailto:${esc(contacts.email)}">${esc(contacts.email)}</a> · <a href="${esc(contacts.linkedin)}">LinkedIn</a> · <a href="/${esc(resume)}">Resume (PDF)</a></p>
</footer>`;

const workText = (p, i) => {
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  return `
<header><p><a href="/">${esc(NAME)}, ${esc(ROLE)}</a></p></header>
<main>
  <article>
    <h1>${esc(p.name)}: ${esc(p.cardTitle)}</h1>
    <p>${esc(p.about)}</p>
    <p>${esc(p.tags)}</p>
    ${caseUrl(p) ? `<p><a href="${esc(caseUrl(p))}">Read the full case study</a></p>` : ''}
    ${p.pages?.length ? `<p>Page designs: ${p.pages.map(pg => esc(pg.label)).filter(Boolean).join(', ')}.</p>
    ${p.pages.map(pg => `<img src="${esc(asset(pg.src))}" alt="${esc(`${p.name}, ${pg.label} page design`)}" width="${pg.w}" height="${pg.h}" loading="lazy">`).join('\n    ')}` : ''}
  </article>
  <nav><a href="/work/${prev.slug}/">Previous: ${esc(prev.name)}</a> · <a href="/work/${next.slug}/">Next: ${esc(next.name)}</a> · <a href="/#works">All work</a></nav>
</main>
<footer><p>${esc(NAME)} · <a href="mailto:${esc(contacts.email)}">${esc(contacts.email)}</a> · <a href="${esc(contacts.linkedin)}">LinkedIn</a></p></footer>`;
};

/* ---------- page assembly ---------- */

const template = await readFile(join(DIST, 'index.html'), 'utf8');

const head = ({ title, desc, url, image, imageAlt, ld, type = 'website', noindex = false }) => `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="author" content="${NAME}" />
    ${noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`}
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="${esc(HOME_TITLE)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${esc(imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld }).replace(/</g, '\\u003c')}</script>
    <script>document.documentElement.classList.add('js')</script>
    <style>.js #seo{display:none}#seo{max-width:46rem;margin:0 auto;padding:2rem 1rem;font:16px/1.5 system-ui,sans-serif}</style>`;

function page(meta, text) {
  let html = template
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head(meta)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div id="seo">${text}\n</div></div>`);
  return html;
}

const homeMeta = {
  title: HOME_TITLE,
  desc: HOME_DESC,
  url: `${SITE}/`,
  image: abs('/og/home.jpg'),
  imageAlt: `${NAME}, ${ROLE}: portfolio`,
  type: 'profile',
  ld: [person, website, ...projects.map(workLd)],
};
await writeFile(join(DIST, 'index.html'), page(homeMeta, homeText()));
await writeFile(join(DIST, '404.html'), page({ ...homeMeta, title: `Page not found · ${NAME}`, noindex: true }, homeText()));

for (const [i, p] of projects.entries()) {
  const dir = join(DIST, 'work', p.slug);
  await mkdir(dir, { recursive: true });
  const meta = {
    title: `${p.name}: ${p.cardTitle} · ${NAME}`,
    desc: p.about,
    url: `${SITE}/work/${p.slug}/`,
    image: abs(asset(p.card)),
    imageAlt: `${p.name}: ${p.cardTitle}`,
    type: 'article',
    ld: [person, { ...workLd(p), isPartOf: { '@id': website['@id'] } }, website],
  };
  await writeFile(join(dir, 'index.html'), page(meta, workText(p, i)));
}

/* ---------- sitemap, robots, llms.txt ---------- */

const urls = [
  { loc: `${SITE}/`, priority: '1.0' },
  ...projects.map(p => ({ loc: `${SITE}/work/${p.slug}/`, priority: '0.8' })),
  ...projects.filter(caseUrl).map(p => ({ loc: caseUrl(p), priority: '0.8' })),
];
await writeFile(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`,
);

await writeFile(
  join(DIST, 'robots.txt'),
  `# Everyone is welcome, search engines and AI assistants alike.
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /archive/
# The resume PDF has a phone number: reachable from the site, kept out of search results.
Disallow: /${resume}

Sitemap: ${SITE}/sitemap.xml
`,
);

await writeFile(
  join(DIST, 'llms.txt'),
  `# ${NAME}, ${ROLE}

> ${hero.lines}

${about.join('\n\n')}

Background: ${aboutBackground}

${groups.map(g => {
  const list = projects.filter(p => p.group === g.id);
  if (!list.length) return '';
  return `## ${g.title}\n\n${list.map(p => `- [${p.name}](${SITE}/work/${p.slug}/): ${p.cardTitle}. ${p.about}${caseUrl(p) ? ` Case study: ${caseUrl(p)}` : ''}`).join('\n')}`;
}).filter(Boolean).join('\n\n')}

## ${commercialIntro.title}

${commercialIntro.lines}
${commercial.map(cat => `- ${cat.title}: ${cat.lines} (${cat.items.map(it => it.text).join(', ')})`).join('\n')}

## Contact

- Email: ${contacts.email}
- LinkedIn: ${contacts.linkedin}
`,
);

console.log(`seo: ${projects.length + 2} pages, sitemap (${urls.length} urls), robots.txt, llms.txt`);
