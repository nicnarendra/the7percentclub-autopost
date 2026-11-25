// Instagram carousel slides (1080x1350 JPG) in The 7% Club's B1 line-art style.
// usage: node studio/carousel.mjs <dir>   reads <dir>/carousel.json, writes <dir>/carousel/1.jpg ... n.jpg
// carousel.json: { "handle": "@the7.percentclub", "slides": [
//   {"kind":"hook",  "title":"₹5,000 a month", "accent":"= ₹50 lakh?", "sub":"Why your SIP feels slow", "mood":"shock"},
//   {"kind":"stat",  "label":"After 10 years", "big":"₹11.6 lakh", "note":"assumes 12% a year, not guaranteed"},
//   {"kind":"point", "n":1, "title":"Year 1-5 feels useless", "body":["Most of the money is still yours,","not growth."]},
//   {"kind":"compare","left":["FD","₹26L"],"right":["SIP","₹50L"],"note":"..."},
//   {"kind":"end",   "title":"Save this", "sub":"for the day you want to quit"} ] }
// 2-10 slides. Keep text short: 3-8 words a line.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(new URL('./package.json', import.meta.url));
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const R = await import('./lib/draw.mjs');
const { fig, text, strokePath, circlePts, coinStack, card, underline, checkMark } = R;
// Hindi carousels (STUDIO_LANG=hi): Noto Sans has no Devanagari, so body text uses Kalam too.
if ((process.env.STUDIO_LANG || '').toLowerCase() === 'hi') { GlobalFonts.registerFromPath(new URL('./assets/fonts/Kalam-Regular.ttf', import.meta.url).pathname, 'Sans'); GlobalFonts.registerFromPath(new URL('./assets/fonts/Kalam-Bold.ttf', import.meta.url).pathname, 'Sans'); }
else GlobalFonts.registerFromPath(new URL('./assets/fonts/NotoSans.ttf', import.meta.url).pathname, 'Sans');

const dir = path.resolve(process.argv[2] || '.');
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'carousel.json')));
const W = 1080, H = 1350, INK = '#1d1d1f', GREEN = '#2f9a5a', RED = '#e0452f', NAVY = '#27406b', GREY = '#8a8f95';
const out = path.join(dir, 'carousel'); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(out, f));

