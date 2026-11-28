// Hinglish Short: why you keep moving your stop-loss (loss aversion; -20% needs +25%, -50% needs +100%; SEBI FY26: ~88% of individual F&O traders lost money)
import { kit } from '../../lib/kit.mjs';
const K = await kit(import.meta.url, { lead: 0.3 });
const { S, E, at, R } = K;
const { fig, text, writeText, strokePath, circlePts, box, card, fillPoly, coinStack, phone, pop, ramp, ss, lerp, clamp, crossMark, checkMark, marks, sweat, line, bubble, doc } = R;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6', PINK = '#f9d6cf', MINT = '#d9ecdd', CREAM = '#fff8de';

// price chart world: x 140..940, price 78..104 -> y 1300..560
const PY = p => 1300 - (p - 78) / 26 * 740;
const PRICE = [[0, 100], [0.1, 101], [0.2, 100.5], [0.3, 102], [0.4, 99.5], [0.5, 98], [0.58, 96.2], [0.66, 93], [0.74, 90.5], [0.82, 88], [0.9, 85.5], [1, 81]];
const PX = u => 140 + u * 800;
function priceAt(u) { for (let i = 1; i < PRICE.length; i++) if (u <= PRICE[i][0]) { const [a, pa] = PRICE[i - 1], [b, pb] = PRICE[i]; return lerp(pa, pb, (u - a) / (b - a)); } return 81; }
function chart(ctx, upTo, seed = 10) {
  strokePath(ctx, [[PX(0) - 20, PY(104.5)], [PX(0) - 20, PY(78)], [PX(1) + 20, PY(78)]], { w: 5, seed });
  const p = []; for (let u = 0; u <= upTo + 1e-6; u += 0.01) p.push([PX(u), PY(priceAt(u))]);
  if (p.length > 1) strokePath(ctx, p, { w: 7, c: NAVY, seed: seed + 1, amp: 0.4 });
  if (upTo > 0) { const [x, y] = p[p.length - 1]; ctx.save(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill(); ctx.restore(); }
}
function slLine(ctx, price, label = true, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.setLineDash([22, 14]); ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(PX(0) - 20, PY(price)); ctx.lineTo(PX(1) + 20, PY(price)); ctx.stroke(); ctx.restore();
  if (label) { card(ctx, PX(1) - 230, PY(price) - 44, 250, 76, PINK, 7); text(ctx, 'SL ₹' + Math.round(price / 5) * 5, PX(1) - 105, PY(price) + 12, { size: 52, c: RED, alpha }); }
}

function hook(ctx, t) { // 0
  text(ctx, 'STOP-LOSS SAHI THA.', 540, 200, { size: 92, c: NAVY });
  const k = pop(t, at(0, 'par'), 0.35);
  if (k > 0) { ctx.save(); ctx.translate(540, 320); ctx.rotate(-0.03); ctx.scale(k, k); text(ctx, 'AAPNE KHISKA DIYA', 0, 0, { size: 86, c: RED }); ctx.restore(); }
  const k2 = pop(t, at(0, 'phir'), 0.35);
  if (k2 > 0) { ctx.save(); ctx.translate(540, 440); ctx.scale(k2, k2); card(ctx, -190, -60, 380, 105, CREAM, 3); text(ctx, 'PHIR SE.', 0, 18, { size: 76, c: INK }); ctx.restore(); }
  // a hand-figure keeps dragging the red line lower, looping
  const cyc = ((t * 0.55) % 1); const sl = lerp(95, 84, ss(cyc));
  chart(ctx, 0.95, 12); slLine(ctx, sl);
  fig(ctx, { x: 300, y: PY(sl) + 150, s: 0.8, seed: 14, t, mood: 'worried', lean: 8, arms: [[-160, -150], [-150, -140]], legs: [[-30, -20], [20, 30]] });
}

function setup(ctx, t) { // 1
  writeText(ctx, 'PLAN', 540, 220, S(1) + 0.05, t, { size: 110, c: NAVY, dur: 0.35 });
  const u = lerp(0.02, 0.36, ss(clamp((t - S(1)) / 3.5)));
  chart(ctx, u, 20);
  const kb = pop(t, at(1, 'share'), 0.3);
  if (kb > 0) { ctx.save(); ctx.translate(PX(0) + 120, PY(100) - 110); ctx.scale(kb, kb); card(ctx, -125, -45, 250, 80, MINT, 21); text(ctx, 'BUY ₹100', 0, 14, { size: 50, c: GREEN }); ctx.restore(); }
  if (t > at(1, 'stop')) slLine(ctx, 95, true, ramp(t, at(1, 'stop'), 0.3));
  const kp = pop(t, at(1, 'plan'), 0.4);
  if (kp > 0) { ctx.save(); ctx.translate(540, 400); ctx.scale(kp, kp); text(ctx, 'Plan perfect', -40, 0, { size: 80, c: GREEN }); checkMark(ctx, 230, -20, ramp(t, at(1, 'perfect'), 0.4), 1.6, 22); ctx.restore(); }
}

function waitScene(ctx, t) { // 2: price nears SL, brain says wait (camera zooms toward SL)
  const zk = ss(clamp((t - S(2)) / 2.5)), z = lerp(1, 1.45, zk);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 300, 1080, 1180); ctx.clip();
  ctx.translate(540, 950); ctx.scale(z, z); ctx.translate(-lerp(540, PX(0.5), zk), -lerp(950, PY(96), zk));
  const u = lerp(0.36, 0.58, ss(clamp((t - S(2)) / 1.6))); chart(ctx, u, 30); slLine(ctx, 95);
  if (t > at(2, '₹96')) text(ctx, '₹96', PX(0.58) + 10, PY(96.2) - 40, { size: 56, c: NAVY });
  ctx.restore();
  writeText(ctx, 'BAS ₹1 DOOR...', 540, 220, S(2) + 0.05, t, { size: 90, c: RED, dur: 0.4 });
  // brain bubble
  const kb = pop(t, at(2, 'dimaag'), 0.4);
  if (kb > 0) { bubble(ctx, 600, 470, 640, 120, 'thoda aur wait...', kb, CREAM, 33, 62, NAVY); }
  fig(ctx, { x: 860, y: 1250, s: 0.8, seed: 34, t, mood: 'worried', look: -1, arms: [[-120, -150], [25, 10]], legs: [[-14, -10], [14, 10]] });
}

