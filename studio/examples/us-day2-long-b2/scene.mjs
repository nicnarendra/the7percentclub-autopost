// US Day 2 long-form 16:9: "You're Not Behind" — Fed SCF 2025 data, richer motion
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createCanvas } = require('@napi-rs/canvas');
const R0 = await import('../../lib/draw.mjs');
const R = { ...R0 };
const { GlobalFonts } = require('@napi-rs/canvas'); GlobalFonts.registerFromPath(new URL('../../assets/fonts/NotoSans.ttf', import.meta.url).pathname, 'Sans');
const { fig: fig0, text: text0, strokePath, circlePts, box, coinStack, writeText, ramp, pop, ss, lerp, clamp, fillPoly, card, checkMark, crossMark, marks, sweat, line, phone, textWidth } = R;
const IVORY_HEAD = '#FBF8F1';
const fig = (ctx, o) => fig0(ctx, { ...o, lw: o.lw ? o.lw * 0.7 : 3.6, headFill: o.headFill || IVORY_HEAD, c: o.c || '#3a3a37' });
function text(ctx, s, x, y, o = {}) {
  if (/^[\$≈~−+-]?[\$0-9]/.test(s) && /[0-9]/.test(s)) { const a = o.alpha ?? 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.scale || 1, o.scale || 1);
    ctx.font = `700 ${Math.round((o.size || 80) * 0.78)}px Sans`; ctx.fillStyle = o.c || '#3a3a37'; ctx.textAlign = o.align || 'center'; ctx.fillText(s, 0, 0); ctx.restore(); return; }
  text0(ctx, s, x, y, { ...o, weight: o.weight === 'normal' ? 'normal' : (o.size || 80) >= 60 ? 'normal' : 'bold', c: o.c || '#3a3a37' });
}

const DIR = new URL('./', import.meta.url).pathname;
const W = 1920, H = 1080, FPS = 30, LEAD = 0.4;
const INK = '#1d1d1f', RED = '#b86f52', GREEN = '#5d8a5a', YEL = '#d9b45f', NAVY = '#4f6f8f', GREY = '#9aa0a6', PAPER = '#F3EFE6', LG = '#dfe6d6', LR = '#f0d2c6';
const SEG = JSON.parse(fs.readFileSync(DIR + 'segments.json')).map(s => ({ ...s, start: s.start + LEAD, end: s.end + LEAD }));
const WORDS = JSON.parse(fs.readFileSync(DIR + 'words.json')).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = SEG[SEG.length - 1].end + 2.5;
const S = i => SEG[i].start;
const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && o.text.toLowerCase().replace(/[^a-z0-9$-]/g, '').startsWith(w.toLowerCase())); return x ? x.start : SEG[i].start; };
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const count = (t, t0, dur, v) => v * ss(clamp((t - t0) / dur));

function paper(ctx) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(120,100,70,.035)'; for (let i = 0; i < 900; i++) { const x = (i * 733) % W, y = (i * 389) % H; ctx.fillRect(x, y, 2, 2); }
}
const CHAPS = ['The average trap', 'Net worth by age', 'Cash', 'Debt', 'Retirement', 'Why you feel behind', 'What actually matters', 'Recap'];
function header(ctx, n, t0, t) {
  writeText(ctx, CHAPS[n].toUpperCase(), 110, 120, t0 + 0.1, t, { size: 64, align: 'left', dur: 0.5 });
  for (let i = 0; i < CHAPS.length; i++) { const x = 1340 + i * 64, done = i < n, cur = i === n;
    ctx.save(); ctx.fillStyle = done ? GREEN : cur ? YEL : '#e6e0d4'; ctx.beginPath(); ctx.arc(x, 100, 18, 0, 7); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(x, 100, 18, 18, 14), { w: 3, seed: 520 + i }); }
}
function stamp(ctx, s, x, y, k, c = RED, size = 70, rot = -0.07) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  const w = textWidth(ctx, s, size) + 60;
  strokePath(ctx, [[-w / 2, -size * 0.85], [w / 2, -size * 0.85], [w / 2, size * 0.45], [-w / 2, size * 0.45]], { w: 6, c, seed: 600 + s.length, close: true });
  text(ctx, s, 0, size * 0.2, { size, c }); ctx.restore();
}
function popCard(ctx, x, y, w, h, fill, seed, k, draw) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); card(ctx, -w / 2, -h / 2, w, h, fill, seed); draw && draw(); ctx.restore(); }
const walkLegs = (t, sp = 9, a = 22) => [[-a * Math.sin(t * sp) - 4, -10], [a * Math.sin(t * sp) + 4, 10]];
function person(ctx, x, y, s, mood, seed, t, o = {}) { return fig(ctx, { x, y, s, seed, t, mood, hair: false, arms: o.arms || [[-25, -12], [25, 12]], legs: o.legs || [[-14, -10], [14, 10]], c: o.c, tilt: o.tilt || 0 }); }
function hat(ctx, f, seed) { const [hx, hy] = f.head; const r = f.r || 30;
  fillPoly(ctx, [[hx - r * 0.8, hy - r * 0.8], [hx + r * 0.8, hy - r * 0.8], [hx + r * 0.7, hy - r * 2.2], [hx - r * 0.7, hy - r * 2.2]], INK, seed, 1);
  line(ctx, hx - r * 1.3, hy - r * 0.8, hx + r * 1.3, hy - r * 0.8, { w: 6, seed: seed + 1 }); }
