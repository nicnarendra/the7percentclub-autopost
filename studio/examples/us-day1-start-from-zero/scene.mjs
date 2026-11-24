// Long-form 16:9: "If I had to start investing from $0 in 2026" (B1 line-art)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createCanvas } = require('@napi-rs/canvas');
const R = await import('../../lib/draw.mjs');
const { fig, text, underline, strokePath, circlePts, box, coinStack, writeText, ramp, pop, ss, lerp, clamp, fillPoly, card, checkMark, crossMark, marks, sweat, line, mini, chartDown } = R;

const W = 1920, H = 1080, FPS = 30, LEAD = 0.4;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', YEL = '#f3d35b', NAVY = '#27406b', GREY = '#9aa0a6', PAPER = '#FDFDFC';
const SEG = JSON.parse(fs.readFileSync(new URL('./segments.json', import.meta.url))).map(s => ({ ...s, start: s.start + LEAD, end: s.end + LEAD }));
const WORDS = JSON.parse(fs.readFileSync(new URL('./words.json', import.meta.url))).map(w => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
const END = SEG[SEG.length - 1].end + 2.5;
const S = i => SEG[i].start;
const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && o.text.toLowerCase().replace(/[^a-z0-9$]/g, '').startsWith(w.toLowerCase())); return x ? x.start : SEG[i].start; };

function paper(ctx) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(76,90,105,.035)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 60; x < W; x += 60) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
  for (let y = 60; y < H; y += 60) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  ctx.stroke();
}
const STEPS = ['Find your number', 'Safety net', 'Kill high-interest debt', 'Free 401(k) money', 'Roth IRA', 'Buy the whole market', 'Automate & wait'];
function header(ctx, n, t0, t) { // step badge + progress tracker
  const k = pop(t, t0, 0.35);
  ctx.save(); ctx.translate(150, 110); ctx.scale(k, k);
  fillPoly(ctx, circlePts(0, 0, 58, 58, 24), '#d9ecdd', 500 + n, 1.4); strokePath(ctx, circlePts(0, 0, 58), { w: 5, seed: 510 + n });
  text(ctx, String(n), 0, 28, { size: 80 }); ctx.restore();
  writeText(ctx, STEPS[n - 1].toUpperCase(), 240, 135, t0 + 0.15, t, { size: 76, align: 'left', dur: 0.5 });
  for (let i = 0; i < 7; i++) { const x = 1330 + i * 78, done = i < n - 1, cur = i === n - 1;
    ctx.save(); ctx.fillStyle = done ? GREEN : cur ? YEL : '#ececec'; ctx.beginPath(); ctx.arc(x, 110, 24, 0, 7); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(x, 110, 24, 24, 16), { w: 3, seed: 520 + i }); text(ctx, String(i + 1), x, 122, { size: 34, c: done ? '#fff' : INK }); }
}
function stamp(ctx, s, x, y, k, c = RED, size = 70, rot = -0.07) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.font = `bold ${size}px Hand`; const w = ctx.measureText(s).width + 60;
  strokePath(ctx, [[-w / 2, -size * 0.85], [w / 2, -size * 0.85], [w / 2, size * 0.45], [-w / 2, size * 0.45]], { w: 6, c, seed: 600 + s.length, close: true });
  text(ctx, s, 0, size * 0.2, { size, c }); ctx.restore();
}
const groundLine = (ctx, y = 940) => strokePath(ctx, [[100, y], [1820, y]], { w: 4, c: '#cfcac0', seed: 9 });

