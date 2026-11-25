// Day 1 PM: "Why your SIP feels useless for 5 years" (B1 line-art, 9:16)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createCanvas } = require('@napi-rs/canvas');
const R = await import('../../lib/draw.mjs');
const { fig, text, paper, underline, strokePath, circlePts, box, coinStack, writeText, ramp, pop, ss, lerp, clamp, fillPoly, phone, card, checkMark, crossMark, marks, sweat, line } = R;

const W = 1080, H = 1920, FPS = 30, LEAD = 0.3;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', YEL = '#f3d35b', NAVY = '#27406b', GREY = '#9aa0a6';
const SEG = JSON.parse(fs.readFileSync(new URL('./segments.json', import.meta.url))).map(s => ({ ...s, start: s.start + LEAD, end: s.end + LEAD }));
const WORDS = JSON.parse(fs.readFileSync(new URL('./words.json', import.meta.url))).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = SEG[SEG.length - 1].end + 1.8;
const S = i => SEG[i].start;
// time of the first word in segment i that starts with `w`
const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && o.text.toLowerCase().startsWith(w.toLowerCase())); return x ? x.start : SEG[i].start; };

function hook(ctx, t) { // 0
  const k = pop(t, 0, 0.35);
  text(ctx, '₹5,000/महीना', 540, 250, { size: 96, c: NAVY, alpha: clamp(k * 2), scale: lerp(0.7, 1, k) });
  const k2 = pop(t, at(0, 'पचास') - 0.1, 0.35);
  text(ctx, '= ₹50 लाख?', 540, 390, { size: 130, c: GREEN, alpha: clamp(k2 * 2), scale: lerp(0.6, 1, k2) });
  const why = at(0, 'तो');
  writeText(ctx, 'तो फिर ये', 540, 1250, why, t, { size: 84, dur: 0.4 });
  writeText(ctx, 'बेकार लगता है?', 540, 1350, why + 0.4, t, { size: 96, c: RED, dur: 0.4 });
  const f = fig(ctx, { x: 400, y: 1000, s: 1.3, seed: 11, t, mood: t > why ? 'angry' : 'shock', tilt: t > why ? 10 : -6, look: 1,
    arms: [[-30, -15], [110, 150 + Math.sin(t * 3) * 6]], legs: [[-16, -10], [16, 10]] });
  if (t > why) { const [hx, hy] = f.head; sweat(ctx, hx + 46, hy - 10, 1, t); } else marks(ctx, f.head[0] + 50, f.head[1] - 40, 1, 14);
  const [px, py] = f.hands[1];
  phone(ctx, px + 70, py - 40, 1.15, 12, (x, y) => {
    text(ctx, 'मेरा SIP', x, y - 62, { size: 30, c: NAVY });
    strokePath(ctx, [[x - 44, y + 10], [x - 15, y + 6], [x + 10, y + 12], [x + 44, y + 4]], { w: 5, c: GREY, seed: 13 });
    text(ctx, '+0.8%', x, y + 70, { size: 32, c: GREY });
  });
}

function monthly(ctx, t) { // 1
  const k = pop(t, S(1), 0.4);
  text(ctx, '₹5,000', 540, 470, { size: 190, c: GREEN, alpha: clamp(k * 2), scale: lerp(0.6, 1, k) });
  writeText(ctx, 'हर महीने', 540, 590, S(1) + 0.5, t, { size: 80, weight: 'normal' });
  // jar
  const jx = 700, jy = 1220;
  strokePath(ctx, [[jx - 110, jy - 240], [jx - 110, jy], [jx + 110, jy], [jx + 110, jy - 240]], { w: 6, seed: 21 });
  line(ctx, jx - 125, jy - 240, jx + 125, jy - 240, { w: 6, seed: 22 });
  const n = Math.floor((t - S(1)) / 0.45) + 1;
  coinStack(ctx, jx, jy - 18, clamp(n, 0, 12), 1.5, 23);
  const ph = ((t - S(1)) % 0.45) / 0.45; // falling coin
  if (t > S(1)) { ctx.save(); ctx.globalAlpha = 1 - ph * 0.3; coinStack(ctx, jx, lerp(jy - 420, jy - 30 - n * 19, ss(ph)), 1, 1.5, 24); ctx.restore(); }
  fig(ctx, { x: 330, y: 1060, s: 1.25, seed: 25, t, mood: 'happy', lean: 6, arms: [[-30, -15], [120, 170 - ph * 30]], legs: [[-16, -10], [16, 10]] });
  text(ctx, 'S I P', 700, 1330, { size: 60, c: NAVY, alpha: ramp(t, S(1) + 0.5) });
}

