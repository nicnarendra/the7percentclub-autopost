// B2 "Colorful Hand-Drawn" test: US Day 2 Short "You're not behind" (9:16)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const R = await import('../../lib/draw.mjs');
const { fig, strokePath, circlePts, fillPoly, ramp, pop, ss, lerp, clamp, line } = R;
GlobalFonts.registerFromPath(new URL('../../assets/fonts/NotoSans.ttf', import.meta.url).pathname, 'Sans');

const DIR = new URL('./', import.meta.url).pathname;
const W = 1080, H = 1920, FPS = 30, LEAD = 0.3;
// B2 palette: warm paper, fine ink, muted colored props
const PAPER = '#F3EFE6', INK = '#3a3a37', TERRA = '#b86f52', SAGE = '#9fb39a', MUST = '#d9b45f', DUSTY = '#7f9bb3', TAN = '#d8c4a0', IVORY = '#FBF8F1', ROSE = '#e3a89a', GREY = '#a9a59b';
const SEG = JSON.parse(fs.readFileSync(DIR + 'segments.json')).map(s => ({ ...s, start: s.start + LEAD, end: s.end + LEAD }));
const WORDS = JSON.parse(fs.readFileSync(DIR + 'words.json')).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = SEG[SEG.length - 1].end + 1.6;
const S = i => SEG[i].start;
const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && o.text.toLowerCase().replace(/[^a-z0-9$-]/g, '').startsWith(w.toLowerCase())); return x ? x.start : SEG[i].start; };

const ink = (ctx, pts, o = {}) => strokePath(ctx, pts, { w: o.w || 3.2, c: o.c || INK, seed: o.seed || 1, amp: o.amp ?? 0.7, close: o.close, prog: o.prog ?? 1 });
function shape(ctx, pts, fill, seed, o = {}) { fillPoly(ctx, pts, fill, seed, 0.6); ink(ctx, pts, { seed: seed + 1, close: true, w: o.w }); }
function rect(ctx, x, y, w, h, fill, seed, o) { shape(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, seed, o); }
function circ(ctx, x, y, r, fill, seed) { fillPoly(ctx, circlePts(x, y, r, r, 26), fill, seed, 0.4); ink(ctx, circlePts(x, y, r, r, 26), { seed: seed + 1, close: true }); }
function hand(ctx, s, x, y, o = {}) { // handwritten heading (thin)
  const a = o.alpha ?? 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.scale || 1, o.scale || 1);
  ctx.font = `normal ${o.size || 110}px Hand`; ctx.fillStyle = o.c || INK; ctx.textAlign = o.align || 'center'; ctx.fillText(s, 0, 0); ctx.restore(); }
function sans(ctx, s, x, y, o = {}) { const a = o.alpha ?? 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(o.scale || 1, o.scale || 1);
  ctx.font = `${o.weight || 600} ${o.size || 54}px Sans`; ctx.fillStyle = o.c || INK; ctx.textAlign = o.align || 'center'; ctx.fillText(s, 0, 0); ctx.restore(); }
function heading(ctx, a, b, t0, t, y = 250) { // two-tone heading, writes on
  const k1 = ramp(t, t0, 0.35), k2 = ramp(t, t0 + 0.3, 0.35);
  hand(ctx, a, 540, y, { size: 118, alpha: k1 }); if (b) hand(ctx, b, 540, y + 120, { size: 132, c: TERRA, alpha: k2 });
}
function person(ctx, x, y, s, shirt, mood, seed, t, o = {}) {
  const f = fig(ctx, { x, y, s, c: INK, lw: 3.4, mood, seed, t, hair: false, headFill: IVORY, arms: o.arms || [[-22, -10], [22, 10]], legs: o.legs || [[-12, -8], [12, 8]], tilt: o.tilt || 0, look: o.look || 0 });
  if (shirt) { const [sx, sy] = f.sh; fillPoly(ctx, [[sx - 24 * s, sy + 4 * s], [sx + 24 * s, sy + 4 * s], [x + 20 * s, y], [x - 20 * s, y]], shirt, seed + 90, 0.5); ink(ctx, [[sx - 24 * s, sy + 4 * s], [sx + 24 * s, sy + 4 * s], [x + 20 * s, y], [x - 20 * s, y]], { seed: seed + 91, close: true, w: 2.6 }); }
  return f;
}
function desk(ctx, y = 1180) { ctx.fillStyle = TAN; ctx.fillRect(0, y, W, H - y); ink(ctx, [[0, y], [W, y]], { seed: 9, w: 3 });
  for (let i = 1; i < 9; i++) ink(ctx, [[0, y + i * 70], [W, y + i * 70 + 6]], { seed: 10 + i, w: 1.4, c: 'rgba(90,70,40,.25)' }); }