function bg(ctx) {
  ctx.fillStyle = '#FDFDFC'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(76,90,105,.05)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 45; x < W; x += 45) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
  for (let y = 45; y < H; y += 45) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); } ctx.stroke();
}
function sans(ctx, s, x, y, size, c = INK, weight = 600, align = 'center') { ctx.save(); ctx.font = `${weight} ${size}px Sans`; ctx.fillStyle = c; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.restore(); }
function fit(ctx, s, max, size, font = 'Hand', weight = 'bold') { let z = size; for (; z > 30; z -= 4) { ctx.font = `${weight} ${z}px ${font}`; if (ctx.measureText(s).width <= max) break; } return z; }
function swipe(ctx, i, n, seed) {
  sans(ctx, `${i}/${n}`, 980, 90, 34, GREY, 500, 'right');
  sans(ctx, cfg.handle || '@the7.percentclub', 90, 90, 32, GREY, 500, 'left');
  if (i < n) { text(ctx, cfg.swipe || 'swipe', 930, 1270, { size: 46, c: GREY, weight: 'normal', align: 'right' });
    strokePath(ctx, [[945, 1255], [1010, 1255]], { w: 5, c: GREY, seed }); strokePath(ctx, [[990, 1238], [1012, 1255], [990, 1272]], { w: 5, c: GREY, seed: seed + 1 }); }
}
const slides = cfg.slides.slice(0, 10);
slides.forEach((s, k) => {
  const c = createCanvas(W, H), ctx = c.getContext('2d'); bg(ctx); const seed = 100 + k * 20;
  if (s.kind === 'hook') {
    text(ctx, s.title, 540, 330, { size: fit(ctx, s.title, 940, 130) });
    if (s.accent) text(ctx, s.accent, 540, 480, { size: fit(ctx, s.accent, 940, 140), c: GREEN, rot: -0.03 });
    underline(ctx, 220, 860, 520, 0, 10, { c: GREEN, w: 8 });
    fig(ctx, { x: 540, y: 860, s: 1.3, seed, t: 0, mood: s.mood || 'shock', arms: [[-120, -150], [120, 150]], legs: [[-14, -10], [14, 10]] });
    if (s.sub) sans(ctx, s.sub, 540, 1150, fit(ctx, s.sub, 900, 54, 'Sans', 600), '#444');
  } else if (s.kind === 'stat') {
    text(ctx, s.label, 540, 330, { size: fit(ctx, s.label, 920, 96) });
    card(ctx, 140, 420, 800, 300, '#d9ecdd', seed); sans(ctx, s.big, 540, 620, fit(ctx, s.big, 720, 150, 'Sans', 700), GREEN, 700);
    coinStack(ctx, 260, 1080, 6, 1.6, seed + 3); coinStack(ctx, 360, 1080, 10, 1.6, seed + 4); coinStack(ctx, 460, 1080, 15, 1.6, seed + 5);
    fig(ctx, { x: 780, y: 930, s: 1.1, seed: seed + 6, t: 0, mood: 'grin', look: -1, arms: [[-120, -90], [25, 10]], legs: [[-14, -10], [14, 10]] });
    if (s.note) sans(ctx, s.note, 540, 1180, 34, GREY, 500);
  } else if (s.kind === 'point') {
    ctx.save(); ctx.fillStyle = '#d9ecdd'; ctx.beginPath(); ctx.arc(170, 300, 70, 0, 7); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(170, 300, 70, 70, 20), { w: 5, seed, c: GREEN }); text(ctx, String(s.n ?? k), 170, 330, { size: 90, c: GREEN });
    const lines = Array.isArray(s.title) ? s.title : [s.title]; lines.forEach((l, j) => text(ctx, l, 280, 290 + j * 118, { size: fit(ctx, l, 720, 92), align: 'left' }));
    (s.body || []).forEach((l, j) => sans(ctx, l, 140, 560 + j * 78, 52, '#333', 500, 'left'));
    fig(ctx, { x: 860, y: 1060, s: 1.0, seed: seed + 8, t: 0, mood: s.mood || 'neutral', look: -1, arms: [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
  } else if (s.kind === 'compare') {
    if (s.title) text(ctx, s.title, 540, 260, { size: fit(ctx, s.title, 920, 92) });
    [[s.left, 290, RED], [s.right, 790, GREEN]].forEach(([[name, val], x, col], j) => {
      card(ctx, x - 220, 380, 440, 520, j ? '#d9ecdd' : '#f9d6cf', seed + j); text(ctx, name, x, 500, { size: fit(ctx, name, 380, 84), c: col });
      sans(ctx, val, x, 720, fit(ctx, val, 380, 110, 'Sans', 700), col, 700); });
    text(ctx, 'vs', 540, 680, { size: 90, c: GREY });
    if (s.note) sans(ctx, s.note, 540, 1060, 36, GREY, 500);
  } else { // end
    text(ctx, s.title || 'Save this', 540, 360, { size: 140, c: GREEN });
    if (s.sub) sans(ctx, s.sub, 540, 470, fit(ctx, s.sub, 900, 56, 'Sans', 600), '#444');
    fig(ctx, { x: 540, y: 840, s: 1.2, seed, t: 0, mood: 'grin', arms: [[-120, -150], [120, 150]], legs: [[-14, -10], [14, 10]] });
    { const fl = cfg.follow || `Follow ${cfg.handle || '@the7.percentclub'} for daily money lessons`; sans(ctx, fl, 540, 1140, fit(ctx, fl, 960, 40, 'Sans', 600), NAVY, 600); }
    sans(ctx, cfg.disclaimer || 'Educational only. Not investment advice.', 540, 1210, 30, GREY, 500);
  }
  swipe(ctx, k + 1, slides.length, seed + 15);
  fs.writeFileSync(path.join(out, `${k + 1}.jpg`), c.toBuffer('image/jpeg', 90));
});
console.log(`wrote ${slides.length} slides to ${out}`);
