// US Day 1 Short: "7 steps from $0, in order" (9:16) — climbing staircase with camera follow
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createCanvas } = require('@napi-rs/canvas');
const R = await import('../../lib/draw.mjs');
const { fig, text, paper, strokePath, circlePts, box, coinStack, writeText, ramp, pop, ss, lerp, clamp, card, checkMark, crossMark, marks, sweat, line } = R;

const DIR = new URL('./', import.meta.url).pathname;
const W = 1080, H = 1920, FPS = 30, LEAD = 0.3;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6';
const SEG = JSON.parse(fs.readFileSync(DIR + 'segments.json')).map(s => ({ ...s, start: s.start + LEAD, end: s.end + LEAD }));
const WORDS = JSON.parse(fs.readFileSync(DIR + 'words.json')).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = SEG[SEG.length - 1].end + 1.6;
const S = i => SEG[i].start;
const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && o.text.toLowerCase().startsWith(w.toLowerCase())); return x ? x.start : SEG[i].start; };

// world: 7 platforms going up, alternating sides
const STEP_H = 440, BASE = 1380;
const PX = i => (i === 0 ? 360 : i % 2 ? 300 : 440);              // platform centre x (step 0 = ground)
const PY = i => BASE - i * STEP_H;                 // platform top y (world)
const LABELS = [null,
  ['FIND YOUR', 'NUMBER'], ['EMERGENCY', 'FUND'], ['KILL CARD', 'DEBT'], ['401(k)', 'MATCH'],
  ['ROTH', 'IRA'], ['INDEX', 'FUND'], ['AUTOMATE', 'IT']];

// which platform the figure is on / jumping to at time t
function climb(t) {
  let from = 0, to = 0, k = 1;
  for (let i = 1; i <= 7; i++) { const t0 = S(i) + 0.05; if (t >= t0) { from = i - 1; to = i; k = clamp((t - t0) / 0.55); } }
  return { from, to, k };
}
function figPos(t) {
  const { from, to, k } = climb(t);
  const e = ss(k);
  const x = lerp(PX(from) - (from ? 0 : 0), PX(to), e);
  const y = lerp(PY(from), PY(to), e) - Math.sin(Math.PI * k) * 140;
  return { x, y, k, to };
}
function camY(t) {
  const { from, to, k } = climb(t);
  let target = lerp(PY(from), PY(to), ss(clamp(k * 1.2)));
  if (t > S(8)) target = lerp(PY(7), PY(7) - 60, ss((t - S(8)) / 1));
  return target - 1150; // world y shown at screen y=1150
}

function icon(ctx, i, x, y, t, t0) {
  const k = pop(t, t0, 0.35); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (i === 1) { card(ctx, -70, -85, 140, 170, '#fff', 201); [-40, -10, 20].forEach((yy, j) => line(ctx, -45, yy, 45, yy, { w: 4, seed: 202 + j, c: GREY })); text(ctx, '$?', 0, 70, { size: 44, c: GREEN }); }
  if (i === 2) { strokePath(ctx, [[-60, -60], [-60, 60], [60, 60], [60, -60]], { w: 5, seed: 211 }); coinStack(ctx, 0, 45, 4, 1.2, 212); }
  if (i === 3) { card(ctx, -90, -55, 180, 110, '#dde6f3', 221); line(ctx, -90, -20, 90, -20, { w: 10, c: INK, seed: 222 }); text(ctx, '21%', 0, 35, { size: 46, c: RED }); if (t > t0 + 0.6) crossMark(ctx, 0, 0, ramp(t, t0 + 0.6, 0.3), 2.2, 223); }
  if (i === 4) { box(ctx, -60, -40, 120, 100, { fill: '#d9ecdd', lw: 4, seed: 231 }); line(ctx, 0, -40, 0, 60, { w: 5, seed: 232, c: GREEN }); text(ctx, 'FREE', 0, -70, { size: 46, c: GREEN }); }
  if (i === 5) { card(ctx, -80, -60, 160, 120, '#fff8de', 241); text(ctx, 'ROTH', 0, -5, { size: 44, c: NAVY }); text(ctx, 'tax-free', 0, 40, { size: 30, c: GREY, weight: 'normal' }); }
  if (i === 6) { strokePath(ctx, [[-70, 50], [-70, -60]], { w: 4, seed: 251 }); strokePath(ctx, [[-70, 50], [80, 50]], { w: 4, seed: 252 });
    const p = []; for (let j = 0; j <= 20; j++) { const u = j / 20; p.push([-60 + u * 130, 40 - u * 85 + Math.sin(u * 14) * 10]); } strokePath(ctx, p, { w: 6, c: GREEN, seed: 253, prog: ramp(t, t0 + 0.2, 0.8) }); }
  if (i === 7) { strokePath(ctx, circlePts(0, 0, 60), { w: 5, seed: 261 }); const a = (t - t0) * 4; line(ctx, 0, 0, Math.sin(a) * 45, -Math.cos(a) * 45, { w: 5, seed: 262, c: GREEN }); line(ctx, 0, 0, 0, -30, { w: 5, seed: 263 }); }
  ctx.restore();
}