function drag(ctx, t) { // 3: stickman drags red line lower: 95 -> 90 -> 85
  writeText(ctx, 'SL KHISKAO...', 540, 220, S(3) + 0.05, t, { size: 96, c: RED, dur: 0.4 });
  const u = lerp(0.58, 0.88, ss(clamp((t - S(3)) / 2.6))); chart(ctx, u, 40);
  const a = ss(clamp((t - at(3, '₹90') + 0.3) / 0.5)), b = ss(clamp((t - at(3, '₹85') + 0.3) / 0.5));
  const sl = 95 - 5 * a - 5 * b;
  slLine(ctx, 95, false, 0.15); if (a > 0.5) slLine(ctx, 90, false, 0.15);
  slLine(ctx, sl);
  const f = fig(ctx, { x: PX(0.22), y: PY(sl) + 160, s: 0.85, seed: 44, t, mood: 'sad', lean: 14, arms: [[-165, -160], [-160, -150]], legs: [[-35, -25], [25, 35]] });
  sweat(ctx, f.head[0] + 40, f.head[1] - 10, 0.9, t);
  text(ctx, 'neeche, neeche...', 540, 400, { size: 58, c: GREY, alpha: ramp(t, at(3, '₹85')) });
}

function lossGrow(ctx, t) { // 4
  writeText(ctx, 'CHHOTA LOSS = BADA LOSS', 540, 220, S(4) + 0.05, t, { size: 78, c: NAVY, dur: 0.5 });
  const g = ss(clamp((t - at(4, '₹20')) / 0.9));
  const base = 1150; strokePath(ctx, [[120, base], [960, base]], { w: 5, seed: 51 });
  box(ctx, 220, base - 110, 220, 110, { fill: PINK, lw: 4, seed: 52 }); text(ctx, '−₹5', 330, base - 140, { size: 80, c: RED });
  text(ctx, 'plan wala', 330, base + 70, { size: 52, c: GREY });
  const h = lerp(0, 440, g); if (h > 2) box(ctx, 640, base - h, 220, h, { fill: '#f19a8c', lw: 4, seed: 53 });
  if (g > 0.3) text(ctx, '−₹20', 750, base - h - 30, { size: 96, c: RED, scale: lerp(0.7, 1, g) });
  text(ctx, 'khiskaya wala', 750, base + 70, { size: 52, c: GREY, alpha: ramp(t, at(4, '₹20')) });
  if (g > 0.95) text(ctx, '4x', 540, 560, { size: 130, c: RED, scale: 1 + Math.sin(t * 7) * 0.05 });
}