function dollarBag(ctx, x, y, s, seed) { const pts = [[x - 18 * s, y - 70 * s], [x - 46 * s, y - 34 * s], [x - 44 * s, y - 4 * s], [x, y], [x + 44 * s, y - 4 * s], [x + 46 * s, y - 34 * s], [x + 18 * s, y - 70 * s]];
  fillPoly(ctx, pts, '#e6d3a3', seed, 1); strokePath(ctx, pts, { w: 4 * s, seed, close: true }); text(ctx, '$', x, y - 18 * s, { size: 46 * s, c: GREEN }); }
function piggy(ctx, x, y, s, seed) { ctx.save(); ctx.fillStyle = '#e3a89a'; ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 24 * s, 0, 0, 7); ctx.fill(); ctx.restore();
  strokePath(ctx, circlePts(x, y, 34 * s, 24 * s, 18), { w: 3 * s, seed }); line(ctx, x - 8 * s, y - 22 * s, x + 8 * s, y - 22 * s, { w: 4 * s, seed: seed + 1 });
  [-18, 14].forEach((dx, i) => line(ctx, x + dx * s, y + 20 * s, x + dx * s, y + 32 * s, { w: 4 * s, seed: seed + 2 + i })); }

// ---------------- 0. hook (0-3) ----------------
const POSTS = [['Paid off my house at 24!', LG], ['Retired at 30', '#dde3e8'], ['My $2M portfolio', '#f6ecd2'], ['New Tesla day!', LG], ['Quit my 9-5', LR], ['Passive income $40K/mo', '#dde3e8']];
function hook(ctx, t) {
  // phone with scrolling feed
  const scroll = t * 120;
  ctx.save(); ctx.translate(560, 560); ctx.scale(3.2, 3.2);
  phone(ctx, 0, 0, 1, 3);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(560 - 180, 560 - 300, 360, 610); ctx.clip();
  for (let i = 0; i < 12; i++) { const [s, c] = POSTS[i % POSTS.length]; const y = 300 + i * 150 - (scroll % (150 * POSTS.length));
    card(ctx, 400, y, 320, 120, c, 30 + i); text(ctx, s, 560, y + 72, { size: 30 }); text(ctx, '♥ ' + (1 + (i * 37) % 90) + 'K', 660, y + 108, { size: 20, c: RED, weight: 'normal' }); }
  ctx.restore();
  text(ctx, 'EVERYONE ONLINE', 1350, 230, { size: 80, alpha: ramp(t, 0.1, 0.3) });
  writeText(ctx, 'SEEMS RICH', 1350, 330, 0.6, t, { size: 96, c: GREEN, dur: 0.4 });
  const shrink = 1 - 0.25 * ss(clamp((t - S(1)) / 6));
  const mood = t < S(2) ? 'worried' : t < S(3) ? 'neutral' : 'smug';
  const f = fig(ctx, { x: 1350, y: 720 - (1 - shrink) * -100, s: 1.4 * shrink, seed: 5, t, mood, look: -1, arms: [[-25, -10], [25, 10]], legs: [[-16, -10], [16, 10]] });
  if (t > S(1) && t < S(2)) sweat(ctx, f.head[0] + 50, f.head[1] - 10, 1, t);
  if (t > S(2)) { const k = pop(t, at(2, 'federal'), 0.4); stamp(ctx, 'FEDERAL RESERVE DATA', 1350, 470, k, NAVY, 54, -0.04); }
  if (t > S(3)) { const k = pop(t, S(3) + 0.3, 0.4); popCard(ctx, 1350, 980, 600, 100, LG, 60, k, () => text(ctx, 'Where do YOU stand?', 0, 20, { size: 54, c: GREEN })); }
}