const BARS = [ // [label, invested L, value L, value text, seg]
  ['5 साल', 3, 4.12, '≈ ₹4.1L', 2],
  ['10 साल', 6, 11.62, '≈ ₹11.6L', 3],
  ['20 साल', 12, 49.96, '≈ ₹50L', 4]];
function bars(ctx, t) { // 2-4
  writeText(ctx, '₹5,000 / महीना SIP', 540, 260, S(2), t, { size: 76, c: NAVY, dur: 0.4 });
  const base = 1180, scale = 15; // px per lakh
  strokePath(ctx, [[100, base], [1000, base]], { w: 5, seed: 31 });
  BARS.forEach(([lab, inv, val, vt, si], i) => {
    if (t < S(si)) return;
    const x = 260 + i * 290, gk = ss((t - S(si) - 0.4) / 1.2);
    const ik = ss((t - S(si)) / 0.4);
    const hi = inv * scale * ik, hv = val * scale * gk;
    box(ctx, x - 90, base - hi, 70, Math.max(hi, 1), { fill: '#d7d9dc', lw: 3.5, seed: 40 + i });
    if (gk > 0) box(ctx, x + 10, base - hv, 80, Math.max(hv, 1), { fill: '#9fd6b2', lw: 3.5, seed: 50 + i });
    text(ctx, lab, x, base + 60, { size: 46 });
    text(ctx, `₹${inv}L डाले`, x - 55, base - hi - 18, { size: 34, c: '#666' });
    if (gk > 0.3) text(ctx, vt, x + 50, base - hv - 22, { size: 46, c: GREEN, alpha: ramp(t, S(si) + 0.8, 0.3) });
  });
  if (t > at(2, 'स्लो')) writeText(ctx, 'स्लो लगता है...', 260, 980, at(2, 'स्लो'), t, { size: 54, c: GREY, weight: 'normal' });
  const mood = t < S(3) ? 'worried' : t < S(4) ? 'smug' : 'shock';
  const f = fig(ctx, { x: 150, y: 1470, s: 0.7, seed: 60, t, mood, tilt: mood === 'shock' ? -8 : 0,
    arms: mood === 'shock' ? [[-150, -200], [150, 200]] : [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
  if (mood === 'shock') marks(ctx, f.head[0] + 40, f.head[1] - 30, 0.8, 61);
  text(ctx, '12% सालाना मानकर', 760, 1470, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, S(2) + 0.6) });
}

function curvePts(x0, y0, w, h, n = 60) { const p = []; for (let i = 0; i <= n; i++) { const u = i / n; p.push([x0 + u * w, y0 - h * (Math.pow(1.12, u * 20) - 1) / (Math.pow(1.12, 20) - 1)]); } return p; }
function curve(ctx, t) { // 5-7
  const x0 = 150, y0 = 1180, w = 800, h = 760;
  strokePath(ctx, [[x0, y0 - h - 30], [x0, y0], [x0 + w + 20, y0]], { w: 5, seed: 71 });
  text(ctx, 'साल', x0 + w - 60, y0 + 100, { size: 40, c: '#666', weight: 'normal' });
  [0, 5, 10, 15, 20].forEach(y => text(ctx, String(y), x0 + y / 20 * w, y0 + 40, { size: 34, c: '#777', weight: 'normal' }));
  const prog = t < S(6) ? ss((t - S(5)) / 3.4) : 1;
  strokePath(ctx, curvePts(x0, y0, w, h), { w: 9, c: GREEN, seed: 72, prog, amp: 0.4 });
  if (t < S(6)) { writeText(ctx, 'वही SIP.', 540, 260, S(5), t, { size: 96 }); writeText(ctx, 'ग्रोथ देर से दिखती है।', 540, 370, at(5, 'बस'), t, { size: 70, c: GREEN }); }
  else if (t < S(7)) {
    writeText(ctx, 'कंपाउंडिंग', 540, 280, S(6), t, { size: 112, c: GREEN, dur: 0.5 });
    writeText(ctx, 'रिटर्न्स पर रिटर्न्स', 540, 380, at(6, 'आपके'), t, { size: 66, weight: 'normal' });
    for (let i = 0; i < 6; i++) { const k = pop(t, at(6, 'आपके') + i * 0.25, 0.3); if (k <= 0) continue;
      const [px, py] = curvePts(x0, y0, w, h)[30 + i * 6]; ctx.save(); ctx.translate(px - 40, py - 30); ctx.scale(k, k); coinStack(ctx, 0, 0, 1, 0.8, 80 + i); ctx.restore(); }
  } else {
    writeText(ctx, 'ज़्यादातर लोग यहीं छोड़ते हैं', 540, 300, S(7), t, { size: 76, c: RED });
    const qx = x0 + 3 / 20 * w, qy = curvePts(x0, y0, w, h)[9][1];
    strokePath(ctx, [[qx, 360], [qx, qy - 40]], { w: 6, c: RED, seed: 90, prog: ramp(t, S(7) + 0.3, 0.4) });
    if (t > S(7) + 0.7) strokePath(ctx, [[qx - 16, qy - 60], [qx, qy - 40], [qx + 16, qy - 60]], { w: 6, c: RED, seed: 91 });
    text(ctx, 'साल 3', qx + 70, qy - 70, { size: 44, c: RED, alpha: ramp(t, S(7) + 0.5) });
    const wk = clamp((t - at(7, 'छोड़')) / 2.5);
    fig(ctx, { x: lerp(qx, -40, wk), y: y0 - 120, s: 0.6, seed: 92, t, mood: 'sad', lean: -6,
      arms: [[-25, -10], [25, 10]], legs: [[-25 + Math.sin(t * 10) * 18, -10], [25 - Math.sin(t * 10) * 18, 10]] });
    const bk = ramp(t, at(7, 'कर्व') - 0.1, 0.4);
    if (bk > 0) { const [bx, by] = curvePts(x0, y0, w, h)[44];
      ctx.save(); ctx.globalAlpha = bk; text(ctx, 'कर्व यहाँ मुड़ता है', bx - 210, by - 80, { size: 50, c: GREEN });
      strokePath(ctx, [[bx - 90, by - 60], [bx - 20, by - 10]], { w: 6, c: GREEN, seed: 95 }); ctx.restore(); }
  }
}

function caveat(ctx, t) { // 8
  const k = pop(t, S(8), 0.4);
  ctx.save(); ctx.translate(540, 420); ctx.scale(k, k);
  card(ctx, -400, -110, 800, 200, '#fff8de', 101); text(ctx, '12% सालाना मानकर', 0, 25, { size: 76, c: NAVY }); ctx.restore();
  // wavy real-world line
  const pts = []; for (let i = 0; i <= 50; i++) { const u = i / 50; pts.push([150 + u * 780, 1050 - u * 330 + Math.sin(u * 19) * 70 * (1 - u * 0.3)]); }
  strokePath(ctx, pts, { w: 7, c: NAVY, seed: 102, prog: ramp(t, at(8, 'असली'), 1.2), amp: 0.4 });
  text(ctx, 'असली रिटर्न्स ऊपर-नीचे होते हैं', 540, 1180, { size: 54, weight: 'normal', alpha: ramp(t, at(8, 'असली') + 0.3) });
  const g = pop(t, at(8, 'कुछ'), 0.35);
  if (g > 0) { ctx.save(); ctx.translate(540, 1340); ctx.rotate(-0.08); ctx.scale(g, g);
    strokePath(ctx, [[-330, -70], [330, -70], [330, 50], [-330, 50]], { w: 7, c: RED, seed: 103, close: true });
    text(ctx, 'गारंटी नहीं', 0, 20, { size: 80, c: RED }); ctx.restore(); }
}

function ending(ctx, t) { // 9
  writeText(ctx, 'SIP को ऐसे आँकिए', 540, 270, S(9), t, { size: 84, dur: 0.5 });
  const c1 = pop(t, at(9, 'पहले'), 0.35), c15 = pop(t, at(9, 'पंद्रहवें'), 0.35);
  const cal = (x, lab, k, good, seed) => { if (k <= 0) return; ctx.save(); ctx.translate(x, 700); ctx.scale(k, k);
    card(ctx, -170, -150, 340, 300, '#fff', seed); box(ctx, -170, -150, 340, 70, { fill: good ? '#d9ecdd' : '#f9d6cf', lw: 4, seed: seed + 1 });
    text(ctx, 'साल', 0, -100, { size: 44 }); text(ctx, lab, 0, 90, { size: 150, c: good ? GREEN : RED }); ctx.restore(); };
  cal(300, '1', c1, false, 111); cal(780, '15', c15, true, 115);
  if (c1 > 0.9) crossMark(ctx, 300, 700, ramp(t, at(9, 'पहले') + 0.3, 0.3), 3, 113);
  if (c15 > 0.9) checkMark(ctx, 870, 820, ramp(t, at(9, 'पंद्रहवें') + 0.3, 0.3), 2, 117);
  fig(ctx, { x: 540, y: 1180, s: 1.0, seed: 120, t, mood: t > at(9, 'पंद्रहवें') ? 'grin' : 'smug',
    arms: t > at(9, 'पंद्रहवें') ? [[-150, -175], [40, 20]] : [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
  if (t > SEG[9].end + 0.2) {
    const k = pop(t, SEG[9].end + 0.2, 0.4);
    text(ctx, 'Follow करें: The 7% Club', 540, 1420, { size: 70, c: GREEN, alpha: clamp(k * 2), scale: lerp(0.7, 1, k) });
  }
}

const SCENES = [[0, hook], [S(1) - 0.15, monthly], [S(2) - 0.15, bars], [S(5) - 0.15, curve], [S(8) - 0.15, caveat], [S(9) - 0.15, ending]];

// captions from words (display "SIP" as written)
const CUES = (() => { const cues = []; let cur = [];
  const flush = () => { if (cur.length) { cues.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map(w => w.text).join(' ') }); cur = []; } };
  for (const w of WORDS) { cur.push(w); const tt = cur.map(x => x.text).join(' '); if (/[.?!:,।]$/.test(w.text) || tt.length > 22) flush(); }
  flush(); cues.forEach((c, i) => { const nx = cues[i + 1]; c.end = Math.min(nx ? nx.start - 0.02 : c.end + 0.8, c.end + 0.6); }); return cues; })();

function drawFrame(ctx, t) {
  paper(ctx);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  const [t0, fn] = SCENES[idx];
  const k = idx ? ss((t - t0) / 0.18) : 1;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30); fn(ctx, t); ctx.restore();
  if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
  if (t > SEG[9].end + 0.6) text(ctx, 'सिर्फ़ जानकारी के लिए। निवेश सलाह नहीं।', 540, 1490, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, SEG[9].end + 0.6, 0.3) });
  const c = CUES.find(c => t >= c.start - 0.05 && t <= c.end);
  if (c) text(ctx, c.text, 540, 1565, { size: 76, c: '#2b2b2b', weight: 'bold' });
}

const out = process.argv[2] || 'picture.mp4';
const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
if (process.argv.includes('--stills')) {
  for (const t of process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${out}-${t.toFixed(2)}.png`, canvas.toBuffer('image/png')); }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
}