function aversion(ctx, t) { // 5: see-saw: "loss maanna" heavier than "loss"
  writeText(ctx, 'LOSS AVERSION', 540, 220, S(5) + 0.05, t, { size: 104, c: RED, dur: 0.45 });
  const tilt = 0.22 * ss(clamp((t - at(5, 'maanna')) / 0.8)) + Math.sin(t * 3) * 0.01;
  const cx = 540, cy = 1050;
  fillPoly(ctx, [[cx - 60, cy + 150], [cx + 60, cy + 150], [cx, cy]], '#d7d7d2', 61, 0.3); strokePath(ctx, [[cx - 60, cy + 150], [cx + 60, cy + 150], [cx, cy], [cx - 60, cy + 150]], { w: 5, seed: 62 });
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  line(ctx, -420, 0, 420, 0, { w: 9, seed: 63 });
  card(ctx, -420, -130, 260, 120, MINT, 64); text(ctx, 'loss', -290, -50, { size: 64, c: NAVY });
  card(ctx, 160, -170, 260, 160, PINK, 65); text(ctx, 'loss', 290, -105, { size: 56, c: RED }); text(ctx, 'MAANNA', 290, -45, { size: 56, c: RED });
  ctx.restore();
  if (t > at(5, 'dard')) { const k = pop(t, at(5, 'dard'), 0.4); bubble(ctx, 540, 470, 620, 130, 'zyada DARD deta hai', k, CREAM, 66, 62, RED); }
  fig(ctx, { x: 160, y: 760, s: 0.6, seed: 67, t, mood: 'cry', arms: [[-140, -160], [140, 160]], legs: [[-14, -10], [14, 10]] });
}

function recovery(ctx, t) { // 6: down bar vs climb-back bar
  const big = t > at(6, '50%') - 0.1;
  writeText(ctx, big ? '−50% = +100% chahiye' : '−20% = +25% chahiye', 540, 220, big ? at(6, '50%') - 0.1 : S(6) + 0.05, t, { size: 84, c: big ? RED : NAVY, dur: 0.45 });
  const g = big ? ss(clamp((t - at(6, '50%')) / 0.9)) : ss(clamp((t - S(6) - 0.3) / 0.9));
  const down = big ? lerp(0.2, 0.5, g) : 0.2 * g, up = big ? lerp(0.25, 1.0, ss(clamp((t - at(6, '100%') + 0.2) / 0.9))) : 0.25 * ss(clamp((t - at(6, '25%') + 0.1) / 0.8));
  const zero = 860, sc = 520; // 100% = 520px
  strokePath(ctx, [[100, zero], [980, zero]], { w: 5, seed: 71 }); text(ctx, '₹100', 160, zero - 20, { size: 44, c: GREY });
  box(ctx, 260, zero, 220, down * sc, { fill: PINK, lw: 4, seed: 72 });
  text(ctx, '−' + Math.round(down * 100) + '%', 370, zero + down * sc + 80, { size: 80, c: RED });
  const left = 100 - down * 100, top = zero + down * sc; // after loss
  if (up > 0.01) { const hh = left * up / 100 * sc; box(ctx, 600, top - hh, 220, hh, { fill: '#9fd6b2', lw: 4, seed: 73 });
    text(ctx, '+' + Math.round(up * 100) + '%', 710, top - hh - 30, { size: 80, c: GREEN }); }
  const climb = clamp((t - S(6)) / 6);
  fig(ctx, { x: 900, y: top - 10 - lerp(0, 0, climb), s: 0.6, seed: 74, t, mood: big ? 'shock' : 'worried', look: -1, arms: [[-150, -140], [25, 10]], legs: [[-14, -10], [14, 10]] });
}

function sebi(ctx, t) { // 7: 100 dots, 88 red
  writeText(ctx, 'SEBI STUDY, FY26', 540, 220, S(7) + 0.05, t, { size: 90, c: NAVY, dur: 0.45 });
  text(ctx, 'F&O, individual traders', 540, 320, { size: 54, c: GREY, alpha: ramp(t, S(7) + 0.3) });
  const fillT = at(7, '88%') - 0.4;
  for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; const x = 225 + c * 70, y = 430 + r * 70;
    const red = i < 88 && t > fillT + i * 0.012; ctx.save(); ctx.fillStyle = red ? '#f19a8c' : '#d9ecdd'; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill(); ctx.restore();
    strokePath(ctx, circlePts(x, y, 26, 26, 14), { w: 3, seed: 80 + i, close: true, amp: 0.3 }); }
  const k = pop(t, at(7, '88%') + 0.4, 0.45);
  if (k > 0) { ctx.save(); ctx.translate(540, 1240); ctx.rotate(-0.03); ctx.scale(k, k); card(ctx, -400, -90, 800, 165, PINK, 90); text(ctx, '~88% ne paisa gawaya', 0, 20, { size: 72, c: RED }); ctx.restore(); }
  text(ctx, 'source: SEBI study, Aug 2026', 540, 1400, { size: 50, c: GREEN, alpha: ramp(t, at(7, '88%') + 1.2) });
}

