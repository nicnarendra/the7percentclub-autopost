// B1 "Minimal Line Art" native 9:16 renderer for: "9 out of 10 traders lose money"
// Usage: node render.mjs <out.mp4> [startSec] [endSec] [--frames dir]
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire('/home/claude/repo/stickman-video-director/skills/directing-stickman-videos/package.json');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const FONTS = '/home/claude/repo/stickman-video-director/skills/directing-stickman-videos/assets/fonts/';
GlobalFonts.registerFromPath(FONTS + 'Caveat.ttf', 'Hand');

const W = 1080, H = 1920, FPS = 30, LEAD = 0.3;
const words = JSON.parse(fs.readFileSync(new URL('./words.json', import.meta.url))).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = words[words.length - 1].end + 1.6;

// ---------- palette ----------
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', YEL = '#f3d35b', NAVY = '#27406b', PAPER = '#FDFDFC', GREY = '#9aa0a6';

// ---------- easing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, d = 0.35) => ss((t - a) / d);
const back = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const pop = (t, a, d = 0.35) => back((t - a) / d);
const lerp = (a, b, k) => a + (b - a) * k;
const wt = i => words[i].start; // word time

// ---------- seeded jitter (stable lines, slight hand wobble) ----------
function hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function wob(seed, i, amp) { return (hash(seed * 31.7 + i * 7.3) - 0.5) * 2 * amp; }

function strokePath(ctx, pts, { w = 5, c = INK, seed = 1, amp = 1.2, prog = 1, close = false } = {}) {
  // densify, jitter perpendicular, draw up to prog
  const dense = [];
  const P = close ? [...pts, pts[0]] : pts;
  for (let i = 0; i < P.length - 1; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1];
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / 14));
    for (let k = 0; k < n; k++) dense.push([lerp(x1, x2, k / n), lerp(y1, y2, k / n)]);
  }
  dense.push(P[P.length - 1]);
  const cnt = Math.max(2, Math.ceil(dense.length * clamp(prog)));
  if (prog <= 0) return;
  ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < cnt; i++) {
    const [x, y] = dense[i];
    const jx = i === 0 || i === dense.length - 1 ? 0 : wob(seed, i, amp), jy = i === 0 || i === dense.length - 1 ? 0 : wob(seed + 9, i, amp);
    i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x, y);
  }
  ctx.stroke(); ctx.restore();
}
const line = (ctx, x1, y1, x2, y2, o) => strokePath(ctx, [[x1, y1], [x2, y2]], o);
function circlePts(cx, cy, rx, ry = rx, n = 40, start = -Math.PI / 2) {
  const p = []; for (let i = 0; i <= n; i++) { const a = start + i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p;
}
function fillPoly(ctx, pts, c, seed = 3, amp = 1) {
  ctx.save(); ctx.fillStyle = c; ctx.beginPath();
  pts.forEach(([x, y], i) => { const jx = wob(seed, i, amp), jy = wob(seed + 5, i, amp); i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy); });
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function box(ctx, x, y, w, h, { fill = null, c = INK, lw = 4, seed = 5, prog = 1 } = {}) {
  if (fill) fillPoly(ctx, rectPts(x, y, w, h), fill, seed, 1.5);
  strokePath(ctx, rectPts(x, y, w, h), { w: lw, c, seed, close: true, prog });
}

// ---------- text ----------
function text(ctx, s, x, y, { size = 80, c = INK, align = 'center', weight = 'bold', alpha = 1, scale = 1, rot = 0 } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = `${weight} ${size}px Hand`; ctx.fillStyle = c; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, 0, 0); ctx.restore();
}
function textWidth(ctx, s, size, weight = 'bold') { ctx.font = `${weight} ${size}px Hand`; return ctx.measureText(s).width; }
// handwritten reveal: clip text left->right
function writeText(ctx, s, x, y, t0, t, o = {}) {
  const size = o.size || 80, dur = o.dur || Math.min(0.9, 0.06 * s.length + 0.2);
  const k = clamp((t - t0) / dur); if (k <= 0) return;
  const w = textWidth(ctx, s, size, o.weight || 'bold');
  const left = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(left - 20, y - size * 1.2, (w + 40) * k, size * 1.6); ctx.clip();
  text(ctx, s, x, y, o); ctx.restore();
}
function underline(ctx, x1, x2, y, t0, t, { c = RED, w = 6, seed = 11, dur = 0.35 } = {}) {
  const k = ramp(t, t0, dur); if (k <= 0) return;
  strokePath(ctx, [[x1, y + 4], [(x1 + x2) / 2, y - 3], [x2, y + 3]], { c, w, seed, prog: k, amp: 2 });
}

// ---------- background ----------
function paper(ctx) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(76,90,105,.036)'; ctx.lineWidth = 0.8;
  const g = 54; ctx.beginPath();
  for (let x = g; x < W; x += g) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, 1440); }
  for (let y = g; y < 1440; y += g) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  ctx.stroke();
}

