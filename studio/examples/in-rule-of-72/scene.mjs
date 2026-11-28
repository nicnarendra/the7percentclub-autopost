// Hinglish Short: Rule of 72 (PPF 7.1% Q3 FY27 -> ~10y; assumed 12% -> ~6y, 30y ~₹30L exact; assumed 6% inflation -> prices double in ~12y)
import { kit } from '../../lib/kit.mjs';
const K = await kit(import.meta.url, { lead: 0.3 });
const { S, E, at, R } = K;
const { fig, text, writeText, strokePath, circlePts, box, card, fillPoly, coinStack, moneyBag, pop, ramp, ss, lerp, clamp, checkMark, crossMark, line, bubble } = R;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6', PINK = '#f9d6cf', MINT = '#d9ecdd', CREAM = '#fff8de';

function clock(ctx, x, y, r, t, seed, speed = 3) {
  fillPoly(ctx, circlePts(x, y, r, r, 30), CREAM, seed, 0.4); strokePath(ctx, circlePts(x, y, r, r, 30), { w: 6, seed: seed + 1, close: true });
  const a = t * speed; line(ctx, x, y, x + Math.sin(a) * r * 0.7, y - Math.cos(a) * r * 0.7, { w: 6, seed: seed + 2 }); line(ctx, x, y, x + r * 0.4, y, { w: 7, seed: seed + 3 });
}

function hook(ctx, t) { // 0
  text(ctx, 'PAISA DOUBLE', 540, 210, { size: 120, c: NAVY });
  text(ctx, 'KAB HOGA?', 540, 340, { size: 120, c: GREEN, rot: -0.02 });
  // bag splits into two
  const sp = ss(clamp((t - 1.2) / 0.8));
  moneyBag(ctx, 540 - sp * 190, 1150, 3.2, 3); if (sp > 0.02) moneyBag(ctx, 540 + sp * 190, 1150, 3.2 * sp, 4);
  clock(ctx, 540, 640, 90, t, 5, 5);
  const k = pop(t, at(0, '72'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 1330); ctx.rotate(-0.03); ctx.scale(k, k); card(ctx, -260, -75, 520, 130, MINT, 6); text(ctx, 'bas 72 se!', 0, 25, { size: 82, c: GREEN }); ctx.restore(); }
}

function formula(ctx, t) { // 1
  writeText(ctx, 'RULE OF 72', 540, 230, S(1) + 0.05, t, { size: 130, c: NAVY, dur: 0.5 });
  const k1 = pop(t, S(1) + 0.7, 0.4), k2 = pop(t, at(1, 'mil'), 0.4);
  ctx.save(); ctx.translate(540, 720); ctx.rotate(-0.02);
  if (k1 > 0) { ctx.save(); ctx.scale(k1, k1); card(ctx, -400, -200, 800, 400, CREAM, 11);
    text(ctx, '72', -170, -40, { size: 160, c: GREEN }); line(ctx, -280, 10, -60, 10, { w: 8, seed: 12 }); text(ctx, 'return %', -170, 120, { size: 70, c: NAVY });
    if (k2 > 0) { text(ctx, '=', 20, 40, { size: 120, c: INK, alpha: k2 }); text(ctx, 'SAAL', 230, 50, { size: 120, c: RED, scale: lerp(0.5, 1, k2) }); }
    ctx.restore(); }
  ctx.restore();
  fig(ctx, { x: 300, y: 1260, s: 0.85, seed: 13, t, mood: k2 > 0 ? 'grin' : 'neutral', arms: [[-25, -10], [-150, -160]], legs: [[-14, -10], [14, 10]] });
  clock(ctx, 800, 1150, 100, t, 14, 2);
}

