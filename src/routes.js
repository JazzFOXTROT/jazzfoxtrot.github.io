// Real paths (/work/decibuy) on blik.design, so every project is its own page for search engines.
// The local file:// preview build has no server, so it keeps hash URLs (#/work/decibuy).
export const HASH_ROUTES = import.meta.env.BASE_URL === './';
export const workHref = slug => (HASH_ROUTES ? `#/work/${slug}` : `/work/${slug}/`);
