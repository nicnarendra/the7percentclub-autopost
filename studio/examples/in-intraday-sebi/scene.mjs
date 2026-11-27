// Hinglish Short: Intraday trading, what SEBI found (SEBI study, 24 Jul 2024, FY23 data, equity cash segment)
import { kit } from '../../lib/kit.mjs';
const K = await kit(import.meta.url, { lead: 0.3 });
const { S, E, at, R } = K;
const { fig, text, writeText, strokePath, circlePts, box, card, fillPoly, coinStack, phone, pop, ramp, ss, lerp, clamp, crossMark, checkMark, marks, sweat, line, doc, mini, underline } = R;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6', PINK = '#f9d6cf', MINT = '#d9ecdd';
const zoom = (ctx, t, t0, dur, z, cx = 540, cy = 800) => { const k = 1 + (z - 1) * ss(clamp((t - t0) / dur)); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); };

function hook(ctx, t) { // 0
  text(ctx, 'INTRADAY =', 540, 200, { size: 96, c: NAVY });
  text(ctx, 'ROZ KI KAMAAI?', 540, 320, { size: 110, c: GREEN, rot: -0.02 });
  const t7 = at(0, '7'), tl = at(0, 'loss');
  for (let i = 0; i < 10; i++) {
    const col = i % 5, row = Math.floor(i / 5), x = 160 + col * 190, y = 730 + row * 360;
    const lose = i !== 1 && i !== 5 && i !== 8; const order = [0, 2, 3, 4, 6, 7, 9].indexOf(i);
    const hit = lose && t > t7 + order * 0.12; const d = hit ? ss((t - t7 - order * 0.12) / 0.3) : 0;
    fig(ctx, { x, y: y + d * 14, s: 0.66, seed: 10 + i, t, c: hit ? '#6b6f75' : INK, mood: hit ? 'cry' : (lose ? 'happy' : (t > t7 ? 'grin' : 'happy')), tilt: 16 * d,
      arms: hit ? [[-12, -4], [12, 4]] : [[-150 + Math.sin(t * 5 + i) * 10, -170], [150, 170]], legs: [[-14, -12], [14, 12]] });
    if (hit) { const ay = y - 175; strokePath(ctx, [[x, ay - 40], [x, ay + 10]], { w: 6, c: RED, seed: 70 + i, prog: d }); if (d > .8) strokePath(ctx, [[x - 14, ay - 6], [x, ay + 10], [x + 14, ay - 6]], { w: 6, c: RED, seed: 80 + i }); }
  }
  if (t > t7) { const k = pop(t, tl, 0.35); if (k > 0) { ctx.save(); ctx.translate(540, 1330); ctx.scale(k, k); card(ctx, -330, -75, 660, 130, PINK, 5); text(ctx, '10 mein se 7 = LOSS', 0, 22, { size: 72, c: RED }); ctx.restore(); } }
}

function study(ctx, t) { // 1
  ctx.save(); zoom(ctx, t, S(1), 3, 1.08, 540, 700);
  const k = ss(clamp((t - S(1)) / 0.5));
  doc(ctx, lerp(-600, 190, k), 330, 700, 760, 21, 'SEBI STUDY');
  if (k > 0.9) {
    text(ctx, 'Intraday traders', 540, 590, { size: 64, c: INK });
    text(ctx, 'Equity cash segment', 540, 680, { size: 56, c: GREY });
    const s = pop(t, at(1, 'fy23'), 0.35);
    if (s > 0) { ctx.save(); ctx.translate(540, 900); ctx.rotate(-0.12); ctx.scale(s, s); box(ctx, -190, -80, 380, 150, { c: RED, lw: 7, seed: 23 }); text(ctx, 'FY23 data', 0, 22, { size: 76, c: RED }); ctx.restore(); }
  }
  ctx.restore();
  text(ctx, 'report: 24 July 2024', 540, 1250, { size: 54, c: GREY, alpha: ramp(t, S(1) + 0.8) });
  fig(ctx, { x: 900, y: 1300, s: 0.8, seed: 25, t, mood: 'shock', look: -1, arms: [[-120, -90], [25, 10]], legs: [[-14, -10], [14, 10]] });
}

function crowd(ctx, t) { // 2
  writeText(ctx, 'BHEED BADH RAHI HAI', 540, 220, S(2) + 0.05, t, { size: 84, c: NAVY, dur: 0.5 });
  const g = ss(clamp((t - at(2, '4')) / 1.6));
  const base = 1240;
  strokePath(ctx, [[120, base], [960, base]], { w: 5, seed: 31 });
  const h1 = 120, h2 = lerp(120, 480, g);
  box(ctx, 220, base - h1, 220, h1, { fill: '#cfd8e6', lw: 4, seed: 32 }); text(ctx, 'FY19', 330, base + 70, { size: 58 });
  box(ctx, 640, base - h2, 220, h2, { fill: PINK, lw: 4, seed: 33 }); text(ctx, 'FY23', 750, base + 70, { size: 58 });
  for (let i = 0; i < 2; i++) mini(ctx, 290 + i * 80, base - h1 - 110, 0.42, INK, 'neutral', 40 + i, t);
  const n = Math.round(2 + g * 2); for (let i = 0; i < n; i++) mini(ctx, 750 + (i - (n - 1) / 2) * 70, base - h2 - 100, 0.36, INK, 'happy', 50 + i, t + i);
  const k = pop(t, at(2, '300%'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 430); ctx.scale(k, k); text(ctx, '+300% se zyada', 0, 0, { size: 96, c: RED }); ctx.restore(); text(ctx, '4 saal mein (FY19 se FY23)', 540, 520, { size: 50, c: GREY, alpha: ramp(t, at(2, '300%') + 0.3) }); }
}