const walk = (t, a = 20) => [[-a * Math.sin(t * 9) - 4, -8], [a * Math.sin(t * 9) + 4, 8]];
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

// --- scenes ---
const POSTS = [['NEW CAR!', MUST], ['MY YACHT', DUSTY], ['RETIRED AT 30', SAGE], ['DREAM HOUSE', ROSE]];
function hook(ctx, t) {
  desk(ctx, 1240);
  heading(ctx, 'EVERYONE ONLINE', 'SEEMS RICH', 0.05, t);
  // phone with scrolling posts
  const px = 560, py = 760, pw = 380, ph = 660;
  ctx.save(); ctx.translate(px, py); ctx.rotate(-0.06);
  rect(ctx, -pw / 2, -ph / 2, pw, ph, '#4a4f49', 30);
  ctx.save(); ctx.beginPath(); ctx.rect(-pw / 2 + 20, -ph / 2 + 30, pw - 40, ph - 70); ctx.clip();
  ctx.fillStyle = '#e4e1d8'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  const off = (t * 140) % 200;
  for (let i = 0; i < 6; i++) { const [s, c] = POSTS[i % 4]; const y = -ph / 2 + 40 + i * 200 - off;
    rect(ctx, -pw / 2 + 36, y, pw - 72, 170, c, 40 + i); sans(ctx, s, 0, y + 100, { size: 36, c: IVORY }); circ(ctx, pw / 2 - 70, y + 140, 12, TERRA, 50 + i); }
  ctx.restore(); ctx.restore();
  // coffee + slumped viewer
  rect(ctx, 150, 1160, 110, 90, IVORY, 60); ink(ctx, [[260, 1180], [295, 1195], [260, 1225]], { seed: 62 });
  for (let i = 0; i < 2; i++) ink(ctx, [[185 + i * 40, 1140 - Math.sin(t * 3 + i) * 6], [195 + i * 40, 1110], [185 + i * 40, 1080 + Math.sin(t * 3 + i) * 6]], { seed: 63 + i, w: 2.2, c: GREY });
  const doubt = t > at(0, 'So');
  const f = person(ctx, 880, 1070, 0.95, DUSTY, doubt ? 'worried' : 'neutral', 70, t, { look: -1, tilt: doubt ? -8 : 0, arms: doubt ? [[-40, -150], [20, 10]] : [[-22, -10], [22, 10]] });
  if (doubt) hand(ctx, '?', f.head[0] + 60, f.head[1] - 60, { size: 110, c: TERRA, alpha: ramp(t, at(0, 'So'), 0.3), scale: lerp(0.6, 1, pop(t, at(0, 'So'), 0.35)) });
}