function world(ctx, t) {
  // platforms
  for (let i = 0; i <= 7; i++) {
    const x = PX(i), y = PY(i), w = i ? 260 : 1000;
    const cur = climb(t).to; ctx.save(); ctx.globalAlpha = i > cur + 1 ? 0.25 : i < cur ? 0.4 : 1;
    strokePath(ctx, [[x - w / 2, y], [x + w / 2, y]], { w: 7, seed: 300 + i });
    if (i) strokePath(ctx, [[x - w / 2 + 10, y], [x - w / 2 + 10, y + 26], [x + w / 2 - 10, y + 26], [x + w / 2 - 10, y]], { w: 3, seed: 310 + i, c: GREY });
    if (!i) { ctx.restore(); continue; }
    const reached = t >= S(i);
    // number badge
    const bx = x - 175, by = y + 10;
    ctx.save(); ctx.fillStyle = reached ? '#d9ecdd' : '#f1f1f1'; ctx.beginPath(); ctx.arc(bx, by, 34, 0, 7); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(bx, by, 34), { w: 4, seed: 320 + i, c: reached ? GREEN : GREY });
    text(ctx, String(i), bx, by + 14, { size: 44, c: reached ? GREEN : GREY });
    // label + icon on the other side
    const side = 1, lx = 790;
    if (t >= S(i) - 0.05) {
      const [a, b] = LABELS[i];
      const k = pop(t, S(i) + 0.2, 0.35);
      ctx.save(); ctx.translate(lx, y - 255); ctx.rotate(side * -0.03); ctx.scale(k, k);
      text(ctx, a, 0, 0, { size: 58, c: NAVY }); text(ctx, b, 0, 66, { size: 66, c: GREEN }); ctx.restore();
      icon(ctx, i, lx, y - 75, t, S(i) + 0.45);
    }
    ctx.restore();
  }
  // top flag + coins
  const fx = PX(7) + 90, fy = PY(7);
  strokePath(ctx, [[fx, fy], [fx, fy - 170]], { w: 5, seed: 401 });
  strokePath(ctx, [[fx, fy - 170], [fx + 90, fy - 145], [fx, fy - 120]], { w: 5, seed: 402, c: GREEN, close: true });
  if (t > S(7) + 0.6) for (let j = 0; j < 3; j++) coinStack(ctx, PX(7) - 150 + j * 42, fy - 8, Math.min(8, Math.floor((t - S(7) - 0.6) * 6) - j * 2), 0.9, 410 + j);
  // figure
  const p = figPos(t);
  const airborne = p.k < 1 && p.to > 0;
  const mood = t > S(8) ? (t > at(8, 'full') ? 'grin' : 'worried') : t < S(1) ? 'worried' : airborne ? 'shock' : 'happy';
  const f = fig(ctx, { x: p.x, y: p.y - 135, s: 0.95, seed: 500, t, mood, tilt: airborne ? (p.to % 2 ? -10 : 10) : 0,
    arms: airborne ? [[-150, -170], [150, 170]] : t > at(8, 'full') ? [[-150, -175], [40, 20]] : [[-25, -10], [25, 10]],
    legs: airborne ? [[-40, -20], [40, 20]] : [[-14, -10], [14, 10]] });
  if (t < S(1)) marks(ctx, f.head[0] + 40, f.head[1] - 30, 0.8, 501);
}