// ---------------- scenes ----------------
function hook(ctx, t) {
  // seg 0: $0
  const k0 = pop(t, 0.1, 0.4);
  text(ctx, '$0', 520, 470, { size: 300, c: RED, alpha: clamp(k0 * 2), scale: lerp(0.6, 1, k0), rot: -0.05 });
  writeText(ctx, 'STARTING FROM ZERO IN 2026', 960, 160, at(0, 'had'), t, { size: 84, dur: 0.6 });
  const f = fig(ctx, { x: 1180, y: 760, s: 1.5, seed: 1, t, mood: t < S(1) ? 'worried' : t < S(2) ? 'smug' : t < S(3) ? 'shock' : 'grin', tilt: 6,
    arms: t > S(3) ? [[-150, -175], [150, 175]] : [[-35, -15], [35, 15]], legs: [[-16, -10], [16, 10]] });
  if (t < S(1)) { for (const sx of [-1, 1]) { const px = 1180 + sx * 50, py = 745; fillPoly(ctx, [[px - 20, py], [px + 20, py], [px + 12, py + 40], [px - 12, py + 40]], '#fff', 30 + sx); strokePath(ctx, [[px - 20, py], [px + 20, py], [px + 12, py + 40], [px - 12, py + 40]], { w: 4, close: true, seed: 32 + sx }); } }
  // seg 1: no tips / no crypto / the order
  if (t > S(1) && t < S(3)) {
    [['STOCK TIPS', at(1, 'stock')], ['CRYPTO', at(1, 'crypto')]].forEach(([s, t0], i) => {
      const k = pop(t, t0, 0.3); if (k <= 0) return; ctx.save(); ctx.translate(1580, 330 + i * 190); ctx.scale(k, k);
      card(ctx, -170, -70, 340, 130, '#fff', 40 + i); text(ctx, s, 0, 18, { size: 54 }); ctx.restore();
      crossMark(ctx, 1580, 325 + i * 190, ramp(t, t0 + 0.3, 0.25), 2.2, 44 + i); });
    const k = pop(t, at(1, 'order'), 0.35); if (k > 0) { ctx.save(); ctx.translate(1580, 720); ctx.scale(k, k); card(ctx, -190, -70, 380, 130, '#d9ecdd', 46); text(ctx, 'THE RIGHT ORDER', 0, 18, { size: 50, c: GREEN }); ctx.restore(); }
  }
  if (t > S(2) && t < S(3)) stamp(ctx, 'WRONG ORDER = BROKE', 960, 1010, pop(t, at(2, 'broke') - 0.2, 0.35), RED, 64, 0);
  if (t > S(3)) for (let i = 0; i < 7; i++) { const k = pop(t, S(3) + i * 0.12, 0.3); if (k <= 0) continue;
    const x = 260 + i * 230; ctx.save(); ctx.translate(x, 980); ctx.scale(k, k); fillPoly(ctx, circlePts(0, 0, 50, 50, 20), YEL, 60 + i, 1.2); strokePath(ctx, circlePts(0, 0, 50), { w: 4, seed: 70 + i }); text(ctx, String(i + 1), 0, 24, { size: 64 }); ctx.restore(); }
}

function step1(ctx, t) {
  header(ctx, 1, S(4), t);
  groundLine(ctx);
  // income vs bills bars
  const kb = ramp(t, S(5), 0.6);
  if (kb > 0) {
    box(ctx, 300, 900 - 520 * kb, 170, 520 * kb, { fill: '#9fd6b2', lw: 4, seed: 101 }); text(ctx, 'INCOME', 385, 990, { size: 50 });
    box(ctx, 560, 900 - 400 * kb, 170, 400 * kb, { fill: '#f6b8ad', lw: 4, seed: 102 }); text(ctx, 'BILLS', 645, 990, { size: 50 });
    if (t > at(5, 'left')) { strokePath(ctx, [[560, 380], [730, 380]], { w: 4, c: NAVY, seed: 103 }); text(ctx, '?', 645, 460, { size: 110, c: NAVY, alpha: ramp(t, at(5, 'left'), 0.3) }); }
    if (t > S(8) && t < S(9)) { const k = pop(t, S(8) + 0.2, 0.4); ctx.save(); ctx.globalAlpha = k; fillPoly(ctx, [[560, 380], [730, 380], [730, 500], [560, 500]], 'rgba(243,211,91,.6)', 104, 1); ctx.restore();
      writeText(ctx, 'YOUR INVESTING ENGINE', 840, 450, S(8) + 0.3, t, { size: 64, c: GREEN, align: 'left' });
      strokePath(ctx, [[830, 440], [745, 440]], { w: 5, c: GREEN, seed: 105, prog: ramp(t, S(8) + 0.4) }); }
  }
  // 30-day tracker
  if (t > S(6) && t < S(8)) {
    const x0 = 1080, y0 = 300;
    box(ctx, x0, y0, 620, 360, { fill: '#fff', lw: 4, seed: 110 }); text(ctx, '30 DAYS', x0 + 310, y0 - 20, { size: 56 });
    const n = Math.floor(clamp((t - S(6)) / 4) * 30);
    for (let d = 0; d < 30; d++) { const cx = x0 + 52 + (d % 6) * 103, cy = y0 + 58 + Math.floor(d / 6) * 68; if (d < n) checkMark(ctx, cx, cy, 1, 0.8, 120 + d); else text(ctx, String(d + 1), cx, cy + 14, { size: 32, c: GREY }); }
    ['rent', 'food', 'subscriptions'].forEach((s, i) => text(ctx, s, x0 + 110 + i * 200, y0 + 430, { size: 44, c: NAVY, alpha: ramp(t, at(6, s) || S(6) + 1 + i * 0.4, 0.3) }));
    if (t > S(7)) { stamp(ctx, '+ A FEW HUNDRED $ / MONTH', x0 + 310, y0 + 560, pop(t, at(7, 'few'), 0.35), GREEN, 56); }
  }
  // pay yourself first
  if (t > S(9)) {
    const k = ramp(t, S(9), 0.4); ctx.save(); ctx.globalAlpha = k;
    const x0 = 1150, y = 460;
    box(ctx, x0 - 120, y - 100, 240, 140, { fill: '#e9f5ee', lw: 4, seed: 130 }); text(ctx, 'PAYDAY', x0, y - 10, { size: 56 });
    strokePath(ctx, [[x0 + 120, y - 40], [x0 + 300, y - 160]], { w: 6, c: GREEN, seed: 131, prog: ramp(t, at(9, 'first')) });
    text(ctx, '1. INVEST', x0 + 420, y - 170, { size: 56, c: GREEN, alpha: ramp(t, at(9, 'first') + 0.2) });
    strokePath(ctx, [[x0 + 120, y + 10], [x0 + 300, y + 120]], { w: 6, c: GREY, seed: 132, prog: ramp(t, at(9, 'move')) });
    text(ctx, '2. BILLS & SPENDING', x0 + 480, y + 150, { size: 50, c: '#666', alpha: ramp(t, at(9, 'move') + 0.2) });
    ctx.restore();
    if (t > S(10)) { // savings-rate meter
      const mx = 1250, my = 830; strokePath(ctx, [[mx - 300, my], [mx + 300, my]], { w: 10, c: '#ddd', seed: 140 });
      const p = t < at(10, 'impossible') ? 1 : 0.07 + 0.25 * clamp((t - at(10, 'raise')) / 2.5);
      strokePath(ctx, [[mx - 300, my], [mx - 300 + 600 * p, my]], { w: 12, c: GREEN, seed: 141 });
      text(ctx, t < at(10, 'impossible') ? 'TARGET: 15% OF INCOME' : 'START 1% → RAISE IT'.replace('→', '+'), mx, my - 40, { size: 50, c: NAVY });
    }
  }
  fig(ctx, { x: 820, y: 800, s: 1.1, seed: 150, t, mood: t > S(8) ? 'grin' : 'neutral', look: -1, tilt: -4, arms: [[-120, -160], [30, 15]], legs: [[-14, -10], [14, 10]], hair: true });
}