function young(ctx, t) { // 3-4
  const second = t > S(4) - 0.1;
  writeText(ctx, '30 SAAL SE KAM', 540, 220, S(3) + 0.05, t, { size: 100, c: NAVY, dur: 0.45 });
  if (!second) {
    const g = ss(clamp((t - at(3, '48%')) / 1.2)); const v = Math.round(lerp(18, 48, g));
    text(ctx, v + '%', 540, 560, { size: 230, c: lerp(0, 1, g) > .5 ? RED : NAVY });
    text(ctx, 'sabhi intraday traders mein', 540, 680, { size: 54, c: GREY });
    box(ctx, 140, 760, 800, 90, { lw: 4, seed: 61 }); ctx.save(); ctx.fillStyle = '#f19a8c'; ctx.fillRect(146, 766, (788) * v / 100, 78); ctx.restore();
    text(ctx, 'FY19: 18%', 300, 930, { size: 56, c: GREY }); text(ctx, 'FY23: 48%', 780, 930, { size: 56, c: RED, alpha: g });
    for (let i = 0; i < 5; i++) fig(ctx, { x: 160 + i * 190, y: 1180 + Math.abs(Math.sin(t * 4 + i)) * -18, s: 0.62, seed: 62 + i, t, mood: 'grin', arms: [[-150, -170], [100, 120]], legs: [[-14, -12], [14, 12]] });
  } else {
    text(ctx, 'waalon mein:', 540, 340, { size: 60, c: GREY });
    const k = pop(t, at(4, '76%'), 0.4);
    ctx.save(); ctx.translate(540, 560); ctx.scale(Math.max(k, 0.001), Math.max(k, 0.001)); text(ctx, '76% LOSS', 0, 0, { size: 170, c: RED }); ctx.restore();
    for (let i = 0; i < 25; i++) { const x = 160 + (i % 5) * 190, y = 820 + Math.floor(i / 5) * 125; const red = i < 19; const d = red ? ramp(t, at(4, '76%') + i * 0.04, 0.2) : 0;
      ctx.save(); ctx.fillStyle = red && d > 0.5 ? '#f19a8c' : '#d9ecdd'; ctx.beginPath(); ctx.arc(x, y, 46, 0, 7); ctx.fill(); ctx.restore(); strokePath(ctx, circlePts(x, y, 46, 46, 18), { w: 3.5, seed: 90 + i });
      if (red && d > 0.5) text(ctx, '−', x, y + 24, { size: 70, c: RED }); else if (!red) text(ctx, '+', x, y + 22, { size: 60, c: GREEN }); }
  }
}

function freq(ctx, t) { // 5
  writeText(ctx, 'ZYADA TRADES = ZYADA LOSS', 540, 210, S(5) + 0.05, t, { size: 70, c: RED, dur: 0.5 });
  const n = Math.min(500, Math.round(500 * ss(clamp((t - S(5)) / 2.6))));
  text(ctx, (n >= 500 ? '500+' : n) + ' trades/saal', 540, 380, { size: 84, c: NAVY });
  ctx.save(); ctx.translate(330, 820); ctx.scale(2.4, 2.4); phone(ctx, 0, 0, 1, 101); ctx.restore();
  const tap = Math.floor(t * 8) % 2 === 0;
  box(ctx, 240, 760, 180, 90, { fill: tap ? GREEN : '#9fd6b2', lw: 4, seed: 102 }); text(ctx, 'BUY', 330, 820, { size: 56, c: '#fff' });
  box(ctx, 240, 870, 180, 90, { fill: !tap ? RED : '#f6b5ab', lw: 4, seed: 103 }); text(ctx, 'SELL', 330, 930, { size: 52, c: '#fff' });
  const f = fig(ctx, { x: 760, y: 1000, s: 1.05, seed: 104, t, mood: t > at(5, '80%') ? 'dizzy' : 'angry', look: -1, arms: [[-100, -60 + (tap ? 12 : -12)], [25, 10]], legs: [[-14, -10], [14, 10]] });
  sweat(ctx, f.head[0] + 45, f.head[1] - 10, 0.9, t);
  const k = pop(t, at(5, '80%'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 1280); ctx.scale(k, k); card(ctx, -300, -90, 600, 160, PINK, 105); text(ctx, '80% LOSS', 0, 30, { size: 100, c: RED }); ctx.restore(); }
}