// ---------- stick figure ----------
// angles in degrees: 0 = pointing down, 90 = right, -90 = left, 180 = up
const dir = a => { const r = a * Math.PI / 180; return [Math.sin(r), Math.cos(r)]; };
function limb(ctx, x, y, a1, a2, L, o) {
  const [dx1, dy1] = dir(a1); const ex = x + dx1 * L, ey = y + dy1 * L;
  const [dx2, dy2] = dir(a2); const hx = ex + dx2 * L, hy = ey + dy2 * L;
  strokePath(ctx, [[x, y], [ex, ey], [hx, hy]], o);
  return [hx, hy];
}
function face(ctx, hx, hy, r, mood, s, c, look = 0, seed = 1, t = 0) {
  const ex = r * 0.36, eyY = hy - r * 0.08, lx = look * r * 0.18;
  const blink = (Math.floor(t * 30 + seed * 13) % 110) < 4;
  ctx.save(); ctx.fillStyle = c;
  const eye = (x) => { ctx.beginPath(); if (blink) { ctx.ellipse(x, eyY, r * 0.12, r * 0.03, 0, 0, Math.PI * 2); } else ctx.ellipse(x, eyY, r * 0.1, r * 0.16, 0, 0, Math.PI * 2); ctx.fill(); };
  if (mood === 'dizzy') {
    for (const sx of [-1, 1]) { const x = hx + sx * ex + lx; line(ctx, x - r * .12, eyY - r * .12, x + r * .12, eyY + r * .12, { w: 3.5 * s, c, seed: seed + sx }); line(ctx, x + r * .12, eyY - r * .12, x - r * .12, eyY + r * .12, { w: 3.5 * s, c, seed: seed + sx + 4 }); }
  } else { eye(hx - ex + lx); eye(hx + ex + lx); }
  ctx.restore();
  const bw = 3.6 * s, by = eyY - r * 0.3;
  const brow = (sx, inner, outer) => line(ctx, hx + sx * ex * 0.45 + lx, by + inner * r, hx + sx * ex * 1.55 + lx, by + outer * r, { w: bw, c, seed: seed + 20 + sx, amp: .4 });
  const my = hy + r * 0.42, mx = hx + lx;
  switch (mood) {
    case 'happy': brow(-1, -.06, -.1); brow(1, -.06, -.1);
      strokePath(ctx, [[mx - r * .32, my - r * .08], [mx, my + r * .14], [mx + r * .32, my - r * .08]], { w: 4 * s, c, seed: seed + 3, amp: .3 }); break;
    case 'grin': brow(-1, -.1, -.16); brow(1, -.1, -.16);
      fillPoly(ctx, [[mx - r * .36, my - r * .1], [mx + r * .36, my - r * .1], [mx + r * .2, my + r * .2], [mx - r * .2, my + r * .2]], c, seed, .3); break;
    case 'sad': brow(-1, -.12, .02); brow(1, -.12, .02);
      strokePath(ctx, [[mx - r * .28, my + r * .1], [mx, my - r * .06], [mx + r * .28, my + r * .1]], { w: 4 * s, c, seed: seed + 3, amp: .3 }); break;
    case 'cry': brow(-1, -.14, .03); brow(1, -.14, .03);
      strokePath(ctx, [[mx - r * .3, my + r * .12], [mx, my - r * .08], [mx + r * .3, my + r * .12]], { w: 4 * s, c, seed: seed + 3, amp: .3 });
      ctx.save(); ctx.fillStyle = '#5aa7e8'; ctx.beginPath(); ctx.ellipse(hx + ex + lx + r * .05, eyY + r * .32 + (t * 40 % 14), r * .07, r * .11, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break;
    case 'shock': brow(-1, -.2, -.24); brow(1, -.2, -.24);
      ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(mx, my + r * .04, r * .13, r * .19, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break;
    case 'angry': brow(-1, .02, -.14); brow(1, .02, -.14);
      fillPoly(ctx, [[mx - r * .3, my + r * .1], [mx + r * .3, my + r * .1], [mx + r * .22, my - r * .04], [mx - r * .22, my - r * .04]], c, seed, .3); break;
    case 'worried': brow(-1, -.14, -.02); brow(1, -.14, -.02);
      strokePath(ctx, [[mx - r * .26, my + r * .04], [mx - r * .1, my - r * .02], [mx + r * .08, my + r * .05], [mx + r * .26, my - r * .01]], { w: 3.6 * s, c, seed: seed + 3, amp: .3 }); break;
    case 'smug': brow(-1, -.06, -.12); brow(1, 0, -.04);
      strokePath(ctx, [[mx - r * .25, my], [mx + r * .05, my + r * .06], [mx + r * .3, my - r * .1]], { w: 4 * s, c, seed: seed + 3, amp: .3 }); break;
    case 'dizzy':
      strokePath(ctx, [[mx - r * .25, my], [mx - r * .08, my + r * .06], [mx + r * .08, my - r * .04], [mx + r * .25, my + r * .04]], { w: 3.6 * s, c, seed: seed + 3, amp: .3 }); break;
    default: brow(-1, -.08, -.08); brow(1, -.08, -.08);
      line(ctx, mx - r * .2, my, mx + r * .2, my, { w: 4 * s, c, seed: seed + 3 });
  }
}
// returns hand positions so props can attach
function fig(ctx, o) {
  const s = o.s || 1, c = o.c || INK, lw = (o.lw || 5.2) * s;
  const torso = 128 * s, L = 64 * s, LL = 72 * s, r = 36 * s;
  const lean = (o.lean || 0) * Math.PI / 180;
  const hipX = o.x, hipY = o.y;
  const shX = hipX + Math.sin(lean) * torso, shY = hipY - Math.cos(lean) * torso;
  const neck = 14 * s;
  const headX = shX + Math.sin(lean + (o.tilt || 0) * Math.PI / 180) * (neck + r), headY = shY - Math.cos(lean + (o.tilt || 0) * Math.PI / 180) * (neck + r);
  const seed = o.seed || 1, op = { w: lw, c, seed, amp: 1 };
  // legs
  const legs = o.legs || [[-14, -14], [14, 14]];
  const feet = legs.map((lg, i) => limb(ctx, hipX, hipY, lg[0], lg[1], LL, { ...op, seed: seed + 40 + i }));
  feet.forEach(([fx, fy], i) => { ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(fx + (legs[i][1] < 0 ? -5 : 5) * s, fy, 10 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  // torso
  strokePath(ctx, [[hipX, hipY], [shX, shY]], { ...op, seed: seed + 2 });
  // arms
  const arms = o.arms || [[-20, -10], [20, 10]];
  const hands = arms.map((ar, i) => limb(ctx, shX, shY, ar[0], ar[1], L, { ...op, seed: seed + 50 + i }));
  hands.forEach(([x, y]) => { ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, 7.5 * s, 6.5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  // head
  ctx.save(); ctx.fillStyle = o.headFill || PAPER; ctx.beginPath(); ctx.arc(headX, headY, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  strokePath(ctx, circlePts(headX, headY, r, r * 1.02, 34), { ...op, seed: seed + 7, amp: .6 });
  // hair tufts
  if (o.hair !== false) {
    strokePath(ctx, [[headX - r * .15, headY - r], [headX - r * .05, headY - r * 1.32], [headX + r * .12, headY - r * 1.22]], { w: lw * .8, c, seed: seed + 8, amp: .5 });
    strokePath(ctx, [[headX + r * .12, headY - r], [headX + r * .3, headY - r * 1.28]], { w: lw * .8, c, seed: seed + 9, amp: .5 });
  }
  face(ctx, headX, headY, r, o.mood || 'neutral', s, c, o.look || 0, seed, o.t || 0);
  return { hands, head: [headX, headY], sh: [shX, shY], r };
}
function sweat(ctx, x, y, s, t) {
  const k = (t * 1.4) % 1;
  ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#5aa7e8';
  ctx.beginPath(); ctx.moveTo(x, y + k * 30 * s - 12 * s); ctx.quadraticCurveTo(x + 9 * s, y + k * 30 * s + 6 * s, x, y + k * 30 * s + 9 * s); ctx.quadraticCurveTo(x - 9 * s, y + k * 30 * s + 6 * s, x, y + k * 30 * s - 12 * s); ctx.fill(); ctx.restore();
}
function marks(ctx, x, y, s, seed) { // surprise/emphasis marks
  for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.6; line(ctx, x + Math.cos(a) * 20 * s, y + Math.sin(a) * 20 * s, x + Math.cos(a) * 40 * s, y + Math.sin(a) * 40 * s, { w: 3.5 * s, seed: seed + i }); }
}

// ---------- props ----------
function coinStack(ctx, x, y, n, s = 1, seed = 1) {
  for (let i = 0; i < n; i++) {
    const yy = y - i * 13 * s;
    ctx.save(); ctx.fillStyle = YEL; ctx.beginPath(); ctx.ellipse(x, yy, 34 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(x, yy, 34 * s, 10 * s, 22), { w: 2.6 * s, seed: seed + i, amp: .4 });
  }
}
function moneyBag(ctx, x, y, s = 1, seed = 1) { // y = bottom
  const pts = [[x - 18 * s, y - 70 * s], [x - 46 * s, y - 34 * s], [x - 44 * s, y - 4 * s], [x, y], [x + 44 * s, y - 4 * s], [x + 46 * s, y - 34 * s], [x + 18 * s, y - 70 * s]];
  fillPoly(ctx, pts, '#e9d9a8', seed, 1);
  strokePath(ctx, pts, { w: 4 * s, seed, close: true });
  strokePath(ctx, [[x - 22 * s, y - 72 * s], [x - 30 * s, y - 88 * s], [x, y - 80 * s], [x + 30 * s, y - 88 * s], [x + 22 * s, y - 72 * s]], { w: 4 * s, seed: seed + 1 });
  text(ctx, '₹', x, y - 18 * s, { size: 46 * s, c: GREEN, weight: 'bold' });
}
function phone(ctx, x, y, s = 1, seed = 1, screen = null) { // x,y = center
  const w = 120 * s, h = 210 * s;
  box(ctx, x - w / 2, y - h / 2, w, h, { fill: '#ffffff', lw: 4.5 * s, seed });
  line(ctx, x - 14 * s, y - h / 2 + 14 * s, x + 14 * s, y - h / 2 + 14 * s, { w: 4 * s, seed: seed + 1 });
  if (screen) screen(x, y, w, h);
}
function chartDown(ctx, x, y, w, h, prog, seed = 1, color = RED) {
  // axes
  strokePath(ctx, [[x, y], [x, y + h], [x + w, y + h]], { w: 4, seed });
  const pts = [[x + 10, y + h * .18], [x + w * .2, y + h * .3], [x + w * .32, y + h * .22], [x + w * .46, y + h * .48], [x + w * .58, y + h * .4], [x + w * .72, y + h * .7], [x + w * .84, y + h * .62], [x + w * .97, y + h * .92]];
  strokePath(ctx, pts, { w: 7, c: color, seed: seed + 2, prog, amp: .6 });
  if (prog > .97) { const [ex, ey] = pts[pts.length - 1]; strokePath(ctx, [[ex - 26, ey - 6], [ex, ey], [ex - 4, ey - 26]], { w: 7, c: color, seed: seed + 3 }); }
}
function candles(ctx, x, y, n, prog, seed = 1) { // falling candlesticks
  for (let i = 0; i < n; i++) {
    const k = clamp(prog * n - i); if (k <= 0) continue;
    const cx = x + i * 46, top = y + i * 34, hgt = 60 + (i % 2) * 20;
    ctx.save(); ctx.globalAlpha = k;
    line(ctx, cx, top - 18, cx, top + hgt + 18, { w: 3, seed: seed + i });
    box(ctx, cx - 13, top, 26, hgt, { fill: i === 2 ? '#7cc59a' : '#f19a8c', lw: 3, seed: seed + 10 + i });
    ctx.restore();
  }
}
function card(ctx, x, y, w, h, fill, seed) { box(ctx, x, y, w, h, { fill, lw: 4, seed }); }
function doc(ctx, x, y, w, h, seed, title) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(x + 10, y + 12, w, h); ctx.restore();
  box(ctx, x, y, w, h, { fill: '#fff8de', lw: 4.5, seed });
  if (title) text(ctx, title, x + w / 2, y + 66, { size: 52, c: NAVY });
  for (let i = 0; i < 5; i++) line(ctx, x + 34, y + 112 + i * 34, x + w - 34 - (i % 2) * 50, y + 112 + i * 34, { w: 3, c: '#b9b2a0', seed: seed + i });
}
function mini(ctx, x, y, s, c, mood, seed, t) { // tiny crowd figure
  return fig(ctx, { x, y, s, c, mood, seed, t, hair: false, arms: [[-25, -12], [25, 12]] });
}
function checkMark(ctx, x, y, k, s = 1, seed = 3) {
  strokePath(ctx, [[x - 22 * s, y], [x - 6 * s, y + 18 * s], [x + 26 * s, y - 24 * s]], { w: 8 * s, c: GREEN, seed, prog: k, amp: .6 });
}
function crossMark(ctx, x, y, k, s = 1, seed = 3) {
  strokePath(ctx, [[x - 20 * s, y - 20 * s], [x + 20 * s, y + 20 * s]], { w: 7 * s, c: RED, seed, prog: clamp(k * 2) });
  strokePath(ctx, [[x + 20 * s, y - 20 * s], [x - 20 * s, y + 20 * s]], { w: 7 * s, c: RED, seed: seed + 1, prog: clamp(k * 2 - 1) });
}
function bubble(ctx, x, y, w, h, msg, k, fill, seed, size = 34, c = INK) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  box(ctx, -w / 2, -h / 2, w, h, { fill, lw: 3.5, seed });
  text(ctx, msg, 0, size * .35, { size, c });
  ctx.restore();
}

// ---------- scenes ----------
const T = { // scene boundaries (video time)
  s1: 0, s2: wt(7) - 0.12, s3: wt(18) - 0.15, s4: wt(27) - 0.18, s5: wt(39) - 0.2, s6: wt(42) - 0.2,
  s7: wt(55) - 0.2, s8: wt(71) - 0.2, s9: wt(78) - 0.2, s10: wt(92) - 0.18, end: END
};
const breathe = (t, a = 1) => Math.sin(t * 2.4) * a;

function scene1(ctx, t) { // Nine out of ten traders lose money.
  writeText(ctx, '9 OUT OF 10', 540, 300, 0.0, t, { size: 120, dur: 0.5 });
  writeText(ctx, 'TRADERS', 540, 420, wt(4), t, { size: 96, dur: 0.35 });
  const lose = wt(5); // "lose"
  for (let i = 0; i < 10; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    const x = 170 + col * 185, y = 760 + row * 390;
    const a = 0.1 + i * 0.085, k = pop(t, a, 0.3); if (k <= 0) continue;
    const winner = i === 7;
    const hit = !winner && t > lose + i * 0.03;
    const drop = hit ? ss((t - lose - i * 0.03) / 0.3) : 0;
    ctx.save(); ctx.translate(x, y + 120); ctx.scale(k, k); ctx.translate(-x, -y - 120);
    const c = hit ? lerp(0, 1, drop) > .5 ? '#6b6f75' : INK : INK;
    fig(ctx, {
      x, y: y + drop * 18, s: 0.72, c, seed: 10 + i, t, mood: winner ? (t > lose ? 'grin' : 'happy') : hit ? 'sad' : 'neutral',
      lean: hit ? 8 * drop : 0, tilt: hit ? 18 * drop : 0,
      arms: winner && t > lose ? [[-160, -175 + breathe(t * 3, 8)], [160, 175 - breathe(t * 3, 8)]] : hit ? [[-12, -4], [12, 4]] : [[-28, -12], [28, 12]],
      legs: [[-14, -12], [14, 12]]
    });
    if (hit) { // red down arrow over head
      const ay = y - 150 * 0.72 - 50;
      strokePath(ctx, [[x, ay - 40], [x, ay + 10]], { w: 6, c: RED, seed: 70 + i, prog: drop });
      if (drop > .8) strokePath(ctx, [[x - 14, ay - 6], [x, ay + 10], [x + 14, ay - 6]], { w: 6, c: RED, seed: 80 + i });
    }
    if (winner && t > lose) { marks(ctx, x + 40, y - 170, 0.9, 7); }
    ctx.restore();
  }
  if (t > lose) {
    const k = ramp(t, lose + 0.25, 0.3);
    text(ctx, 'LOSE MONEY', 540, 1390, { size: 100, c: RED, alpha: k, scale: lerp(1.15, 1, k) });
    underline(ctx, 330, 750, 1412, lose + 0.45, t);
  }
}

function scene2(ctx, t) { // That's not a guess. SEBI studied over one crore F&O traders.
  writeText(ctx, "NOT A GUESS.", 540, 290, wt(7), t, { size: 104 });
  const sebi = wt(11);
  // document slides in
  const k = ss((t - sebi + 0.25) / 0.45);
  if (k > 0) {
    const dx = lerp(-500, 0, k);
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(lerp(-0.12, -0.03, k));
    doc(ctx, 120, 460, 420, 380, 21, 'SEBI STUDY');
    ctx.restore();
  }
  // researcher with magnifier
  const kk = ramp(t, sebi, 0.4);
  if (kk > 0) {
    const sway = Math.sin((t - sebi) * 3) * 10;
    const f = fig(ctx, { x: 790, y: 860, s: 1.05, seed: 31, t, mood: 'smug', lean: -8, tilt: -6, look: -1, arms: [[-120 + sway, -150 + sway], [30, -20]], legs: [[-16, -10], [16, 14]] });
    const [hx, hy] = f.hands[0];
    ctx.save(); ctx.fillStyle = 'rgba(160,210,255,.35)'; ctx.beginPath(); ctx.arc(hx - 46, hy - 40, 46, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(hx - 46, hy - 40, 46), { w: 5, seed: 33 });
    line(ctx, hx - 14, hy - 8, hx + 6, hy + 14, { w: 9, seed: 34 });
  }
  // crowd appears on "one crore"
  const crore = wt(14);
  writeText(ctx, '1 CRORE+', 540, 1050, crore, t, { size: 120, c: NAVY, dur: 0.45 });
  writeText(ctx, 'F&O TRADERS', 540, 1150, wt(16), t, { size: 80, dur: 0.4 });
  for (let i = 0; i < 18; i++) {
    const col = i % 9, row = Math.floor(i / 9);
    const x = 140 + col * 100 + (row ? 50 : 0), y = 1260 + row * 105;
    const kp = pop(t, crore + 0.1 + i * 0.045, 0.25); if (kp <= 0) continue;
    ctx.save(); ctx.translate(x, y); ctx.scale(kp, kp); ctx.translate(-x, -y);
    mini(ctx, x, y, 0.38, INK, 'neutral', 100 + i, t); ctx.restore();
  }
}

function scene3(ctx, t) { // Ninety-three percent of them lost money in three years.
  const a = wt(18);
  const k = pop(t, a, 0.45);
  text(ctx, '93%', 540, 520, { size: 300, c: RED, alpha: clamp(k * 2), scale: lerp(0.6, 1, k), rot: -0.03 });
  underline(ctx, 300, 780, 560, a + 0.5, t, { w: 9 });
  writeText(ctx, 'LOST MONEY', 540, 690, wt(22), t, { size: 96 });
  // chart drawing down
  const cp = clamp((t - wt(22)) / 1.5);
  chartDown(ctx, 120, 820, 520, 420, cp, 41);
  candles(ctx, 170, 860, 6, cp, 51);
  // sad trader sitting on the floor next to chart
  const ft = t - a;
  const f = fig(ctx, { x: 830, y: 1150, s: 1.0, seed: 61, t, mood: t > wt(22) ? 'cry' : 'worried', lean: 10, tilt: 14 + Math.sin(ft * 2) * 3,
    arms: [[-150, 40], [150, -40]], legs: [[-70, 10], [60, -10]] });
  if (t > wt(22)) sweat(ctx, f.head[0] + 40, f.head[1] - 20, 1, t);
  writeText(ctx, 'IN 3 YEARS', 840, 1360, wt(25), t, { size: 76, c: NAVY });
}

function scene4(ctx, t) { // And here's the crazy part. Most of the losers... kept trading anyway.
  writeText(ctx, 'THE CRAZY PART...', 540, 290, wt(27), t, { size: 96, dur: 0.6 });
  const losers = wt(32);
  // bandaged, broke trader
  const kept = wt(36);
  const tapping = t > kept;
  const tap = tapping ? Math.abs(Math.sin((t - kept) * 9)) : 0;
  const k = ramp(t, wt(27) + 0.2, 0.4);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  const f = fig(ctx, { x: 470, y: 1060, s: 1.35, seed: 71, t, mood: tapping ? 'dizzy' : (t > losers ? 'worried' : 'neutral'), lean: tapping ? 6 : 0, tilt: 8,
    arms: [[-35, -30], tapping ? [130 - tap * 12, 80 - tap * 28] : [40, 20]], legs: [[-16, -8], [16, 10]] });
  ctx.restore();
  // empty pockets & bandage appear with "losers"
  if (t > losers) {
    const kb = ramp(t, losers, 0.3);
    ctx.save(); ctx.globalAlpha = kb;
    const [hx, hy] = f.head;
    ctx.save(); ctx.translate(hx - 18, hy - 32); ctx.rotate(-0.5); ctx.fillStyle = '#f2d7b0'; ctx.fillRect(-26, -9, 52, 18); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-26, -9, 52, 18); ctx.restore();
    // pockets out
    for (const sx of [-1, 1]) { const px = 470 + sx * 44, py = 1050; fillPoly(ctx, [[px - 18, py], [px + 18, py], [px + 10, py + 36], [px - 10, py + 36]], '#fff', 90 + sx); strokePath(ctx, [[px - 18, py], [px + 18, py], [px + 10, py + 36], [px - 10, py + 36]], { w: 3.5, close: true, seed: 92 + sx }); }
    // flies
    for (let i = 0; i < 2; i++) { const a = t * 4 + i * 3; const fx = 470 + Math.cos(a) * 60 + (i ? 30 : -30), fy = 1090 + Math.sin(a * 1.3) * 18; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(fx, fy, 4, 0, 7); ctx.fill(); }
    ctx.restore();
    writeText(ctx, 'most LOSERS...', 540, 400, losers, t, { size: 76, c: GREY, align: 'center' });
  }
  if (tapping) {
    const [hx, hy] = f.hands[1];
    phone(ctx, hx + 70, hy - 10, 1.05, 77, (x, y, w, h) => {
      const on = Math.sin((t - kept) * 9) > 0;
      box(ctx, x - 44, y + 10, 88, 54, { fill: on ? GREEN : '#7cc59a', lw: 3, seed: 78 });
      text(ctx, 'BUY', x, y + 50, { size: 40, c: '#fff' });
      chartDown(ctx, x - 44, y - 80, 88, 70, 1, 79);
    });
    writeText(ctx, 'STILL TRADING.', 540, 1390, kept, t, { size: 104, c: RED, dur: 0.5 });
    underline(ctx, 260, 820, 1410, kept + 0.55, t);
  }
}

function scene5(ctx, t) { // Why? Three traps.
  const why = wt(39);
  const k = pop(t, why - 0.05, 0.4);
  text(ctx, 'WHY?', 540, 560, { size: 260, c: INK, alpha: clamp(k * 2), scale: lerp(0.5, 1, k), rot: Math.sin(t * 3) * 0.02 });
  const tr = wt(40);
  writeText(ctx, '3 TRAPS', 540, 790, tr, t, { size: 120, c: RED });
  // three trap cards
  const labels = ['1', '2', '3'];
  for (let i = 0; i < 3; i++) {
    const kp = pop(t, tr + 0.15 + i * 0.2, 0.3); if (kp <= 0) continue;
    const x = 230 + i * 310, y = 1080;
    ctx.save(); ctx.translate(x, y); ctx.scale(kp, kp); ctx.rotate((i - 1) * 0.06);
    card(ctx, -110, -130, 220, 260, ['#fde9a8', '#d9ecdd', '#f9d6cf'][i], 300 + i);
    text(ctx, labels[i], 0, -20, { size: 130 });
    // little bear trap teeth
    strokePath(ctx, [[-70, 80], [-50, 50], [-30, 80], [-10, 50], [10, 80], [30, 50], [50, 80], [70, 50]], { w: 4, c: NAVY, seed: 310 + i });
    ctx.restore();
  }
}

function trapHeader(ctx, n, title, t0, t, color) {
  const k = pop(t, t0, 0.35);
  ctx.save(); ctx.translate(150, 270); ctx.scale(k, k);
  fillPoly(ctx, circlePts(0, 0, 62, 62, 24), color, 400 + n, 1.5); strokePath(ctx, circlePts(0, 0, 62), { w: 5, seed: 410 + n });
  text(ctx, String(n), 0, 32, { size: 92 }); ctx.restore();
  writeText(ctx, title, 245, 300, t0 + 0.2, t, { size: 86, align: 'left', dur: 0.55 });
}

function scene6(ctx, t) { // One: revenge trading. You lose, so you trade bigger to win it back.
  trapHeader(ctx, 1, 'REVENGE TRADING', wt(42), t, '#fde9a8');
  const lose = wt(46), bigger = wt(50), back = wt(54);
  // table
  strokePath(ctx, [[120, 1120], [960, 1120]], { w: 6, seed: 501 });
  line(ctx, 170, 1120, 170, 1320, { w: 6, seed: 502 }); line(ctx, 910, 1120, 910, 1320, { w: 6, seed: 503 });
  // stacks: small -> medium -> huge, pushed into a pit
  const stage = t < lose ? 0 : t < bigger ? 1 : t < back ? 2 : 3;
  const push = Math.sin(t * 6) * 6;
  const angry = t > lose;
  const f = fig(ctx, { x: 270, y: 970, s: 1.25, seed: 511, t, mood: angry ? 'angry' : 'neutral', lean: angry ? 14 : 0, tilt: angry ? 6 : 0,
    arms: [[60 + push * .6, 100], [80 + push * .6, 110]], legs: [[-30, -18], [24, 16]] });
  if (angry) { // steam
    const [hx, hy] = f.head;
    for (let i = 0; i < 2; i++) { const k = (t * 1.6 + i * .5) % 1; ctx.save(); ctx.globalAlpha = 1 - k; strokePath(ctx, [[hx - 30 + i * 60, hy - 50 - k * 50], [hx - 40 + i * 60, hy - 70 - k * 50], [hx - 28 + i * 60, hy - 90 - k * 50]], { w: 4, c: GREY, seed: 520 + i }); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(hx, hy, f.r, 0, 7); ctx.fill(); ctx.restore();
  }
  const hx = f.hands[1][0] + 40;
  const sizes = [3, 3, 7, 13];
  const ns = sizes[stage];
  const grow = stage >= 2 ? pop(t, stage === 2 ? bigger : back, 0.3) : 1;
  coinStack(ctx, hx + 40, 1104, Math.round(ns * clamp(grow, 0.6, 1.1)), 1.15, 530);
  if (stage >= 3) coinStack(ctx, hx + 120, 1104, 10, 1.15, 560);
  // loss chart on wall
  if (t > lose) {
    const k = clamp((t - lose) / 0.6);
    box(ctx, 620, 500, 330, 250, { fill: '#fff', lw: 4, seed: 540 });
    chartDown(ctx, 650, 530, 270, 190, k, 541);
    writeText(ctx, '-₹20,000', 785, 820, lose + 0.2, t, { size: 64, c: RED });
  }
  if (t > bigger) writeText(ctx, 'BIGGER BET', 850, 990, bigger, t, { size: 74, c: NAVY });
  if (t > back) writeText(ctx, '"WIN IT BACK!"', 540, 1440, back - 0.15, t, { size: 92, c: RED });
}

function scene7(ctx, t) { // Two: betting too much on a single trade. One bad day wipes out a whole month.
  trapHeader(ctx, 2, 'ALL-IN ON ONE TRADE', wt(55), t, '#d9ecdd');
  const single = wt(61), bad = wt(63), wipes = wt(66), month = wt(69);
  // left: trader carrying all bags onto one card (until "One bad day")
  if (t < bad + 0.2) {
    const a = clamp(1 - (t - bad) / 0.2);
    ctx.save(); ctx.globalAlpha = a;
    const wob2 = Math.sin(t * 5) * 6;
    const f = fig(ctx, { x: 360, y: 1000, s: 1.3, seed: 611, t, mood: 'grin', lean: -4 + wob2 * .3,
      arms: [[150, 175], [-150, -175]], legs: [[-18, -12], [18, 12]] });
    const [x1, y1] = f.hands[0], [x2, y2] = f.hands[1];
    const cx = (x1 + x2) / 2;
    moneyBag(ctx, cx - 50, y1 - 6, 1, 612); moneyBag(ctx, cx + 50, y1 - 6, 1, 613); moneyBag(ctx, cx, y1 - 90, 1.1, 614);
    // single trade ticket
    const kc = pop(t, single, 0.3);
    if (kc > 0) { ctx.save(); ctx.translate(780, 1050); ctx.scale(kc, kc); card(ctx, -120, -80, 240, 160, '#fff', 615); text(ctx, '1 TRADE', 0, 18, { size: 60, c: NAVY }); ctx.restore(); }
    ctx.restore();
  }
  // calendar month
  if (t > bad) {
    const k = ramp(t, bad, 0.35);
    ctx.save(); ctx.globalAlpha = k;
    const x0 = 150, y0 = 520, cw = 112, ch = 96;
    box(ctx, x0, y0 - 80, cw * 7, 80, { fill: '#f9d6cf', lw: 4, seed: 620 });
    text(ctx, 'THIS MONTH', x0 + cw * 3.5, y0 - 22, { size: 54 });
    box(ctx, x0, y0, cw * 7, ch * 4 + 10, { fill: '#fff', lw: 4, seed: 621 });
    for (let d = 0; d < 28; d++) {
      const cx = x0 + (d % 7) * cw + cw / 2, cy = y0 + Math.floor(d / 7) * ch + ch / 2 + 6;
      const isBad = d === 19;
      if (isBad) { ctx.save(); ctx.fillStyle = 'rgba(224,69,47,.18)'; ctx.fillRect(cx - cw / 2 + 6, cy - ch / 2 + 4, cw - 12, ch - 10); ctx.restore(); }
      const gone = t > wipes + d * 0.025 && !isBad;
      text(ctx, gone ? '' : (isBad ? '-' : '+'), cx, cy + 22, { size: 60, c: isBad ? RED : GREEN });
      if (gone) crossMark(ctx, cx, cy, ramp(t, wipes + d * 0.025, 0.18), 0.7, 630 + d);
    }
    ctx.restore();
    writeText(ctx, 'ONE BAD DAY', 380, 1060, bad + 0.1, t, { size: 92, c: RED });
    // shocked trader
    const f = fig(ctx, { x: 830, y: 1230, s: 0.95, seed: 640, t, mood: t > wipes ? 'shock' : 'worried', tilt: t > wipes ? -6 : 0,
      arms: t > wipes ? [[-150, -200], [150, 200]] : [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
    if (t > wipes) marks(ctx, f.head[0] + 50, f.head[1] - 40, 1, 650);
    if (t > month) writeText(ctx, '= A WHOLE MONTH GONE', 540, 1440, month - 0.1, t, { size: 72, c: INK });
  }
}

function scene8(ctx, t) { // Three: following tips instead of a plan.
  trapHeader(ctx, 3, 'TIPS > A PLAN', wt(71), t, '#f9d6cf');
  const tips = wt(73), plan = wt(77);
  const bob = Math.sin(t * 2.2) * 4;
  const f = fig(ctx, { x: 360, y: 1080, s: 1.3, seed: 711, t, mood: t > tips ? 'grin' : 'neutral', lean: 8, tilt: 10, look: 1,
    arms: [[60, 140], [110, 160 + bob]], legs: [[-14, -10], [14, 10]] });
  const [px, py] = f.hands[1];
  phone(ctx, px + 70, py - 40, 1.1, 712, (x, y) => { chartDown(ctx, x - 44, y - 70, 88, 80, 1, 713, GREEN); });
  // incoming tip bubbles
  const msgs = [['BUY NOW!!', '#d9ecdd'], ['100% SURE', '#fde9a8'], ['10X TODAY', '#f9d6cf']];
  msgs.forEach(([m, fill], i) => bubble(ctx, 760 - (i % 2) * 40, 560 + i * 140, 300, 100, m, pop(t, tips + 0.05 + i * 0.22, 0.28), fill, 720 + i, 52));
  // the plan falls to the floor
  const k = ss((t - plan + 0.4) / 0.6);
  const x = lerp(260, 200, k), y = lerp(860, 1222, k);
  ctx.save(); ctx.translate(x, y); ctx.rotate(lerp(-0.1, -1.25, k));
  box(ctx, -70, -50, 140, 100, { fill: '#fff8de', lw: 3.5, seed: 730 }); text(ctx, 'PLAN', 0, 12, { size: 44, c: NAVY });
  ctx.restore();
  if (k > .9) crossMark(ctx, 200, 1180, ramp(t, plan + 0.25, 0.3), 1.4, 740);
  strokePath(ctx, [[80, 1232], [1000, 1232]], { w: 4, c: '#c9c4b6', seed: 750 });
}

function scene9(ctx, t) { // The few who survive do the opposite. Small risk. Fast exits. A written plan.
  writeText(ctx, 'THE FEW WHO WIN', 540, 290, wt(78), t, { size: 100, c: GREEN });
  writeText(ctx, 'do the opposite', 540, 390, wt(82), t, { size: 70, weight: 'normal' });
  const f = fig(ctx, { x: 270, y: 1060, s: 1.3, seed: 811, t, mood: 'smug', lean: -2 + breathe(t, 1), tilt: -4,
    arms: [[-40, -15], [100, 40 + breathe(t, 4)]], legs: [[-14, -10], [14, 10]] });
  // clipboard in hand
  const [hx, hy] = f.hands[1];
  ctx.save(); ctx.translate(hx + 20, hy); ctx.rotate(-0.08); box(ctx, -10, -150, 120, 170, { fill: '#fff8de', lw: 4, seed: 812 }); line(ctx, 15, -150, 85, -150, { w: 9, seed: 813 }); ctx.restore();
  const items = [['SMALL RISK', wt(85)], ['FAST EXITS', wt(87)], ['WRITTEN PLAN', wt(89)]];
  items.forEach(([s, t0], i) => {
    const y = 640 + i * 200;
    const k = ramp(t, t0 - 0.05, 0.2); if (k <= 0) return;
    box(ctx, 470, y - 60, 80, 80, { fill: '#fff', lw: 4, seed: 820 + i, prog: k * 1.2 });
    checkMark(ctx, 510, y - 20, ramp(t, t0 + 0.12, 0.25), 1.2, 830 + i);
    writeText(ctx, s, 580, y, t0, t, { size: 80, align: 'left', dur: 0.4 });
  });
  // shield of small coin stack
  coinStack(ctx, 840, 1226, 2, 1, 850);
  strokePath(ctx, [[80, 1238], [1000, 1238]], { w: 4, c: '#c9c4b6', seed: 851 });
}

function scene10(ctx, t) { // So before your next trade, ask yourself: am I in the ninety-three... or the seven?
  writeText(ctx, 'BEFORE YOUR NEXT TRADE...', 540, 290, wt(92), t, { size: 84, dur: 0.7 });
  const n93 = wt(103), n7 = wt(106), ask = wt(97);
  // left crowd (93) and right small group (7)
  if (t > n93 - 0.2) {
    const k = ramp(t, n93 - 0.2, 0.4);
    ctx.save(); ctx.globalAlpha = k;
    box(ctx, 70, 520, 560, 560, { fill: 'rgba(224,69,47,.07)', lw: 4, c: RED, seed: 901 });
    text(ctx, '93%', 350, 640, { size: 130, c: RED });
    for (let i = 0; i < 15; i++) { const x = 140 + (i % 5) * 105, y = 800 + Math.floor(i / 5) * 105; mini(ctx, x, y, 0.36, '#6b6f75', 'sad', 920 + i, t); }
    ctx.restore();
  }
  if (t > n7 - 0.15) {
    const k = pop(t, n7 - 0.15, 0.4);
    ctx.save(); ctx.translate(820, 800); ctx.scale(k, k); ctx.translate(-820, -800);
    box(ctx, 680, 520, 300, 560, { fill: 'rgba(47,154,90,.08)', lw: 4, c: GREEN, seed: 940 });
    text(ctx, '7%', 830, 640, { size: 130, c: GREEN });
    mini(ctx, 830, 900, 0.62, INK, 'grin', 941, t);
    ctx.restore();
  }
  // asking trader in centre bottom pointing at viewer
  const q = ramp(t, ask - 0.2, 0.4);
  if (q > 0 && t < n93 - 0.2) {
    ctx.save(); ctx.globalAlpha = q;
    const f = fig(ctx, { x: 540, y: 1000, s: 1.4, seed: 960, t, mood: 'worried', tilt: Math.sin(t * 2) * 5, arms: [[-40, -20], [150, 100]], legs: [[-14, -10], [14, 10]] });
    text(ctx, '?', f.head[0] + 90, f.head[1] - 50, { size: 140, c: RED, rot: 0.15 });
    ctx.restore();
  }
  if (t > n7 + 0.5) {
    const k = pop(t, n7 + 0.55, 0.4);
    text(ctx, 'WHICH ONE ARE YOU?', 540, 1320, { size: 100, c: INK, alpha: clamp(k * 2), scale: lerp(0.7, 1, k) });
    underline(ctx, 170, 910, 1345, n7 + 0.9, t, { w: 8 });
  }
}

const SCENES = [[T.s1, scene1], [T.s2, scene2], [T.s3, scene3], [T.s4, scene4], [T.s5, scene5], [T.s6, scene6], [T.s7, scene7], [T.s8, scene8], [T.s9, scene9], [T.s10, scene10]];

// ---------- captions ----------
function buildCues() {
  const cues = []; let cur = [];
  const flush = () => { if (cur.length) { cues.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map(w => w.text).join(' ') }); cur = []; } };
  for (const w of words) {
    cur.push(w);
    const tt = cur.map(x => x.text).join(' ');
    if (/[.?!:,]$|\.\.\.$/.test(w.text) || tt.length > 22) flush();
  }
  flush();
  // extend each cue to just before the next one (max +0.6s) for reading time
  cues.forEach((c, i) => { const nx = cues[i + 1]; c.end = Math.min(nx ? nx.start - 0.02 : c.end + 0.8, c.end + 0.6); });
  return cues;
}
const CUES = buildCues();
function captions(ctx, t) {
  const c = CUES.find(c => t >= c.start - 0.05 && t <= c.end); if (!c) return;
  const s = c.text.replace(/\.\.\.$/, '…');
  text(ctx, s, 540, 1565, { size: 76, c: '#2b2b2b', weight: 'bold' });
}

// ---------- frame ----------
function drawFrame(ctx, t) {
  paper(ctx);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  const [t0, fn] = SCENES[idx];
  // quick soft cross-cut: new scene slides 40px & fades in over 0.18s
  const k = idx ? ss((t - t0) / 0.18) : 1;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30);
  fn(ctx, t); ctx.restore();
  if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
  if (t >= T.s2 && t < T.s4) text(ctx, 'Source: SEBI study, Sep 2024 (FY22-FY24)', 540, 1470, { size: 38, c: GREY, weight: 'normal', alpha: ramp(t, T.s2, .3) });
  if (t >= wt(106) + 1.0) text(ctx, 'Educational only. Not investment advice.', 540, 1470, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, wt(106) + 1.0, .3) });
  captions(ctx, t);
}

export { drawFrame, W, H, FPS, END, T, CUES, words, fig, text, paper, underline, strokePath, circlePts, box, coinStack, chartDown, mini, writeText, ramp, pop, ss, lerp, clamp, fillPoly, phone, card, doc, checkMark, crossMark, bubble, marks, sweat, moneyBag, line, textWidth };

// ---------- main ----------
if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const out = process.argv[2] || 'picture.mp4';
  const a = parseFloat(process.argv[3] || '0'), b = parseFloat(process.argv[4] || String(END));
  const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
  if (process.argv.includes('--stills')) {
    const times = process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number);
    for (const t of times) { drawFrame(ctx, t); fs.writeFileSync(`${out}-${t.toFixed(2)}.png`, canvas.toBuffer('image/png')); }
    process.exit(0);
  }
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(a * FPS), n1 = Math.round(b * FPS);
  for (let n = n0; n < n1; n++) {
    drawFrame(ctx, n / FPS);
    const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('done', out, (n1 - n0) / FPS, 's');
}