function step2(ctx, t) {
  header(ctx, 2, S(11), t);
  groundLine(ctx);
  // jar filling 3-6 months
  const jx = 1450, jy = 900;
  strokePath(ctx, [[jx - 170, jy - 480], [jx - 170, jy], [jx + 170, jy], [jx + 170, jy - 480]], { w: 6, seed: 201 });
  const months = t < S(16) ? clamp((t - S(12)) / 3) * 6 : 1;
  for (let m = 0; m < 6; m++) { const fk = clamp(months - m); if (fk <= 0) continue; fillPoly(ctx, [[jx - 160, jy - 80 * m - 5], [jx + 160, jy - 80 * m - 5], [jx + 160, jy - 80 * m - 5 - 72 * fk], [jx - 160, jy - 80 * m - 5 - 72 * fk]], m < 3 ? '#9fd6b2' : '#c9e8d3', 210 + m, 0.8); text(ctx, `month ${m + 1}`, jx, jy - 80 * m - 30, { size: 34, c: '#2c5', alpha: fk }); }
  text(ctx, 'HIGH-YIELD SAVINGS', jx, jy - 520, { size: 52, c: NAVY, alpha: ramp(t, at(12, 'high')) });
  text(ctx, '3–6 MONTHS', jx, jy + 70, { size: 60, alpha: ramp(t, S(12)) });
  // umbrella stickman + rain of problems
  const f = fig(ctx, { x: 620, y: 860, s: 1.3, seed: 220, t, mood: t > S(14) && t < S(15) ? 'shock' : 'smug', arms: [[-160, -170], [40, 20]], legs: [[-14, -10], [14, 10]] });
  const [ux, uy] = f.hands[0];
  if (t > S(12)) { strokePath(ctx, [[ux, uy + 40], [ux, uy - 150]], { w: 5, seed: 221 }); const p = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; p.push([ux + Math.cos(a) * 170, uy - 150 + Math.sin(a) * 90]); }
    fillPoly(ctx, p, '#f6d6a0', 222, 1); strokePath(ctx, p, { w: 5, seed: 223 }); }
  if (t > S(13) && t < S(15)) ['CAR BREAKS DOWN', 'JOB DISAPPEARS'].forEach((s, i) => { const t0 = at(13, i ? 'job' : 'car'); const k = ramp(t, t0 - 0.1, 0.5); if (k <= 0) return;
    const y = lerp(230, 330 + i * 120, ss(k)); card(ctx, 880, y - 40, 300, 80, '#fde9a8', 230 + i); text(ctx, s, 1030, y + 12, { size: 36 }); });
  if (t > S(14) && t < S(15)) { chartDown(ctx, 880, 560, 300, 230, ramp(t, S(14), 1), 240); text(ctx, 'forced to sell', 1030, 850, { size: 46, c: RED }); }
  if (t > S(15)) stamp(ctx, "INSURANCE, NOT AN INVESTMENT", 820, 1010, pop(t, at(15, 'insurance') - 0.2, 0.35), NAVY, 52, 0);
  if (t > S(16)) stamp(ctx, 'START WITH 1 MONTH', 1030, 560, pop(t, S(16) + 0.3, 0.35), GREEN, 60);
}