function ppf(ctx, t) { // 2
  writeText(ctx, 'PPF: 7.1%', 540, 230, S(2) + 0.05, t, { size: 120, c: NAVY, dur: 0.4 });
  text(ctx, 'abhi ka rate (Oct-Dec 2026)', 540, 330, { size: 50, c: GREY, alpha: ramp(t, S(2) + 0.4) });
  // calculator
  const cx = 540, cy = 780;
  box(ctx, cx - 300, cy - 260, 600, 560, { fill: '#eef1f4', lw: 5, seed: 21 }); box(ctx, cx - 250, cy - 210, 500, 150, { fill: '#fff', lw: 4, seed: 22 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) box(ctx, cx - 250 + c * 128, cy + r * 110, 100, 80, { fill: CREAM, lw: 3, seed: 23 + r * 4 + c });
  const show = t > at(2, 'kareeb') ? '~10 saal' : t > at(2, '72') ? '72 / 7.1' : '7.1%';
  if (show) text(ctx, show, cx, cy - 110, { size: 80, c: show.startsWith('~') ? GREEN : INK });
  const k = pop(t, at(2, 'kareeb'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 1330); ctx.scale(k, k); text(ctx, 'paisa DOUBLE', 0, 0, { size: 84, c: GREEN }); ctx.restore(); }
}

function road(ctx, t) { // 3: ₹1L walks along 10 years -> ₹2L
  writeText(ctx, '₹1 LAKH = ₹2 LAKH', 540, 230, S(3) + 0.05, t, { size: 100, c: GREEN, dur: 0.45 });
  const g = ss(clamp((t - S(3) - 0.3) / 2.6));
  const y0 = 1150; strokePath(ctx, [[100, y0], [980, y0]], { w: 6, seed: 31 });
  for (let i = 0; i <= 10; i += 2) { line(ctx, 140 + i * 78, y0, 140 + i * 78, y0 + 25, { w: 4, seed: 32 + i }); text(ctx, String(i), 140 + i * 78, y0 + 85, { size: 46, c: GREY }); }
  text(ctx, 'saal', 940, y0 + 140, { size: 44, c: GREY });
  const x = 140 + g * 780;
  moneyBag(ctx, x + 70, y0 - 5, lerp(1.6, 3.0, g), 33);
  text(ctx, '₹' + (1 + g).toFixed(1) + 'L', x + 70, y0 - 330, { size: 70, c: GREEN });
  fig(ctx, { x: x - 40, y: y0 - 136 * 0.8, s: 0.8, seed: 34, t, mood: 'happy', arms: [[60, 80], [80, 100]], legs: g < 1 ? [[-20 * Math.sin(t * 9) - 4, -10], [20 * Math.sin(t * 9) + 4, 10]] : [[-14, -10], [14, 10]] });
  text(ctx, '7.1% PPF', 540, 420, { size: 60, c: NAVY });
}

function race(ctx, t) { // 4: PPF 10y vs equity 6y (assumed)
  writeText(ctx, 'EQUITY: 12%?', 540, 230, S(4) + 0.05, t, { size: 110, c: NAVY, dur: 0.4 });
  const k = pop(t, at(4, 'guaranteed'), 0.35);
  if (k > 0) { ctx.save(); ctx.translate(540, 360); ctx.rotate(-0.03); ctx.scale(k, k); card(ctx, -330, -50, 660, 95, PINK, 41); text(ctx, 'maan ke. Guaranteed NAHI', 0, 18, { size: 54, c: RED }); ctx.restore(); }
  const g = clamp((t - S(4) - 0.2) / 4.2);
  const lanes = [{ y: 760, name: 'PPF 7.1%', yrs: 10, c: NAVY }, { y: 1120, name: 'Equity 12%', yrs: 6, c: GREEN }];
  for (const [i, L] of lanes.entries()) {
    strokePath(ctx, [[120, L.y], [960, L.y]], { w: 5, seed: 42 + i }); text(ctx, L.name, 120, L.y + 70, { size: 52, c: L.c, align: 'left' });
    const p = clamp(g * 10 / L.yrs); const x = lerp(160, 900, p);
    fig(ctx, { x, y: L.y - 115, s: 0.85, seed: 44 + i, t, mood: p >= 1 ? 'grin' : 'happy', arms: p >= 1 ? [[-150, -170], [150, 170]] : [[-40, -20], [40, 20]], legs: p < 1 ? [[-25 * Math.sin(t * 10) - 4, -10], [25 * Math.sin(t * 10) + 4, 10]] : [[-14, -10], [14, 10]] });
    strokePath(ctx, [[930, L.y], [930, L.y - 200]], { w: 5, seed: 46 + i }); fillPoly(ctx, [[930, L.y - 200], [1000, L.y - 175], [930, L.y - 150]], L.c, 48 + i, 0.3);
    if (p >= 1) text(ctx, '2x in ~' + L.yrs + ' saal', 640, L.y - 250, { size: 64, c: L.c });
  }
}

function ladder(ctx, t) { // 5-6: doublings over 30 years with camera pulling back
  writeText(ctx, '30 SAAL = ~5 BAAR 2x', 540, 230, S(5) + 0.05, t, { size: 92, c: GREEN, dur: 0.45 });
  const vals = [[0, 1, '₹1L'], [6, 2, '₹2L'], [12, 4, '₹4L'], [18, 8, '₹8L'], [24, 16, '₹16L'], [30, 30, '~₹30L']];
  const cues = [S(5) + 0.3, at(6, '2'), at(6, '4'), at(6, '8'), at(6, '16'), at(6, '₹30')];
  const shown = cues.filter(c => t > c - 0.1).length;
  const maxV = Math.max(2, ...vals.slice(0, Math.max(1, shown)).map(v => v[1]));
  const zm = ss(clamp((t - S(6)) / 5)); const sc = 780 / lerp(4, 32, zm); // px per lakh, camera pulls back
  const base = 1330;
  strokePath(ctx, [[90, base], [990, base]], { w: 5, seed: 51 });
  vals.forEach(([y, v, lab], i) => { const k = ramp(t, cues[i] - 0.1, 0.35); if (k <= 0) return;
    const x = 120 + i * 150, h = Math.max(6, v * sc * k);
    box(ctx, x, base - h, 110, h, { fill: i === 5 ? '#9fd6b2' : MINT, lw: 4, seed: 52 + i });
    text(ctx, lab, x + 55, base - h - 24, { size: i === 5 ? 64 : 48, c: GREEN });
    text(ctx, y + 'y', x + 55, base + 55, { size: 40, c: GREY }); });
  text(ctx, '12%/saal maan ke · rule approx hai', 540, 340, { size: 46, c: GREY, alpha: ramp(t, S(6)) });
}

function inflation(ctx, t) { // 7-8: price tag doubles
  writeText(ctx, 'ULTA BHI CHALTA HAI', 540, 230, S(7) + 0.05, t, { size: 96, c: RED, dur: 0.45 });
  text(ctx, 'mehngai 6%/saal maan ke', 540, 340, { size: 54, c: GREY, alpha: ramp(t, at(7, 'mehngai')) });
  const g = ss(clamp((t - at(8, '12') + 0.2) / 1.4));
  const price = Math.round(100 + 100 * g);
  // shopping bag + tag
  const bx = 360, by = 1180; box(ctx, bx - 150, by - 280, 300, 280, { fill: CREAM, lw: 5, seed: 61 });
  strokePath(ctx, [[bx - 70, by - 280], [bx - 60, by - 360], [bx + 60, by - 360], [bx + 70, by - 280]], { w: 5, seed: 62 });
  text(ctx, 'saamaan', bx, by - 120, { size: 54, c: NAVY });
  const tk = lerp(1, 1.4, g);
  ctx.save(); ctx.translate(760, 760); ctx.rotate(0.12 + Math.sin(t * 2) * 0.03); ctx.scale(tk, tk);
  fillPoly(ctx, [[-130, -70], [110, -70], [160, 0], [110, 70], [-130, 70]], g > 0.5 ? PINK : MINT, 63, 0.3); strokePath(ctx, [[-130, -70], [110, -70], [160, 0], [110, 70], [-130, 70]], { w: 5, seed: 64, close: true });
  text(ctx, '₹' + price, -10, 25, { size: 76, c: g > 0.5 ? RED : GREEN }); ctx.restore();
  text(ctx, t > at(8, '12') ? '12 saal baad' : 'aaj', 760, 1000, { size: 60, c: GREY });
  fig(ctx, { x: 760, y: 1200, s: 0.8, seed: 65, t, mood: g > 0.6 ? 'shock' : 'neutral', look: -1, arms: g > 0.6 ? [[-140, -160], [140, 160]] : [[-25, -10], [25, 10]], legs: [[-14, -10], [14, 10]] });
  clock(ctx, 180, 560, 70, t, 66, 6);
}

function speed(ctx, t) { // 9: speedometer
  writeText(ctx, 'ASLI SAWAAL', 540, 230, S(9) + 0.05, t, { size: 110, c: NAVY, dur: 0.4 });
  const cx = 540, cy = 1000, r = 330;
  const arc = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; arc.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  strokePath(ctx, arc, { w: 8, seed: 71 });
  [['SLOW', 0.15, RED], ['FAST', 0.85, GREEN]].forEach(([s, u, c]) => { const a = Math.PI + u * Math.PI; text(ctx, s, cx + Math.cos(a) * (r - 90), cy + Math.sin(a) * (r - 90) + 20, { size: 52, c }); });
  const u = 0.1 + 0.8 * ss(clamp((t - at(9, 'speed') + 0.4) / 1.2)) + Math.sin(t * 12) * 0.01; const a = Math.PI + u * Math.PI;
  line(ctx, cx, cy, cx + Math.cos(a) * (r - 40), cy + Math.sin(a) * (r - 40), { w: 10, c: u > 0.5 ? GREEN : RED, seed: 72 });
  ctx.save(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill(); ctx.restore();
  text(ctx, 'paisa kitni SPEED se 2x?', 540, 420, { size: 66, c: GREEN, alpha: ramp(t, at(9, 'paisa')) });
  text(ctx, 'kamaai nahi', 540, 1150, { size: 56, c: GREY, alpha: ramp(t, S(9) + 0.4) });
}

function ending(ctx, t) { // 10
  text(ctx, '72 / return = saal', 540, 330, { size: 96, c: NAVY, alpha: ramp(t, S(10)) });
  moneyBag(ctx, 420, 1200, 2.6, 81); moneyBag(ctx, 660, 1200, 2.6, 82);
  fig(ctx, { x: 860, y: 1100, s: 0.8, seed: 83, t, mood: 'grin', arms: [[-150, -175], [150, 175]], legs: [[-14, -10], [14, 10]] });
}

await K.run([[0, hook], [S(1) - 0.15, formula], [S(2) - 0.15, ppf], [S(3) - 0.15, road], [S(4) - 0.15, race], [S(5) - 0.15, ladder], [S(7) - 0.15, inflation], [S(9) - 0.15, speed], [S(10) - 0.15, ending]],
  { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. Returns maan ke, guaranteed nahi.' });
