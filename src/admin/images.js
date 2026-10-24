// Prepares uploaded images in the browser before they go to GitHub:
// sensible size, JPEG for photos, and the card shape the home page expects.

export const CARD = { w: 1030, h: 1138 }; // the accordion card shape (open state)
const CARD_MAX_W = 1545; // 1.5x of the card, sharp on retina, still light
const PAGE_MAX_W = 2880; // 2x of a 1440 desktop frame
const KEEP_UNDER = 3.5 * 1024 * 1024; // already-small files are uploaded untouched

const loadImage = file =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать картинку. Подойдут JPG, PNG или WebP.')); };
    img.src = url;
  });

const blobToBase64 = blob =>
  new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.readAsDataURL(blob);
  });

const draw = (img, sx, sy, sw, sh, w, h, type) =>
  new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    c.toBlob(b => (b ? resolve(b) : reject(new Error('Картинка слишком большая для браузера. Уменьши её и попробуй снова.'))), type, 0.86);
  });

/*
 * kind: 'card' → cropped to the card shape (centre), max 1545 wide
 *       'page' → full page design, max 2880 wide, never cropped
 * Returns { base64, ext, w, h, preview, cropped }
 */
export async function prepareImage(file, kind) {
  const { img, url } = await loadImage(file);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const png = file.type === 'image/png';
  const type = png ? 'image/png' : 'image/jpeg';
  const ext = png ? 'png' : 'jpg';

  if (kind === 'card') {
    const want = CARD.w / CARD.h;
    let sx = 0, sy = 0, sw = W, sh = H;
    const cropped = Math.abs(W / H - want) > 0.02;
    if (cropped) {
      if (W / H > want) { sw = Math.round(H * want); sx = Math.round((W - sw) / 2); }
      else { sh = Math.round(W / want); sy = Math.round((H - sh) / 2); }
    }
    const w = Math.min(CARD_MAX_W, sw);
    const h = Math.round(w / want);
    const blob = !cropped && sw <= CARD_MAX_W && file.size < KEEP_UNDER && /jpe?g|png/.test(file.type)
      ? file
      : await draw(img, sx, sy, sw, sh, w, h, type);
    return { base64: await blobToBase64(blob), ext: blob === file && !png ? 'jpg' : ext, w, h, preview: url, cropped };
  }

  const w = Math.min(PAGE_MAX_W, W);
  const h = Math.round(H * (w / W));
  const blob = W <= PAGE_MAX_W && file.size < KEEP_UNDER && /jpe?g|png/.test(file.type)
    ? file
    : await draw(img, 0, 0, W, H, w, h, type);
  return { base64: await blobToBase64(blob), ext, w, h, preview: url, cropped: false };
}
