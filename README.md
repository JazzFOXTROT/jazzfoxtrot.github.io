# Kirill Blik — portfolio

Personal portfolio site. React + Vite, deployed to GitHub Pages:
https://jazzfoxtrot.github.io/portfolio/

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