function step3(ctx, t) {
  header(ctx, 3, S(17), t);
  groundLine(ctx);
  // credit card monster
  const k = pop(t, S(18), 0.4);
  if (t < S(21)) {
    ctx.save(); ctx.translate(560, 560); ctx.scale(k, k); ctx.rotate(Math.sin(t * 2) * 0.03);
    box(ctx, -260, -160, 520, 320, { fill: '#cfe0f5', lw: 6, seed: 301 }); box(ctx, -200, -100, 90, 60, { fill: YEL, lw: 4, seed: 302 });
    text(ctx, '21% APR', 60, -40, { size: 84, c: RED });
    strokePath(ctx, [[-200, 60], [-160, 120], [-120, 60], [-80, 120], [-40, 60], [0, 120], [40, 60], [80, 120], [120, 60], [160, 120], [200, 60]], { w: 5, c: INK, seed: 303 });
    ctx.restore();
    text(ctx, 'average US credit card (Federal Reserve)', 560, 820, { size: 38, c: GREY, weight: 'normal', alpha: ramp(t, S(18) + 0.5) });
    if (t > S(19)) { text(ctx, 'stock market?', 1350, 420, { size: 56, c: '#666', alpha: ramp(t, S(19)) }); text(ctx, 'not guaranteed', 1350, 490, { size: 46, c: GREY, weight: 'normal', alpha: ramp(t, S(19) + 0.4) }); }
    if (t > S(20)) stamp(ctx, 'PAYOFF = GUARANTEED 21%', 1350, 700, pop(t, at(20, 'guaranteed') - 0.2, 0.35), GREEN, 58);
  } else {
    // avalanche vs snowball
    const debts = [['Card A', 24, 3000], ['Card B', 19, 800], ['Car loan', 7, 9000]];
    const col = (x0, title, order, sub, t0, good) => {
      const kk = ramp(t, t0, 0.4); if (kk <= 0) return; ctx.save(); ctx.globalAlpha = kk;
      text(ctx, title, x0, 300, { size: 54, c: good ? GREEN : NAVY }); text(ctx, sub, x0, 360, { size: 40, c: '#666', weight: 'normal' });
      order.forEach((d, i) => { const y = 430 + i * 140; card(ctx, x0 - 230, y, 460, 110, i === 0 ? '#fde9a8' : '#fff', 320 + i + (good ? 10 : 0)); text(ctx, `${i + 1}. ${d[0]}: ${d[1]}% · $${d[2].toLocaleString('en-US')}`, x0, y + 70, { size: 40 }); });
      ctx.restore(); };
    col(560, 'HIGHEST RATE FIRST', debts, 'saves the most money', S(21), true);
    col(1360, 'SMALLEST BALANCE FIRST', [debts[1], debts[0], debts[2]], 'quick wins, more motivation', S(23), false);
    if (t > at(23, 'best')) stamp(ctx, 'BEST PLAN = ONE YOU STICK WITH', 960, 1010, pop(t, at(23, 'best'), 0.35), INK, 50, 0);
  }
}

function step4(ctx, t) {
  header(ctx, 4, S(24), t);
  groundLine(ctx);
  const f = fig(ctx, { x: 360, y: 800, s: 1.4, seed: 401, t, mood: t > S(27) ? 'grin' : 'happy', arms: t > S(27) ? [[-150, -175], [150, 175]] : [[-35, -15], [35, 15]], legs: [[-14, -10], [14, 10]] });
  if (t > S(27)) marks(ctx, f.head[0] + 50, f.head[1] - 40, 1.2, 402);
  text(ctx, '401(k) MATCH', 1100, 300, { size: 80, c: NAVY, alpha: ramp(t, at(25, '401k') || S(25)) });
  if (t > S(26)) {
    text(ctx, '$60,000 salary', 1100, 380, { size: 50, c: '#666', alpha: ramp(t, S(26)) });
    const y = 900;
    const ky = ramp(t, at(26, 'put'), 0.6), ke = ramp(t, at(26, 'employer'), 0.6);
    box(ctx, 780, y - 360 * ky, 220, Math.max(1, 360 * ky), { fill: '#cfe0f5', lw: 4, seed: 410 }); text(ctx, 'YOU: 6%', 890, y + 60, { size: 48 }); if (ky > 0.5) text(ctx, '$3,600', 890, y - 360 * ky - 20, { size: 50, c: NAVY });
    box(ctx, 1200, y - 180 * ke, 220, Math.max(1, 180 * ke), { fill: '#9fd6b2', lw: 4, seed: 411 }); text(ctx, 'EMPLOYER', 1310, y + 60, { size: 48 }); if (ke > 0.5) text(ctx, '+$1,800', 1310, y - 180 * ke - 20, { size: 56, c: GREEN });
  }
  if (t > S(27)) stamp(ctx, 'FREE MONEY', 1640, 380, pop(t, S(27) + 0.3, 0.35), GREEN, 70);
  if (t > S(28)) stamp(ctx, '+50% INSTANTLY', 1640, 540, pop(t, at(28, 'fifty'), 0.35), NAVY, 60, 0.05);
}

