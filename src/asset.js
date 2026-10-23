// Resolves files in /public against the Vite base path (/portfolio/ on GitHub Pages).
export const asset = path => `${import.meta.env.BASE_URL}assets/${path}`;