function average(ctx, t) { // seg 1-2: average line pulled up by billionaire
  heading(ctx, 'THE AVERAGE', '', S(1), t, 230);
  const base = 1250; desk(ctx, base);
  const hs = [96, 144, 72, 120, 168, 112, 136, 88];
  hs.forEach((h, i) => { const x = 120 + i * 82; const g = ss((t - S(1) - i * 0.08) / 0.5); if (g <= 0) return;
    rect(ctx, x, base - h * g, 60, h * g, [SAGE, DUSTY, MUST, ROSE][i % 4], 100 + i); });
  // billionaire bar shoots up
  const bk = ss(clamp((t - at(2, 'billionaires') + 0.2) / 1.0)); const bh = lerp(0, 640, bk);
  if (bk > 0) { rect(ctx, 820, base - bh, 120, bh, TERRA, 120); hand(ctx, '$1B+', 880, base - bh - 30, { size: 70, c: TERRA }); }
  // average dashed line
  const avg = lerp(140, 140 + 390 * bk, 1); const y = base - avg;
  ctx.save(); ctx.setLineDash([22, 16]); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(990, y); ctx.stroke(); ctx.restore();
  const k = pop(t, S(1) + 0.4, 0.4);
  if (k > 0) { ctx.save(); ctx.translate(300, y - 80); ctx.scale(k, k); rect(ctx, -200, -60, 400, 100, IVORY, 130); sans(ctx, t > at(2, 'billionaires') ? 'average, now' : 'average', 0, 8, { size: 44 });
    ctx.restore(); }
  if (t < S(2)) { hand(ctx, '$1.24 MILLION?', 540, 400, { size: 120, c: TERRA, alpha: ramp(t, at(1, 'one'), 0.3) }); }
  else { const kk = pop(t, S(2), 0.35); ctx.save(); ctx.translate(540, 400); ctx.rotate(-0.05); ctx.scale(kk, kk); hand(ctx, 'AVERAGES LIE', 0, 0, { size: 120, c: TERRA }); ctx.restore(); }
  // billionaire figure dragging the line
  if (bk > 0.2) { const f = person(ctx, 720, y - 10, 0.75, '#2f2f2f', 'smug', 140, t, { arms: [[-25, -10], [120, 160]] });
    const [hx, hy] = f.head; fillPoly(ctx, [[hx - 26, hy - 30], [hx + 26, hy - 30], [hx + 22, hy - 78], [hx - 22, hy - 78]], '#2f2f2f', 141, 0.4); line(ctx, hx - 42, hy - 30, hx + 42, hy - 30, { w: 5, seed: 142 }); }
}

const SHIRTS = [SAGE, DUSTY, MUST, ROSE, TERRA, SAGE, DUSTY, MUST, ROSE];
function median(ctx, t) { // seg 3-4
  desk(ctx, 1250);
  if (t < S(4)) {
    heading(ctx, 'THE ONE IN', 'THE MIDDLE', S(3), t, 230);
    for (let i = 0; i < 9; i++) { const x = 100 + i * 110; const enter = clamp((t - S(3) - i * 0.07) / 0.5);
      const mid = i === 4, lift = mid ? ss((t - at(3, 'worth') + 0.3) / 0.5) : 0;
      person(ctx, lerp(-80, x, ss(enter)), 1140 - (i - 4) * 0 - lift * 40, 0.7, SHIRTS[i], mid && lift > 0 ? 'grin' : 'neutral', 200 + i, t, { legs: enter < 1 ? walk(t) : undefined, arms: mid && lift > 0 ? [[-160, -175], [22, 10]] : undefined });
      if (mid) strokePath(ctx, circlePts(x, 1080, 85, 150, 24), { w: 5, c: TERRA, seed: 220, prog: ramp(t, at(3, 'middle') - 0.2, 0.6) }); }
    const k = pop(t, at(3, 'worth'), 0.4);
    if (k > 0) { ctx.save(); ctx.translate(540, 700); ctx.scale(k, k); rect(ctx, -260, -90, 520, 170, IVORY, 230); sans(ctx, '$216,000', 0, 30, { size: 92, c: TERRA, weight: 700 }); ctx.restore();
      ink(ctx, [[540, 790], [540, 930]], { seed: 231, w: 3 }); }
    hand(ctx, 'median family net worth', 540, 560, { size: 60, c: INK, alpha: ramp(t, at(3, 'worth') + 0.3) });
  } else { // under 35: small plant that grows
    heading(ctx, 'UNDER 35?', '', S(4), t, 260);
    const g = ss((t - S(4) - 0.3) / 2.5);
    rect(ctx, 460, 1060, 160, 140, TERRA, 300);
    const top = 1060 - 120 - g * 200; ink(ctx, [[540, 1060], [540, top]], { seed: 301, w: 5, c: '#5d7a55' });
    for (let i = 0; i < 4; i++) { const ly = 1040 - i * 70 - g * 40 * i; if (ly < top) continue; const sd = i % 2 ? 1 : -1;
      fillPoly(ctx, [[540, ly], [540 + sd * 70, ly - 30], [540 + sd * 100, ly - 10], [540 + sd * 60, ly + 10]], SAGE, 310 + i, 0.5); ink(ctx, [[540, ly], [540 + sd * 70, ly - 30], [540 + sd * 100, ly - 10], [540 + sd * 60, ly + 10]], { seed: 320 + i, close: true, w: 2.4 }); }
    const k = pop(t, at(4, 'about'), 0.4);
    if (k > 0) { ctx.save(); ctx.translate(540, 520); ctx.scale(k, k); rect(ctx, -240, -80, 480, 150, IVORY, 330); sans(ctx, '$33,000', 0, 26, { size: 88, c: TERRA, weight: 700 }); ctx.restore(); }
    person(ctx, 820, 1100, 0.85, MUST, 'happy', 340, t, { look: -1, arms: [[-120, -60], [22, 10]] });
    hand(ctx, 'the start of the curve', 540, 700, { size: 58, alpha: ramp(t, at(4, 'about') + 0.6) });
  }
}