function step5(ctx, t) {
  header(ctx, 5, S(29), t);
  groundLine(ctx);
  // Roth box with plant
  const bx = 600, by = 900, k = ramp(t, S(29) + 0.3, 0.5);
  ctx.save(); ctx.globalAlpha = k;
  box(ctx, bx - 260, by - 360, 520, 360, { fill: '#fff8de', lw: 6, seed: 501 }); text(ctx, 'ROTH IRA', bx, by - 390, { size: 72, c: NAVY });
  const g = clamp((t - S(31)) / 6);
  strokePath(ctx, [[bx, by - 10], [bx, by - 30 - 260 * g]], { w: 7, c: GREEN, seed: 502 });
  for (let i = 0; i < Math.floor(g * 6); i++) { const yy = by - 60 - i * 42, s = i % 2 ? 1 : -1; fillPoly(ctx, [[bx, yy], [bx + s * 70, yy - 30], [bx + s * 20, yy - 8]], '#7cc59a', 510 + i, 1); }
  ctx.restore();
  if (t > S(30)) stamp(ctx, '$7,500 / YEAR', 1300, 330, pop(t, at(30, 'seven') || S(30) + 0.5, 0.35), GREEN, 72, 0);
  if (t > S(30)) text(ctx, '2026 IRA limit (IRS)', 1300, 410, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, S(30) + 1) });
  if (t > S(31)) { const steps = [['PAY TAX NOW', at(31, 'pay')], ['GROWS TAX-FREE', at(31, 'grows')], ['TAKE OUT TAX-FREE', at(31, 'retirement')]];
    steps.forEach(([s, t0], i) => { const kk = pop(t, t0, 0.3); if (kk <= 0) return; ctx.save(); ctx.translate(1300, 520 + i * 120); ctx.scale(kk, kk); card(ctx, -260, -45, 520, 90, i ? '#d9ecdd' : '#f9d6cf', 520 + i); text(ctx, s, 0, 18, { size: 48 }); ctx.restore(); }); }
  if (t > S(33) && t < S(34)) text(ctx, '⚠ income limits apply'.replace('⚠ ', ''), 1300, 920, { size: 46, c: RED, alpha: ramp(t, S(33)) });
  if (t > S(34)) text(ctx, 'Or: Traditional IRA = tax break today', 1300, 920, { size: 46, c: NAVY, alpha: ramp(t, S(34)) });
}