function costs(ctx, t) { // 6-7
  const ex = t > S(7) - 0.1;
  writeText(ctx, 'CHARGES ALAG SE', 540, 210, S(6) + 0.05, t, { size: 96, c: NAVY, dur: 0.45 });
  ctx.save(); if (ex) zoom(ctx, t, S(7), 2.5, 1.06, 540, 900);
  // loss stack
  const lossN = 10; coinStack(ctx, 330, 1150, lossN, 2.0, 111);
  text(ctx, ex ? '₹10,000' : 'LOSS', 330, 1150 - lossN * 26 - 60, { size: 70, c: RED });
  text(ctx, 'trading loss', 330, 1240, { size: 50, c: GREY });
  // extra charges stack grows to 57%
  const g = ss(clamp((t - at(6, '57%')) / 1.0)); const cn = Math.round(g * 6);
  if (cn > 0) { coinStack(ctx, 750, 1150, cn, 2.0, 121); text(ctx, ex ? '+ ~₹5,700' : '+57%', 750, 1150 - cn * 26 - 60, { size: 70, c: RED }); text(ctx, 'charges', 750, 1240, { size: 50, c: GREY }); }
  text(ctx, '+', 540, 1050, { size: 110, c: INK, alpha: g });
  ctx.restore();
  if (!ex) { const k = pop(t, at(6, 'loss'), 0.35); if (k > 0) { ctx.save(); ctx.translate(540, 420); ctx.scale(k, k); text(ctx, 'Loss ka 57% extra', 0, 0, { size: 84, c: RED }); ctx.restore(); text(ctx, 'brokerage, STT, GST, fees...', 540, 510, { size: 50, c: GREY, alpha: k }); } }
  else { text(ctx, 'Matlab:', 540, 400, { size: 70, c: GREY }); const k = pop(t, at(7, '₹5'), 0.4); if (k > 0) { ctx.save(); ctx.translate(540, 520); ctx.scale(k, k); text(ctx, 'dard x 1.57', 0, 0, { size: 96, c: RED }); ctx.restore(); }
    fig(ctx, { x: 540, y: 820, s: 0.8, seed: 131, t, mood: 'shock', arms: [[-140, -160], [140, 160]], legs: [[-14, -10], [14, 10]] }); }
}

function check(ctx, t) { // 8
  writeText(ctx, 'TRADE SE PEHLE', 540, 210, S(8) + 0.05, t, { size: 100, c: GREEN, dur: 0.45 });
  ctx.save(); zoom(ctx, t, S(8), 4, 1.1, 420, 800);
  ctx.save(); ctx.translate(420, 820); ctx.scale(3.2, 3.2); phone(ctx, 0, 0, 1, 141); ctx.restore();
  text(ctx, 'P&L 1 saal', 420, 600, { size: 50, c: NAVY });
  const rows = [['Trades', '640'], ['Net P&L', '−₹42K'], ['Charges', '−₹24K']];
  rows.forEach(([a, b], i) => { const k = ramp(t, at(8, 'saal') + i * 0.35, 0.3); text(ctx, a, 290, 680 + i * 110, { size: 44, align: 'left', alpha: k, c: INK }); text(ctx, b, 555, 680 + i * 110, { size: 44, align: 'right', alpha: k, c: i ? RED : INK }); });
  const kc = ramp(t, at(8, 'charges'), 0.3); if (kc > 0) box(ctx, 270, 875, 300, 70, { c: RED, lw: 5, seed: 142, prog: kc });
  ctx.restore();
  text(ctx, '(sirf example)', 420, 1300, { size: 44, c: GREY });
  const f = fig(ctx, { x: 830, y: 1080, s: 0.95, seed: 143, t, mood: 'worried', look: -1, arms: [[-110, -70], [25, 10]], legs: [[-14, -10], [14, 10]] });
  checkMark(ctx, 830, 650, ramp(t, at(8, 'zaroor'), 0.4), 2.2, 144);
}

function ending(ctx, t) { // 9
  text(ctx, '7% wale', 540, 300, { size: 110, c: GREEN, alpha: ramp(t, S(9)) });
  text(ctx, 'data dekh ke trade karte hain', 540, 410, { size: 58, c: GREY, alpha: ramp(t, S(9) + 0.2) });
  fig(ctx, { x: 540, y: 1000, s: 1.2, seed: 151, t, mood: 'grin', arms: [[-150, -175 + Math.sin(t * 6) * 8], [150, 175]], legs: [[-14, -10], [14, 10]] });
}

await K.run([[0, hook], [S(1) - 0.15, study], [S(2) - 0.15, crowd], [S(3) - 0.15, young], [S(5) - 0.15, freq], [S(6) - 0.15, costs], [S(8) - 0.15, check], [S(9) - 0.15, ending]],
  { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. Investment advice nahi.' });