function cash(ctx, t) { // seg 5
  desk(ctx, 1250);
  heading(ctx, 'CHECKING +', 'SAVINGS', S(5), t, 230);
  // piggy bank
  const px = 540, py = 1000; ctx.save(); ctx.fillStyle = ROSE; ctx.beginPath(); ctx.ellipse(px, py, 230, 165, 0, 0, 7); ctx.fill(); ctx.restore();
  ink(ctx, circlePts(px, py, 230, 165, 30), { seed: 400, close: true });
  circ(ctx, px + 220, py - 20, 48, ROSE, 402); circ(ctx, px + 232, py - 22, 8, INK, 404);
  [-130, -40, 60, 140].forEach((dx, i) => rect(ctx, px + dx - 22, py + 140, 44, 80, ROSE, 410 + i));
  line(ctx, px - 50, py - 160, px + 50, py - 160, { w: 8, seed: 420 });
  // coins drop
  const n = Math.floor(clamp((t - S(5)) / 3.5) * 8);
  for (let i = 0; i < 8; i++) { const t0 = S(5) + i * 0.45; const k = clamp((t - t0) / 0.45); if (k <= 0 || k >= 1) continue;
    circ(ctx, px, lerp(760, py - 170, ss(k)), 30, MUST, 430 + i); }
  const v = 8200 * ss(clamp((t - S(5) - 0.3) / 3.2));
  sans(ctx, fmt(v), 540, 620, { size: 110, c: TERRA, weight: 700, alpha: ramp(t, S(5) + 0.2) });
  hand(ctx, 'typical family, 2025', 540, 700, { size: 56, alpha: ramp(t, S(5) + 0.6) });
}