function step6(ctx, t) {
  header(ctx, 6, S(35), t);
  groundLine(ctx);
  if (t < S(37)) { // one stock vs basket
    const k1 = pop(t, at(36, 'one'), 0.35), k2 = pop(t, at(36, 'whole'), 0.35);
    if (k1 > 0) { ctx.save(); ctx.translate(560, 560); ctx.scale(k1, k1); ctx.beginPath(); ctx.ellipse(0, 0, 90, 120, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); strokePath(ctx, circlePts(0, 0, 90, 120), { w: 5, seed: 601 }); text(ctx, 'ONE STOCK', 0, 200, { size: 54 }); ctx.restore(); crossMark(ctx, 560, 560, ramp(t, at(36, 'buy') - 0.2, 0.3), 3, 602); }
    if (k2 > 0) { ctx.save(); ctx.translate(1300, 600); ctx.scale(k2, k2); strokePath(ctx, [[-260, -60], [-200, 140], [200, 140], [260, -60]], { w: 6, seed: 603, close: true }); for (let i = 0; i < 12; i++) mini(ctx, -200 + (i % 6) * 80, -60 + Math.floor(i / 6) * 0 - (i >= 6 ? 0 : 0) + (i >= 6 ? 20 : -40), 0.3, INK, 'happy', 610 + i, t); text(ctx, 'THE WHOLE MARKET', 0, 220, { size: 54, c: GREEN }); ctx.restore(); }
  } else if (t < S(39)) { // index fund: thousands of companies
    text(ctx, 'INDEX FUND', 960, 280, { size: 80, c: NAVY });
    for (let i = 0; i < 40; i++) { const x = 360 + (i % 10) * 135, y = 430 + Math.floor(i / 10) * 135; const kk = pop(t, S(37) + 0.5 + i * 0.04, 0.25); if (kk <= 0) continue;
      const failing = i === 13 && t > S(38); ctx.save(); ctx.translate(x, y); ctx.scale(kk, kk); ctx.translate(-x, -y);
      mini(ctx, x, y + (failing ? 40 * ramp(t, S(38), 0.6) : -Math.max(0, t - at(38, 'economy')) * 8), 0.32, failing ? GREY : INK, failing ? 'sad' : 'happy', 650 + i, t); ctx.restore(); }
    text(ctx, '1 click = 100s or 1,000s of companies', 960, 990, { size: 48, alpha: ramp(t, S(37) + 1) });
  } else if (t < S(41)) { // fees + target date
    text(ctx, 'EXPENSE RATIO', 560, 300, { size: 64, c: NAVY });
    const mx = 560, my = 620; const p = []; for (let i = 0; i <= 30; i++) { const a = Math.PI + i / 30 * Math.PI; p.push([mx + Math.cos(a) * 260, my + Math.sin(a) * 260]); }
    strokePath(ctx, p, { w: 8, seed: 660 }); const na = Math.PI + 0.08 * Math.PI * ramp(t, S(39) + 0.5, 0.8) + 0.02;
    strokePath(ctx, [[mx, my], [mx + Math.cos(na) * 220, my + Math.sin(na) * 220]], { w: 8, c: GREEN, seed: 661 });
    text(ctx, 'tiny: a fraction of 1%', mx, my + 100, { size: 50, c: GREEN });
    if (t > S(40)) { const k = pop(t, S(40), 0.4); ctx.save(); ctx.translate(1380, 600); ctx.scale(k, k); card(ctx, -300, -220, 600, 440, '#fff8de', 662);
      text(ctx, 'TARGET-DATE FUND', 0, -140, { size: 54, c: NAVY }); text(ctx, 'picks the mix for you', 0, -60, { size: 44, weight: 'normal' });
      const pr = clamp((t - at(40, 'adjusts')) / 2); text(ctx, `stocks ${Math.round(90 - 40 * pr)}%  ·  bonds ${Math.round(10 + 40 * pr)}%`, 0, 40, { size: 46 }); text(ctx, pr > 0.5 ? 'as you get older →'.replace(' →', '') : 'young', 0, 130, { size: 42, c: GREY }); ctx.restore(); }
  } else { // haystack
    const hx = 960, hy = 860, k = ramp(t, S(41), 0.5);
    ctx.save(); ctx.globalAlpha = k; const p = [[hx - 380, hy], [hx - 300, hy - 260], [hx - 120, hy - 400], [hx + 120, hy - 410], [hx + 300, hy - 260], [hx + 380, hy]];
    fillPoly(ctx, p, '#f3d98a', 680, 4); strokePath(ctx, p, { w: 6, seed: 681, close: true });
    for (let i = 0; i < 30; i++) line(ctx, hx - 300 + (i * 23) % 600, hy - 30 - (i * 47) % 330, hx - 280 + (i * 23) % 600, hy - 60 - (i * 47) % 330, { w: 3, c: '#b89b4a', seed: 690 + i }); ctx.restore();
    writeText(ctx, "DON'T HUNT FOR THE NEEDLE", 960, 300, at(41, 'instead'), t, { size: 70, c: RED });
    writeText(ctx, 'BUY THE HAYSTACK', 960, 1000, at(41, 'buy'), t, { size: 76, c: GREEN });
  }
}