function overlay(ctx, t) {
  if (t < S(1) + 0.3) { // hook
    const a = 1 - ramp(t, S(1), 0.3);
    ctx.save(); ctx.globalAlpha = a;
    const k = pop(t, 0.05, 0.35);
    text(ctx, '$0', 540, 330, { size: 220, c: RED, alpha: clamp(k * 2), scale: lerp(0.6, 1, k) });
    writeText(ctx, '7 STEPS', 540, 470, at(0, 'These'), t, { size: 110, dur: 0.35 });
    writeText(ctx, 'IN THIS ORDER', 540, 580, at(0, 'order') - 0.25, t, { size: 84, c: GREEN, dur: 0.35 });
    ctx.restore();
  }
  if (t > S(8)) { // ending
    const k = pop(t, S(8), 0.35);
    ctx.save(); ctx.translate(540, 240); ctx.rotate(-0.04); ctx.scale(k, k);
    strokePath(ctx, [[-380, -70], [380, -70], [380, 50], [-380, 50]], { w: 7, c: RED, seed: 601, close: true });
    text(ctx, 'SKIP A STEP = IT BREAKS', 0, 20, { size: 64, c: RED }); ctx.restore();
    const k2 = pop(t, at(8, 'full'), 0.4);
    if (k2 > 0) { ctx.save(); ctx.translate(540, 1420); ctx.scale(k2, k2);
      card(ctx, -420, -70, 840, 130, '#d9ecdd', 602); text(ctx, 'Full guide on the channel', 0, 20, { size: 62, c: GREEN }); ctx.restore(); }
  }
}

const CUES = (() => { const cues = []; let cur = [];
  const flush = () => { if (cur.length) { cues.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map(w => w.text).join(' ') }); cur = []; } };
  for (const w of WORDS) { cur.push(w); const tt = cur.map(x => x.text).join(' '); if (/[.?!:,]$/.test(w.text) || tt.length > 22) flush(); }
  flush(); cues.forEach((c, i) => { const nx = cues[i + 1]; c.end = Math.min(nx ? nx.start - 0.02 : c.end + 0.8, c.end + 0.6); }); return cues; })();

function drawFrame(ctx, t) {
  paper(ctx);
  const cy = camY(t);
  ctx.save(); ctx.translate(0, -cy); world(ctx, t); ctx.restore();
  // fade bottom so captions read clean
  const g = ctx.createLinearGradient(0, 1480, 0, 1640); g.addColorStop(0, 'rgba(253,253,252,0)'); g.addColorStop(0.4, 'rgba(253,253,252,0.92)'); g.addColorStop(1, 'rgba(253,253,252,0.92)');
  ctx.fillStyle = g; ctx.fillRect(0, 1480, W, 440);
  overlay(ctx, t);
  if (t > SEG[8].end + 0.3) text(ctx, 'Educational only. Not financial advice.', 540, 1500, { size: 38, c: GREY, weight: 'normal', alpha: ramp(t, SEG[8].end + 0.3, 0.3) });
  const c = CUES.find(c => t >= c.start - 0.05 && t <= c.end);
  if (c) text(ctx, c.text, 540, 1580, { size: 74, c: '#2b2b2b', weight: 'bold' });
}

const out = process.argv[2] || DIR + 'picture.mp4';
const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
if (process.argv.includes('--stills')) {
  for (const t of process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${DIR}st-${t.toFixed(2)}.png`, canvas.toBuffer('image/png')); }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
}
