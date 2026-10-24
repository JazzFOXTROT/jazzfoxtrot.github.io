// After `vite build`: smaller copies of the big page designs, so phones and laptops
// don't download 2880-px-wide, 11 000-px-tall images.
//   foo.jpg → foo@720.jpg, foo@1440.jpg (only when the original is wider)
// Project.jsx builds `srcset` from the same naming, so new works from the editor get them too.
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('../dist/assets/', import.meta.url).pathname;
const DIRS = ['projects', 'uploads'];
export const WIDTHS = [720, 1440];

async function* walk(dir) {
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(jpe?g|png)$/i.test(e.name) && !/@\d+\./.test(e.name)) yield p;
  }
}

let made = 0;
sharp.cache(false);
for (const d of DIRS) {
  for await (const file of walk(join(ROOT, d))) {
    const ext = extname(file);
    const meta = await sharp(file, { limitInputPixels: false }).metadata();
    for (const w of WIDTHS) {
      if (meta.width <= w) continue;
      const out = file.slice(0, -ext.length) + `@${w}` + ext;
      const img = sharp(file, { limitInputPixels: false }).resize({ width: w });
      await (ext.toLowerCase() === '.png' ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 80, mozjpeg: true })).toFile(out);
      made += 1;
    }
  }
}
console.log(`responsive-images: ${made} files`);