const BARS = [['10 YRS', 60, 92, 45], ['20 YRS', 120, 296, 46], ['30 YRS', 180, 750, 47]];
function step7(ctx, t) {
  header(ctx, 7, S(42), t);
  if (t < S(44)) { // automate
    const k = ramp(t, S(43), 0.4); ctx.save(); ctx.globalAlpha = k;
    card(ctx, 360, 340, 460, 360, '#fff', 701); text(ctx, 'PAYDAY', 590, 420, { size: 60, c: NAVY }); text(ctx, 'every 2 weeks', 590, 490, { size: 44, weight: 'normal' });
    const ph = ((t - S(43)) % 1.2) / 1.2; coinStack(ctx, lerp(840, 1320, ss(ph)), 560 - Math.sin(ph * Math.PI) * 120, 1, 1.6, 702);
    strokePath(ctx, [[840, 600], [1320, 600]], { w: 5, c: GREEN, seed: 703 }); text(ctx, 'AUTO', 1080, 650, { size: 52, c: GREEN });
    card(ctx, 1340, 340, 460, 360, '#e9f5ee', 704); text(ctx, 'INVESTMENTS', 1570, 420, { size: 56, c: GREEN }); ctx.restore();
    fig(ctx, { x: 1070, y: 960, s: 0.8, seed: 705, t, mood: 'smug', arms: [[-40, -60], [40, 60]], legs: [[-14, -10], [14, 10]] }); text(ctx, 'zero willpower needed', 1500, 900, { size: 44, c: GREY, alpha: ramp(t, at(43, 'without')) });
  } else if (t < S(48)) { // bars
    stamp(ctx, '$500 / MONTH', 560, 330, pop(t, S(44), 0.35), NAVY, 70, 0);
    text(ctx, 'assumes 8% a year', 560, 400, { size: 40, c: GREY, weight: 'normal' });
    const base = 950, sc = 0.82; strokePath(ctx, [[900, base], [1820, base]], { w: 5, seed: 720 });
    BARS.forEach(([lab, inv, val, si], i) => { if (t < S(si)) return; const x = 1020 + i * 290, ik = ss((t - S(si)) / 0.4), gk = ss((t - S(si) - 0.5) / 1.2);
      box(ctx, x - 90, base - inv * sc * ik, 80, Math.max(1, inv * sc * ik), { fill: '#d7d9dc', lw: 3.5, seed: 730 + i });
      if (gk > 0) box(ctx, x + 5, base - val * sc * gk, 95, Math.max(1, val * sc * gk), { fill: '#9fd6b2', lw: 3.5, seed: 740 + i });
      text(ctx, lab, x, base + 55, { size: 46 }); text(ctx, `$${inv}K in`, x - 50, base - inv * sc * ik - 16, { size: 34, c: '#666' });
      if (gk > 0.3) text(ctx, `≈ $${val}K`, x + 52, base - val * sc * gk - 22, { size: 48, c: GREEN }); });
    if (t > S(47)) text(ctx, 'from $180K of your own money', 560, 560, { size: 50, c: GREEN, alpha: ramp(t, at(47, 'from')) });
    fig(ctx, { x: 560, y: 900, s: 0.9, seed: 750, t, mood: t > S(47) ? 'shock' : 'smug', arms: t > S(47) ? [[-150, -200], [150, 200]] : [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
  } else {
    writeText(ctx, 'COMPOUNDING', 960, 330, S(48), t, { size: 110, c: GREEN, dur: 0.5 });
    writeText(ctx, 'returns earn their own returns', 960, 430, at(48, 'your'), t, { size: 56, weight: 'normal' });
    if (t > S(49)) { const k = pop(t, S(49), 0.35); ctx.save(); ctx.translate(960, 640); ctx.scale(k, k); card(ctx, -520, -110, 1040, 220, '#fff8de', 760);
      text(ctx, '8% = an assumption, not a promise', 0, -10, { size: 60, c: NAVY }); text(ctx, 'some years are negative', 0, 70, { size: 46, c: RED, alpha: ramp(t, at(49, 'some')) }); ctx.restore(); }
    if (t > S(50)) stamp(ctx, 'TIME IN THE MARKET', 960, 940, pop(t, S(50) + 0.3, 0.35), GREEN, 64, 0);
  }
}

function crash(ctx, t) {
  writeText(ctx, 'BUT WHAT IF IT CRASHES?', 960, 150, S(51), t, { size: 90, c: RED, dur: 0.6 });
  const x0 = 260, y0 = 900, w = 1400;
  const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; const dip = Math.exp(-Math.pow((u - 0.45) * 7, 2)) * 300; pts.push([x0 + u * w, y0 - 120 - u * 380 + dip]); }
  strokePath(ctx, [[x0, 300], [x0, y0], [x0 + w + 20, y0]], { w: 5, seed: 801 });
  strokePath(ctx, pts, { w: 8, c: NAVY, seed: 802, prog: ramp(t, S(52), 2.5), amp: 0.4 });
  if (t > S(53)) { // monthly buys: more shares at the dip
    for (let i = 0; i < 8; i++) { const u = 0.1 + i * 0.1, j = Math.round(u * 60); const [px, py] = pts[j]; const k = pop(t, S(53) + 0.4 + i * 0.35, 0.3); if (k <= 0) continue;
      const n = Math.round(2 + Math.exp(-Math.pow((u - 0.45) * 7, 2)) * 4); ctx.save(); ctx.translate(px, py - 50); ctx.scale(k, k); coinStack(ctx, 0, 0, n, 0.7, 810 + i); ctx.restore(); }
    text(ctx, 'same $ each month = more shares when prices drop', 960, 990, { size: 46, alpha: ramp(t, S(53) + 1) });
  }
  if (t > S(54)) stamp(ctx, 'DOLLAR-COST AVERAGING', 1250, 330, pop(t, at(54, 'dollar'), 0.35), GREEN, 58);
  if (t > S(55)) { const [px, py] = pts[27]; fig(ctx, { x: px - 120, y: py + 40, s: 0.7, seed: 830, t, mood: 'shock', arms: [[-150, -200], [150, 200]], legs: [[-14, -10], [14, 10]] });
    stamp(ctx, "DON'T PANIC-SELL", px + 260, py + 120, pop(t, at(55, 'panicking'), 0.35), RED, 54); }
}

function notdo(ctx, t) {
  writeText(ctx, "WHAT I WOULDN'T DO", 960, 160, S(56), t, { size: 92, dur: 0.5 });
  const cards = [['DAY TRADING', '97% of 300-day traders lost money*', S(57), RED], ['MEME COINS & TIPS', 'from strangers online', S(59), RED], ['WAITING FOR "PERFECT"', 'it never comes', S(60), RED]];
  cards.forEach(([h, sub, t0, c], i) => { const k = pop(t, t0, 0.35); if (k <= 0) return; const x = 380 + i * 580;
    ctx.save(); ctx.translate(x, 560); ctx.scale(k, k); card(ctx, -250, -230, 500, 460, '#fff', 900 + i); text(ctx, h, 0, -120, { size: 48 }); text(ctx, sub, 0, 150, { size: 34, c: '#666', weight: 'normal' }); ctx.restore();
    crossMark(ctx, x, 540, ramp(t, t0 + 0.35, 0.3), 3.2, 910 + i); });
  if (t > S(58)) text(ctx, '*Chague, De-Losso & Giovannetti, "Day Trading for a Living?" (Brazil futures, 2013–2015)', 960, 1000, { size: 30, c: GREY, weight: 'normal', alpha: ramp(t, S(58)) });
}

function recap(ctx, t) {
  writeText(ctx, 'THE WHOLE PLAN', 960, 140, S(61), t, { size: 90, dur: 0.5 });
  const keys = ['find', 'build', 'kill', 'grab', 'open', 'buy', 'automate'];
  STEPS.forEach((s, i) => { const t0 = at(62, keys[i]); const k = ramp(t, t0 - 0.15, 0.25); const y = 250 + i * 96;
    if (k <= 0 && t < S(62)) return; ctx.save(); ctx.globalAlpha = Math.max(0.25, k);
    box(ctx, 560, y - 30, 60, 60, { fill: '#fff', lw: 4, seed: 950 + i }); checkMark(ctx, 590, y, ramp(t, t0, 0.25), 1, 960 + i); text(ctx, `${i + 1}. ${s}`, 650, y + 20, { size: 54, align: 'left' }); ctx.restore(); });
  if (t > S(63)) stamp(ctx, 'BORING = WEALTH', 1520, 520, pop(t, at(63, 'boring') + 0.4, 0.35), GREEN, 64);
  if (t > S(64)) { const k = pop(t, S(64), 0.35); ctx.save(); ctx.translate(1500, 820); ctx.scale(k, k); card(ctx, -300, -80, 600, 160, '#e9f5ee', 970); text(ctx, 'Which step are you on?', 0, 15, { size: 52 }); ctx.restore(); }
  fig(ctx, { x: 300, y: 860, s: 1.1, seed: 980, t, mood: 'grin', arms: [[-40, -15], [130, 160]], legs: [[-14, -10], [14, 10]] });
  if (t > S(65)) text(ctx, 'Education only. Not financial advice.', 960, 1040, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, S(65)) });
}