function rule(ctx, t) { // 8: note before trade; arrow up OK, down NO
  writeText(ctx, 'RULE', 540, 220, S(8) + 0.05, t, { size: 120, c: GREEN, dur: 0.35 });
  const kd = pop(t, at(8, 'likho') - 0.6, 0.4);
  if (kd > 0) { ctx.save(); ctx.translate(320, 640); ctx.rotate(-0.04); ctx.scale(kd, kd); doc(ctx, -200, -200, 400, 400, 101, 'TRADE SE PEHLE'); ctx.restore();
    writeText(ctx, 'SL: ₹95', 320, 760, at(8, 'likho'), t, { size: 76, c: RED, dur: 0.5 }); }
  const ku = ramp(t, at(8, 'upar'), 0.4), kn = ramp(t, at(8, 'neeche'), 0.4);
  if (ku > 0) { strokePath(ctx, [[800, 1150], [800, 820]], { w: 10, c: GREEN, seed: 102, prog: ku }); if (ku > 0.9) strokePath(ctx, [[760, 870], [800, 815], [840, 870]], { w: 10, c: GREEN, seed: 103 });
    text(ctx, 'UPAR: OK', 800, 770, { size: 60, c: GREEN, alpha: ku }); }
  if (kn > 0) { strokePath(ctx, [[400, 1050], [400, 1320]], { w: 10, c: RED, seed: 104, prog: kn }); if (kn > 0.9) strokePath(ctx, [[360, 1270], [400, 1325], [440, 1270]], { w: 10, c: RED, seed: 105 });
    crossMark(ctx, 400, 1180, ramp(t, at(8, 'nahi'), 0.4), 2.4, 106); text(ctx, 'NEECHE: KABHI NAHI', 400, 1420, { size: 50, c: RED, alpha: kn }); }
  fig(ctx, { x: 640, y: 1250, s: 0.75, seed: 107, t, mood: 'smug', arms: [[-25, -10], [140, 160]], legs: [[-14, -10], [14, 10]] });
}

function fees(ctx, t) { // 9: small loss = ticket to stay in the game
  writeText(ctx, 'GAME MEIN BANE RAHO', 540, 220, S(9) + 0.05, t, { size: 86, c: NAVY, dur: 0.45 });
  const k = pop(t, S(9) + 0.4, 0.45);
  if (k > 0) { ctx.save(); ctx.translate(540, 600); ctx.rotate(-0.06 + Math.sin(t * 2) * 0.02); ctx.scale(k, k);
    card(ctx, -330, -130, 660, 260, CREAM, 111); line(ctx, 160, -130, 160, 130, { w: 4, seed: 112 });
    text(ctx, 'ENTRY TICKET', -80, -30, { size: 64, c: NAVY }); text(ctx, 'chhota loss', -80, 60, { size: 58, c: RED }); checkMark(ctx, 245, 10, 1, 2, 115); ctx.restore(); }
  const walk = clamp((t - S(9)) / 3);
  fig(ctx, { x: 200 + walk * 300, y: 1200, s: 0.95, seed: 113, t, mood: 'grin', arms: [[-25, -10], [140, 170]], legs: walk < 1 ? [[-20 * Math.sin(t * 9) - 4, -10], [20 * Math.sin(t * 9) + 4, 10]] : [[-14, -10], [14, 10]] });
  coinStack(ctx, 850, 1260, 9, 1.6, 114);
}

function ending(ctx, t) { // 10
  text(ctx, 'Plan likho. Plan mano.', 540, 320, { size: 84, c: NAVY, alpha: ramp(t, S(10)) });
  chart(ctx, 0.3, 120); slLine(ctx, 95);
  fig(ctx, { x: 820, y: 1220, s: 0.8, seed: 121, t, mood: 'grin', arms: [[-150, -175], [150, 175]], legs: [[-14, -10], [14, 10]] });
}

await K.run([[0, hook], [S(1) - 0.15, setup], [S(2) - 0.15, waitScene], [S(3) - 0.15, drag], [S(4) - 0.15, lossGrow], [S(5) - 0.15, aversion], [S(6) - 0.15, recovery], [S(7) - 0.15, sebi], [S(8) - 0.15, rule], [S(9) - 0.15, fees], [S(10) - 0.15, ending]],
  { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. Investment advice nahi.' });