// ---------------- 1. average trap (4-14) ----------------
function trap(ctx, t) {
  header(ctx, 0, S(4), t);
  if (t < S(8)) {
    const k = pop(t, S(5) + 0.3, 0.4);
    if (k > 0) { text(ctx, 'AVERAGE U.S. FAMILY NET WORTH', 960, 330, { size: 52, c: '#555', alpha: clamp(k) });
      text(ctx, '$' + (count(t, S(5) + 0.3, 2.5, 1.24)).toFixed(2) + 'M', 960, 560, { size: 230, c: GREEN, scale: lerp(0.7, 1, k) });
      text(ctx, 'Fed Survey of Consumer Finances, 2025', 960, 660, { size: 36, c: GREY, weight: 'normal' }); }
    stamp(ctx, 'A MILLIONAIRE?', 620, 860, pop(t, S(6), 0.35), NAVY, 70, -0.06);
    stamp(ctx, 'MISLEADING', 1250, 860, pop(t, at(7, 'misleading'), 0.35), RED, 80, 0.05);
    const f = fig(ctx, { x: 1650, y: 560, s: 0.9, seed: 70, t, mood: t > S(7) ? 'angry' : 'shock', arms: [[-150, -200], [150, 200]], legs: [[-14, -10], [14, 10]] });
    if (t > S(6)) marks(ctx, f.head[0] + 40, f.head[1] - 30, 0.8, 71);
    return;
  }
  // room of 10 people (sorted by height later), billionaire enters
  const sortK = ss(clamp((t - S(11) - 0.5) / 1.8));
  const worth = [40, 310, 12, 160, 95, 230, 5, 520, 250, 216];
  const order = worth.map((w, i) => [w, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  for (let i = 0; i < 10; i++) {
    const slotA = i, slotB = order.indexOf(i);
    const enter = clamp((t - S(8) - i * 0.12) / 0.6);
    const x = lerp(lerp(-100, 200 + slotA * 120, ss(enter)), 200 + slotB * 120, sortK);
    const isMed = t > S(12) - 0.2 && (slotB === 4 || slotB === 5) && worth[i] === 216;
    const mood = t > S(9) && t < S(11) ? 'neutral' : isMed ? 'grin' : 'happy';
    const f = person(ctx, x, 720, 0.62, mood, 100 + i, t, { legs: enter < 1 ? walkLegs(t) : undefined });
    if (t > S(11) + 2.4) { const k = ramp(t, S(11) + 2.4, 0.3); ctx.save(); ctx.globalAlpha = k; text(ctx, '$' + worth[i] + 'K', x, 870, { size: 30, c: isMed ? GREEN : '#666' }); ctx.restore(); }
    if (isMed) { strokePath(ctx, circlePts(x, 730, 80, 150, 22), { w: 6, c: GREEN, seed: 140, prog: ramp(t, S(12) - 0.2, 0.6) }); }
  }
  // billionaire
  if (t < S(11)) {
    const bk = clamp((t - at(8, 'billionaire')) / 1.6);
    if (bk > 0) { const bx = lerp(2050, 1640, ss(bk));
      const f = person(ctx, bx, 700, 0.85, 'smug', 150, t, { legs: bk < 1 ? walkLegs(t) : undefined, arms: [[-25, -12], [60, 40]] });
      hat(ctx, f, 151); dollarBag(ctx, f.hands[1][0] + 20, f.hands[1][1] + 60, 0.9, 152);
      if (t > at(8, 'billionaire') + 0.8) text(ctx, '$1,000,000,000', bx, 300, { size: 48, c: GREEN, alpha: ramp(t, at(8, 'billionaire') + 0.8) }); }
    // average gauge
    if (t > S(9)) { const avg = t < S(9) + 0.3 ? 135 : count(t, S(9) + 0.3, 1.8, 90900000) + 135000;
      popCard(ctx, 960, 230, 820, 110, '#f6ecd2', 160, pop(t, S(9), 0.35), () => text(ctx, 'ROOM AVERAGE: ' + (avg > 1e6 ? '$' + (avg / 1e6).toFixed(1) + 'M' : fmt(avg)), 0, 22, { size: 54, c: NAVY }));
      if (t > at(9, 'nobody') && t < S(10)) stamp(ctx, 'NOBODY GOT RICHER', 960, 1000, pop(t, at(9, 'nobody'), 0.35), RED, 56, 0.03); }
    if (t > S(10)) { text(ctx, 'A few very rich families drag the average up', 960, 1000, { size: 44, c: '#444', weight: 'normal', alpha: ramp(t, S(10)) }); }
  } else {
    writeText(ctx, 'MEDIAN = THE ONE IN THE MIDDLE', 960, 250, S(11) + 0.2, t, { size: 66, c: NAVY, dur: 0.7 });
    strokePath(ctx, [[180, 880 + 40], [1340, 880 + 40]], { w: 4, c: GREY, seed: 170, prog: ramp(t, S(11) + 0.3, 0.6) });
    text(ctx, 'poorest', 210, 970, { size: 34, c: GREY, weight: 'normal', alpha: ramp(t, S(11) + 0.8) });
    text(ctx, 'richest', 1310, 970, { size: 34, c: GREY, weight: 'normal', alpha: ramp(t, S(11) + 0.8) });
    if (t > S(12)) {
      const k = pop(t, S(12) + 0.2, 0.4);
      popCard(ctx, 1640, 520, 440, 300, LG, 180, k, () => { text(ctx, 'MEDIAN FAMILY', 0, -80, { size: 40, c: '#444' }); text(ctx, fmt(count(t, S(12) + 0.2, 1.6, 215900)), 0, 30, { size: 84, c: GREEN }); text(ctx, 'net worth, 2025', 0, 100, { size: 34, c: GREY, weight: 'normal' }); });
    }
    if (t > S(13)) { text(ctx, '$1.24M', 1640, 280, { size: 64, c: GREY }); crossMark(ctx, 1640, 260, ramp(t, at(13, 'two'), 0.3), 2.0, 190); }
    if (t > S(14)) { const items = [['home equity', '+'], ['retirement', '+'], ['cars & stuff', '+'], ['all debt', '−']];
      items.forEach(([s, sg], i) => { const k = pop(t, S(14) + 0.5 + i * 0.5, 0.3); if (k <= 0) return; ctx.save(); ctx.translate(1640, 760 + i * 62); ctx.scale(k, k);
        text(ctx, sg + ' ' + s, 0, 0, { size: 40, c: sg === '+' ? GREEN : RED }); ctx.restore(); }); }
  }
}

// ---------------- 2. by age (15-25) ----------------
const AGES = [['<35', 33000, 16], ['35–44', 155600, 17], ['45–54', 253700, 18], ['55–64', 411900, 19], ['65–74', 431300, 20], ['75+', 504900, 21]];
function ages(ctx, t) {
  header(ctx, 1, S(15), t);
  const x0 = 260, base = 880, bw = 170, gap = 90, sc = 520 / 520000;
  strokePath(ctx, [[x0 - 40, base], [x0 + 6 * (bw + gap) + 10, base]], { w: 5, seed: 200 });
  text(ctx, 'Median net worth by age (2025)', 960, 230, { size: 50, c: '#444', alpha: ramp(t, S(15) + 0.3) });
  let lastX = x0 - 100;
  AGES.forEach(([lab, v, si], i) => {
    const x = x0 + i * (bw + gap); text(ctx, lab, x + bw / 2, base + 60, { size: 46, alpha: ramp(t, S(15) + 0.5 + i * 0.12) });
    if (t < S(si)) return; lastX = x + bw / 2;
    const g = ss(clamp((t - S(si) - 0.2) / 1.0)); const h = v * sc * g;
    const hi = (i === 0 && t > S(23)) ? '#e3a89a' : i === 0 ? '#a9bea3' : '#a9bea3';
    box(ctx, x, base - h, bw, Math.max(h, 1), { fill: hi, lw: 4, seed: 210 + i });
    text(ctx, fmt(v * g), x + bw / 2, base - h - 24, { size: 44, c: GREEN });
  });
  // walker along the axis
  if (t > S(22)) { // growth curve over bars
    const pts = AGES.map(([, v], i) => [x0 + i * (bw + gap) + bw / 2, base - v * sc - 80]);
    strokePath(ctx, pts, { w: 7, c: NAVY, seed: 240, prog: ramp(t, S(22) + 0.4, 1.5) });
    if (t < S(23)) text(ctx, 'slow... then decades of growth', 960, 330, { size: 50, c: NAVY, alpha: ramp(t, S(22) + 1.5) });
  }
  if (t > S(23)) {
    const k = pop(t, S(24) + 0.2, 0.4);
    if (t < S(25)) popCard(ctx, 640, 380, 600, 160, LR, 250, k, () => { text(ctx, 'Under 35: −23%', 0, -10, { size: 64, c: RED }); text(ctx, 'median net worth, 2022 to 2025', 0, 50, { size: 34, c: '#555', weight: 'normal' }); });
    if (k > 0.8) strokePath(ctx, [[480, 470], [x0 + bw / 2, base - 70]], { w: 5, c: RED, seed: 251, prog: ramp(t, S(24) + 0.6, 0.5) });
    if (t > S(25)) stamp(ctx, 'START OF THE CURVE', 640, 400, pop(t, S(25) + 0.3, 0.35), GREEN, 52, -0.05);
  }
}

// ---------------- 3. cash (26-29) ----------------
function cash(ctx, t) {
  header(ctx, 2, S(26), t);
  const jx = 600, jy = 900;
  strokePath(ctx, [[jx - 170, jy - 430], [jx - 170, jy], [jx + 170, jy], [jx + 170, jy - 430]], { w: 6, seed: 300 });
  line(ctx, jx - 190, jy - 430, jx + 190, jy - 430, { w: 6, seed: 301 });
  text(ctx, 'CHECKING + SAVINGS', jx, jy + 60, { size: 40, c: NAVY });
  const fillK = ss(clamp((t - S(27)) / 2.0));
  for (let i = 0; i < Math.floor(fillK * 16); i++) { const r = i % 4, c = Math.floor(i / 4);
    box(ctx, jx - 150 + r * 75, jy - 40 - c * 48, 66, 36, { fill: '#dfe6d6', lw: 3, seed: 310 + i }); text(ctx, '$', jx - 117 + r * 75, jy - 12 - c * 48, { size: 24, c: GREEN }); }
  if (t > S(27)) { text(ctx, 'TYPICAL FAMILY', 1350, 330, { size: 50, c: '#444' }); text(ctx, fmt(count(t, S(27), 2.0, 8200)), 1350, 480, { size: 150, c: GREEN }); text(ctx, 'median, 2025', 1350, 550, { size: 36, c: GREY, weight: 'normal' }); }
  if (t > S(28)) { [['$50,000', at(28, 'not')], ['1 year of bills', at(28, 'not') + 0.9]].forEach(([s, t0], i) => {
      const k = pop(t, t0, 0.3); popCard(ctx, 1200 + i * 330, 720, 290, 100, '#FBF8F1', 320 + i, k, () => text(ctx, s, 0, 16, { size: 38 }));
      if (k > 0.9) crossMark(ctx, 1200 + i * 330, 715, ramp(t, t0 + 0.3, 0.3), 1.6, 330 + i); }); }
  if (t > S(29)) { const k = pop(t, S(29) + 0.3, 0.4); popCard(ctx, 1350, 900, 720, 110, LG, 340, k, () => text(ctx, '1 month saved = a real start', 0, 18, { size: 48, c: GREEN })); }
  const f = fig(ctx, { x: 900, y: 650, s: 0.9, seed: 350, t, mood: t > S(29) ? 'grin' : t > S(28) ? 'shock' : 'neutral', look: -1, arms: [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
}

// ---------------- grid of 20 people ----------------
function crowd(ctx, t, t0, nHi, colorHi, prop, seedBase) {
  for (let i = 0; i < 20; i++) { const r = Math.floor(i / 10), c = i % 10, x = 220 + c * 105, y = 520 + r * 270;
    const hi = i < nHi && t > t0 + i * 0.12;
    person(ctx, x, y, 0.42, hi ? (colorHi === RED ? 'worried' : 'happy') : 'neutral', seedBase + i, t, { c: hi ? colorHi : '#888' });
    if (hi && prop) prop(x, y, i); }
}

// ---------------- 4. debt (30-34) ----------------
function debt(ctx, t) {
  header(ctx, 3, S(30), t);
  // swinging card + chain
  const sw = Math.sin(t * 2.2) * 0.08;
  ctx.save(); ctx.translate(1560, 170); ctx.scale(0.7, 0.7); ctx.rotate(sw);
  for (let i = 0; i < 4; i++) strokePath(ctx, circlePts(0, 20 + i * 34, 12, 18, 10), { w: 4, seed: 400 + i, c: GREY });
  card(ctx, -150, 150, 300, 190, '#dde3e8', 404); line(ctx, -150, 200, 150, 200, { w: 14, seed: 405 }); text(ctx, '~21% APR', 0, 300, { size: 44, c: RED });
  ctx.restore();
  if (t > S(31)) { crowd(ctx, t, S(31) + 0.3, 9, RED, null, 410); text(ctx, '~45% carry a card balance', 720, 280, { size: 56, c: RED, alpha: ramp(t, S(31) + 0.2) }); }
  if (t > S(32)) { const k = pop(t, S(32) + 0.3, 0.4); popCard(ctx, 1560, 640, 420, 170, '#f6ecd2', 440, k, () => { text(ctx, fmt(count(t, S(32) + 0.3, 1.2, 3100)), 0, 0, { size: 80, c: RED }); text(ctx, 'median balance', 0, 55, { size: 34, c: '#555', weight: 'normal' }); }); }
  if (t > S(33)) { const k = pop(t, S(33) + 0.2, 0.4);
    popCard(ctx, 1560, 900, 520, 170, LR, 450, k, () => { text(ctx, '1 in 5 paid late', 0, -5, { size: 56, c: RED }); text(ctx, '(about 1 in 8 in 2022)', 0, 50, { size: 34, c: '#555', weight: 'normal' }); }); }
  if (t > S(34)) stamp(ctx, 'NOT SHAME. A PLAN.', 720, 1010, pop(t, at(34, 'goal'), 0.35), GREEN, 52, -0.03);
}

// ---------------- 5. retirement (35-39) ----------------
function retire(ctx, t) {
  header(ctx, 4, S(35), t);
  if (t > S(36)) { crowd(ctx, t, S(36) + 0.3, 11, GREEN, (x, y, i) => piggy(ctx, x + 38, y + 70, 0.7, 500 + i), 520);
    text(ctx, '~55% have a retirement account', 720, 280, { size: 56, c: GREEN, alpha: ramp(t, S(36) + 0.2) }); }
  if (t > S(37)) { const k = pop(t, S(37) + 0.2, 0.4); popCard(ctx, 1560, 360, 460, 150, '#eee', 560, k, () => { text(ctx, '~45% have none', 0, 14, { size: 54, c: '#555' }); }); }
  if (t > S(38)) { const k = pop(t, S(38) + 0.3, 0.4); popCard(ctx, 1560, 640, 460, 200, LG, 570, k, () => { text(ctx, fmt(count(t, S(38) + 0.3, 1.6, 106000)), 0, 0, { size: 84, c: GREEN }); text(ctx, 'median, if they have one', 0, 60, { size: 32, c: '#555', weight: 'normal' }); }); }
  if (t > S(39)) { const k = pop(t, S(39) + 0.3, 0.4); popCard(ctx, 1560, 900, 520, 120, '#f6ecd2', 580, k, () => text(ctx, 'Any account = ahead of ~half', 0, 16, { size: 42, c: NAVY })); }
  if (t < S(36)) { text(ctx, '401(k)  ·  IRA  ·  anything', 960, 560, { size: 80, c: NAVY, alpha: ramp(t, S(35) + 0.3) }); piggy(ctx, 960, 720, 2.2, 590); }
}

// ---------------- 6. why behind (40-43) ----------------
function why(ctx, t) {
  header(ctx, 5, S(40), t);
  if (t < S(41)) { const f = fig(ctx, { x: 960, y: 520, s: 1.3, seed: 600, t, mood: 'worried', arms: [[-150, -200], [40, 20]], legs: [[-16, -10], [16, 10]] }); writeText(ctx, 'WHY DOES EVERYONE SEEM AHEAD?', 960, 920, S(40) + 0.3, t, { size: 70, dur: 0.8 }); return; }
  const cols = [[380, S(41), '1. Highlight reels'], [960, S(42), '2. Averages lie'], [1540, S(43), '3. Wrong comparison']];
  cols.forEach(([x, t0, title], i) => {
    if (t < t0) return; const k = pop(t, t0, 0.4);
    ctx.save(); ctx.translate(x, 560); ctx.scale(k, k); card(ctx, -260, -330, 520, 660, i === 0 ? '#FBF8F1' : i === 1 ? '#f6ecd2' : '#dde3e8', 610 + i);
    text(ctx, title, 0, -260, { size: 48, c: NAVY }); ctx.restore();
    if (k < 0.95) return;
    if (i === 0) { const flip = ss(clamp((t - at(41, 'not') + 0.2) / 0.5));
      const sc = Math.abs(1 - 2 * flip), back = flip > 0.5;
      ctx.save(); ctx.translate(x, 600); ctx.scale(sc, 1);
      card(ctx, -180, -150, 360, 300, back ? LR : LG, 620); text(ctx, back ? 'Car loan' : 'NEW CAR!', 0, back ? -10 : 10, { size: back ? 56 : 62, c: back ? RED : GREEN });
      if (back) text(ctx, '$48,000 owed', 0, 60, { size: 40, c: RED }); ctx.restore(); }
    if (i === 1) { text(ctx, '$1.24M', x, 520, { size: 80, c: GREY }); crossMark(ctx, x, 500, ramp(t, t0 + 0.5, 0.3), 2.2, 630); text(ctx, '$216K', x, 720, { size: 90, c: GREEN, alpha: ramp(t, t0 + 1.0) }); }
    if (i === 2) { strokePath(ctx, [[x - 220, 780], [x + 220, 780]], { w: 4, seed: 640 });
      const run = (t * 0.1) % 1;
      person(ctx, x - 160 + run * 40, 650, 0.45, 'worried', 641, t, { legs: walkLegs(t, 12) }); text(ctx, 'you, 25', x - 160, 840, { size: 30, c: '#555' });
      person(ctx, x + 140, 520, 0.45, 'smug', 642, t, { legs: walkLegs(t, 12) }); text(ctx, 'them, 45', x + 140, 700, { size: 30, c: '#555' });
      strokePath(ctx, [[x - 100, 600], [x + 80, 520]], { w: 4, c: GREY, seed: 643 }); text(ctx, '20 years ahead', x, 480, { size: 30, c: GREY, weight: 'normal' }); }
  });
}

// ---------------- 7. direction (44-53) ----------------
function fv(p0, pm, yrs) { const r = 0.07 / 12; let v = p0; const out = [v]; for (let m = 1; m <= yrs * 12; m++) { v = v * (1 + r) + pm; if (m % 12 === 0) out.push(v); } return out; }
const A25 = fv(5000, 300, 40), A40 = fv(50000, 0, 25);
function direction(ctx, t) {
  header(ctx, 6, S(44), t);
  if (t < S(46)) {
    const k = pop(t, S(45), 0.4);
    if (k > 0) { ctx.save(); ctx.translate(560, 580); ctx.scale(k, k);
      fillPoly(ctx, circlePts(0, 0, 30, 30, 16), RED, 700, 1); text(ctx, 'POSITION', 0, 100, { size: 50, c: RED }); ctx.restore();
      ctx.save(); ctx.translate(1360, 580); ctx.scale(k, k);
      const a = Math.sin(t * 1.5) * 0.08; ctx.rotate(-0.5 + a);
      strokePath(ctx, [[-150, 0], [150, 0]], { w: 10, c: GREEN, seed: 701 }); strokePath(ctx, [[110, -40], [150, 0], [110, 40]], { w: 10, c: GREEN, seed: 702 }); ctx.restore();
      text(ctx, 'DIRECTION', 1360, 760, { size: 60, c: GREEN, alpha: clamp(k) }); text(ctx, '<', 960, 600, { size: 140, c: INK, alpha: clamp(k) }); }
    if (t < S(45)) writeText(ctx, "WHAT NOBODY ONLINE TELLS YOU", 960, 560, S(44) + 0.2, t, { size: 72, dur: 0.8 });
    return;
  }
  if (t < S(47)) { // race chart
    const x0 = 260, y0 = 900, w = 1100, h = 600, max = 1000000, yrs = 40;
    strokePath(ctx, [[x0, y0 - h - 20], [x0, y0], [x0 + w + 20, y0]], { w: 5, seed: 710 });
    text(ctx, 'age', x0 + w, y0 + 60, { size: 36, c: '#666', weight: 'normal' });
    [25, 35, 45, 55, 65].forEach(a => text(ctx, String(a), x0 + (a - 25) / yrs * w, y0 + 45, { size: 32, c: '#777', weight: 'normal' }));
    const prog = ss(clamp((t - S(46) - 0.5) / 7));
    const P = (arr, startAge) => arr.map((v, i) => [x0 + (startAge - 25 + i) / yrs * w, y0 - Math.min(v, max) / max * h]);
    const pa = P(A25, 25), pb = P(A40, 40);
    strokePath(ctx, pa, { w: 8, c: GREEN, seed: 711, prog });
    const pbProg = clamp((prog * 40 - 15) / 25);
    if (pbProg > 0) strokePath(ctx, pb, { w: 8, c: RED, seed: 712, prog: pbProg });
    const ia = Math.min(pa.length - 1, Math.floor(prog * (pa.length - 1)));
    person(ctx, pa[ia][0], pa[ia][1] - 110, 0.4, 'grin', 713, t, { legs: walkLegs(t, 12), c: GREEN });
    if (pbProg > 0) { const ib = Math.min(pb.length - 1, Math.floor(pbProg * (pb.length - 1))); person(ctx, pb[ib][0], pb[ib][1] - 110, 0.4, 'neutral', 714, t, { c: RED }); }
    card(ctx, 1420, 260, 440, 260, '#FBF8F1', 715);
    text(ctx, 'Starts at 25 with $5K,', 1640, 320, { size: 32, c: GREEN }); text(ctx, 'adds $300/month', 1640, 362, { size: 32, c: GREEN });
    text(ctx, 'Starts at 40 with $50K,', 1640, 430, { size: 32, c: RED }); text(ctx, 'adds nothing', 1640, 472, { size: 32, c: RED });
    if (prog > 0.95) { text(ctx, '≈ ' + fmt(A25[40] / 1000) + 'K', pa[40][0] - 60, pa[40][1] - 30, { size: 40, c: GREEN }); text(ctx, '≈ ' + fmt(A40[25] / 1000) + 'K', pb[25][0] - 60, pb[25][1] - 30, { size: 40, c: RED }); }
    text(ctx, 'Illustration: 7% a year, not guaranteed', 960, 1030, { size: 32, c: GREY, weight: 'normal' });
    return;
  }
  if (t < S(52)) { // three questions
    writeText(ctx, 'ASK 3 BETTER QUESTIONS', 960, 250, S(47) + 0.1, t, { size: 72, c: NAVY, dur: 0.6 });
    const Q = [['Spend less than I earn?', 48], ['Have a small cushion?', 49], ['Investing every month?', 50]];
    Q.forEach(([q, si], i) => { if (t < S(si)) return; const k = pop(t, S(si), 0.35); const y = 420 + i * 170;
      ctx.save(); ctx.translate(900, y); ctx.scale(k, k); card(ctx, -520, -65, 1040, 130, '#FBF8F1', 720 + i);
      fillPoly(ctx, circlePts(-440, 0, 40, 40, 16), LG, 725 + i, 1); text(ctx, String(i + 1), -440, 16, { size: 50, c: GREEN });
      text(ctx, q, 40, 18, { size: 56, align: 'center' }); ctx.restore();
      if (t > S(51)) checkMark(ctx, 1490, y, ramp(t, S(51) + 0.2 + i * 0.3, 0.3), 2.2, 730 + i); });
    if (t > S(51)) { const f = fig(ctx, { x: 1690, y: 650, s: 0.9, seed: 740, t, mood: 'grin', arms: [[-150, -175], [40, 20]], legs: [[-14, -10], [14, 10]] }); }
    else fig(ctx, { x: 1690, y: 650, s: 0.9, seed: 740, t, mood: 'neutral', look: -1, arms: [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
    return;
  }
  // you vs you
  const k = pop(t, S(52) + 0.2, 0.4);
  if (k > 0) { ctx.save(); ctx.globalAlpha = clamp(k);
    person(ctx, 520, 520, 1.0, 'neutral', 750, t, { c: GREY }); text(ctx, 'YOU, A YEAR AGO', 520, 860, { size: 46, c: GREY });
    person(ctx, 1080, 470, 1.0, 'grin', 751, t); text(ctx, 'YOU, TODAY', 1080, 860, { size: 46, c: GREEN });
    strokePath(ctx, [[700, 600], [900, 540]], { w: 6, c: GREEN, seed: 752 }); strokePath(ctx, [[870, 515], [900, 540], [865, 565]], { w: 6, c: GREEN, seed: 753 }); ctx.restore(); }
  if (t > S(53)) { const x0 = 1340, y0 = 820; card(ctx, x0 - 20, y0 - 420, 520, 480, '#FBF8F1', 760); text(ctx, 'MY NET WORTH', x0 + 240, y0 - 360, { size: 40, c: NAVY });
    const pts = []; for (let m = 0; m <= 12; m++) pts.push([x0 + 30 + m * 36, y0 - 60 - m * 18 - Math.sin(m * 1.7) * 18]);
    strokePath(ctx, pts, { w: 6, c: GREEN, seed: 761, prog: ramp(t, S(53) + 0.5, 3) });
    text(ctx, '12 months', x0 + 240, y0 + 30, { size: 32, c: '#666', weight: 'normal' });
    if (t > at(53, 'going') ) stamp(ctx, 'GOING UP? THAT’S THE GAME', 960, 1000, pop(t, at(53, 'going'), 0.35), GREEN, 50, -0.03); }
}

// ---------------- 8. recap (54-61) ----------------
function recap(ctx, t) {
  header(ctx, 7, S(54), t);
  const R4 = [['Averages lie: median ≈ $216K', 55], ['Under 35 ≈ $33K · cash ≈ $8,200', 56], ['~Half carry card debt, ~half no retirement account', 57], ['Direction beats position', 58]];
  if (t < S(59)) { R4.forEach(([s, si], i) => { if (t < S(si)) return; const k = pop(t, S(si), 0.35); const y = 300 + i * 165;
      ctx.save(); ctx.translate(960, y); ctx.scale(k, k); card(ctx, -720, -60, 1440, 120, i === 3 ? LG : '#FBF8F1', 800 + i); text(ctx, s, 0, 18, { size: 50, c: i === 3 ? GREEN : INK }); ctx.restore();
      checkMark(ctx, 1760, y, ramp(t, S(si) + 0.4, 0.3), 1.8, 810 + i); }); return; }
  // next video card
  const k = pop(t, S(59), 0.4);
  popCard(ctx, 760, 520, 760, 430, '#FBF8F1', 820, k, () => {
    box(ctx, -340, -180, 680, 300, { fill: '#f6ecd2', lw: 4, seed: 821 }); text(ctx, '$0', -150, 20, { size: 160, c: RED }); text(ctx, 'START HERE', 140, -10, { size: 56 }); text(ctx, 'IN 2026', 140, 60, { size: 60, c: GREEN });
    fillPoly(ctx, [[-30, 150], [-30, 200], [20, 175]], RED, 822, 1); text(ctx, 'Watch next', 130, 190, { size: 40, c: NAVY }); });
  const f = fig(ctx, { x: 1450, y: 560, s: 1.1, seed: 830, t, mood: 'grin', look: -1, arms: t > S(61) ? [[-25, -10], [150 + Math.sin(t * 8) * 20, 170]] : [[-120, -100], [25, 10]], legs: [[-14, -10], [14, 10]] });
  if (t > S(60)) text(ctx, 'Source: Federal Reserve, 2025 Survey of Consumer Finances · Education, not financial advice', 960, 1010, { size: 30, c: GREY, weight: 'normal', alpha: ramp(t, S(60)) });
}

const CH = [[0, hook], [S(4), trap], [S(15), ages], [S(26), cash], [S(30), debt], [S(35), retire], [S(40), why], [S(44), direction], [S(54), recap]];
const SCENES = CH.map(([t0, fn], i) => [i ? t0 - 0.2 : 0, fn]);
if (process.argv.includes('--chapters')) { const lab = ['Intro', ...CHAPS]; CH.forEach(([t0], i) => { const s = Math.max(0, Math.floor(t0 - 0.2)); console.log(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} ${lab[i]}`); }); process.exit(0); }

function drawFrame(ctx, t) {
  paper(ctx);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  const [t0, fn] = SCENES[idx]; const k = idx ? ss((t - t0) / 0.25) : 1;
  ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * 60, 0); fn(ctx, t); ctx.restore();
  if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
}

const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : DIR + 'picture.mp4';
const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
if (process.argv.includes('--stills')) {
  for (const t of process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${DIR}st-${String(t.toFixed(1)).padStart(6, '0')}.png`, canvas.toBuffer('image/png')); }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
}