const CH = [[0, hook, 'Intro'], [S(4), step1, 'Step 1: Find your number'], [S(11), step2, 'Step 2: Build a safety net'], [S(17), step3, 'Step 3: Kill high-interest debt'], [S(24), step4, 'Step 4: Grab the free 401(k) match'], [S(29), step5, 'Step 5: Open a Roth IRA'], [S(35), step6, 'Step 6: Buy the whole market'], [S(42), step7, 'Step 7: Automate it and wait'], [S(51), crash, 'What if the market crashes?'], [S(56), notdo, "What I wouldn't do"], [S(61), recap, 'The whole plan']];
const SCENES = CH.map(([t0, fn], i) => [i ? t0 - 0.2 : 0, fn]);

function drawFrame(ctx, t) {
  paper(ctx);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  const [t0, fn] = SCENES[idx]; const k = idx ? ss((t - t0) / 0.25) : 1;
  ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * 60, 0); fn(ctx, t); ctx.restore();
  if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
}

if (process.argv.includes('--chapters')) { const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; CH.forEach(([t0, , name], i) => console.log(`${fmt(i ? t0 : 0)} ${name}`)); process.exit(0); }
const out = process.argv[2] || 'picture.mp4';
const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
if (process.argv.includes('--stills')) {
  for (const t of process.argv.slice(process.argv.indexOf('--stills') + 1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${out}-${String(t.toFixed(1)).padStart(6, '0')}.png`, canvas.toBuffer('image/png')); }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
}
