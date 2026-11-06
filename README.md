# Kirill Blik — portfolio

Personal portfolio site. React + Vite, deployed to GitHub Pages:
https://blik.design/

## Run locally

```bash
npm install
npm run dev
```

## Where things are

- `src/content.js` — all texts (hero, about, projects). Edit here.
- `public/assets/img/` — hero photo, "Me" photo, project cards.
- `public/assets/projects/` — full-page exports of the Figma projects.
- `src/assets/logos/` — brand logos for the campaigns loop.
- `src/components/reactbits/` — ShinyText, ScrollExpand, LogoLoop, GradualBlur, Cubes (React Bits).
  ScrollExpand is extended with `startLeft`, `startTop`, `mediaType="color"`, `stageChildren`, `onProgress`.

Design: Figma file "Portfolio".

## Deploy

Push to `main`. The GitHub Actions workflow builds and publishes `dist/`
(Settings → Pages → Source: GitHub Actions).

## Backups and rollback

Every earlier design is kept on its own branch on GitHub:

- `archive-v3`: the V3 design (also live at https://blik.design/archive/v3/).
- `archive-v4-audit`: the audit V4 design that was live until the
  Figma V4 redesign on 2026-11-06.

To put an old version back on blik.design:

```bash
git checkout main
git fetch origin
git reset --hard origin/archive-v4-audit
git push --force-with-lease
# to return to the new design later: git reset --hard <commit> (see `git reflog`)
```

The push deploys automatically. Links, the sitemap, SEO tags and the domain don't change,
because every version uses the same URLs.