function direction(ctx, t) { // seg 6
  heading(ctx, 'DIRECTION', 'BEATS POSITION', S(6), t, 230);
  // winding uphill path with walker
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([140 + u * 800 + Math.sin(u * 7) * 60, 1300 - u * 620]); }
  ctx.save(); ctx.fillStyle = SAGE; ctx.beginPath(); ctx.moveTo(0, H); pts.forEach(([x, y]) => ctx.lineTo(x + 40, y + 120)); ctx.lineTo(W, 560); ctx.lineTo(W, H); ctx.fill(); ctx.restore();
  ink(ctx, pts.map(([x, y]) => [x, y + 40]), { seed: 500, w: 18, c: TAN }); ink(ctx, pts.map(([x, y]) => [x, y + 40]), { seed: 501, w: 3, c: '#b9a47e' });
  const u = ss(clamp((t - S(6) - 0.3) / 4.8)); const i = Math.min(40, Math.floor(u * 40)); const [wx, wy] = pts[i];
  person(ctx, wx, wy - 40, 0.7, DUSTY, 'happy', 510, t, { legs: walk(t, 18), tilt: -6 });
  // flag at top
  ink(ctx, [[930, 690], [930, 520]], { seed: 520, w: 4 }); shape(ctx, [[930, 520], [1030, 550], [930, 580]], TERRA, 521);
  hand(ctx, 'you vs. you, last year', 540, 520 + 0, { size: 56, alpha: ramp(t, at(6, 'direction')) });
}

function ending(ctx, t) { // seg 7
  desk(ctx, 1250);
  const k = pop(t, S(7), 0.4);
  ctx.save(); ctx.translate(480, 760); ctx.scale(k * 0.9, k * 0.9); ctx.rotate(-0.03);
  rect(ctx, -380, -300, 760, 520, '#4a4f49', 600); rect(ctx, -350, -270, 700, 420, IVORY, 602);
  hand(ctx, "YOU'RE NOT", 0, -120, { size: 96 }); hand(ctx, 'BEHIND', 0, 0, { size: 120, c: TERRA });
  shape(ctx, [[-30, 50], [-30, 120], [40, 85]], TERRA, 604); ctx.restore();
  hand(ctx, 'full breakdown by age', 540, 300, { size: 76, alpha: ramp(t, S(7) + 0.3) });
  person(ctx, 950, 1150, 0.8, MUST, 'grin', 610, t, { look: -1, arms: [[-25, -10], [150 + Math.sin(t * 7) * 15, 170]] });
}

const SCENES = [[0, hook], [S(1) - 0.15, average], [S(3) - 0.15, median], [S(5) - 0.15, cash], [S(6) - 0.15, direction], [S(7) - 0.15, ending]];
const CUES = (() => { const cues = []; let cur = [];
  const flush = () => { if (cur.length) { cues.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map(w => w.text).join(' ') }); cur = []; } };
  for (const w of WORDS) { cur.push(w); const tt = cur.map(x => x.text).join(' '); if (/[.?!:,]$/.test(w.text) || tt.length > 24) flush(); }
  flush(); cues.forEach((c, i) => { const nx = cues[i + 1]; c.end = Math.min(nx ? nx.start - 0.02 : c.end + 0.8, c.end + 0.6); }); return cues; })();

function drawFrame(ctx, t) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  const [t0, fn] = SCENES[idx]; const k = idx ? ss((t - t0) / 0.22) : 1;
  ctx.save(); ctx.globalAlpha = k; fn(ctx, t); ctx.restore();
  if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
  if (t > SEG[7].end + 0.2) sans(ctx, 'Fed Survey of Consumer Finances 2025 · Not financial advice', 540, 1440, { size: 28, c: '#6b665c', weight: 500, alpha: ramp(t, SEG[7].end + 0.2) });
  const c = CUES.find(c => t >= c.start - 0.05 && t <= c.end);
  if (c) { ctx.font = '600 58px Sans'; const w = ctx.measureText(c.text).width + 60, y = 1560;
    ctx.save(); ctx.fillStyle = IVORY; ctx.shadowColor = 'rgba(0,0,0,.08)'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.roundRect(540 - w / 2, y - 62, w, 92, 16); ctx.fill(); ctx.restore();
    sans(ctx, c.text, 540, y, { size: 58, c: '#2f2d29' }); }
}

const out = DIR + 'picture.mp4';
const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
if (process.argv.includes('--stills')) {
  for (const t of process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${DIR}st-${t.toFixed(2)}.png`, canvas.toBuffer('image/png')); }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
}
