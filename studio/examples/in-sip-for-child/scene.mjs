// Hinglish Short: ₹10,000 SIP from birth, what it becomes at 18 (assumes 12% a year, monthly SIP, not guaranteed)
// FV: 18y ₹76.5L (invested ₹21.6L), 5y ₹8.25L, 15y ₹50.5L (last 3 years add ~₹26L), 13y ₹37.6L
import { kit } from '../../lib/kit.mjs';
const K = await kit(import.meta.url, { lead: 0.3 });
const { S, E, at, R } = K;
const { fig, text, writeText, strokePath, circlePts, box, card, fillPoly, coinStack, moneyBag, pop, ramp, ss, lerp, clamp, checkMark, crossMark, marks, line, underline } = R;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6', PINK = '#f9d6cf', MINT = '#d9ecdd', CREAM = '#fff8de';
const FV = n => 10000 * ((1.01 ** (12 * n) - 1) / 0.01) * 1.01 / 1e5; // lakh
const lakh = v => '₹' + (v >= 10 ? Math.floor(v) : v.toFixed(1)) + ' lakh';

function kid(ctx, x, y, age, t, seed, mood = 'happy', arms) { // age 0..18 -> size
  const s = lerp(0.42, 1.0, clamp(age / 18));
  return fig(ctx, { x, y: y - 136 * s, s, seed, t, mood, arms: arms || [[-150, -170], [150, 170]], legs: [[-14, -10], [14, 10]] });
}

function hook(ctx, t) { // 0
  text(ctx, '₹10,000 / MAHINA', 540, 200, { size: 104, c: NAVY });
  text(ctx, '18 SAAL BAAD?', 540, 330, { size: 120, c: GREEN, rot: -0.02 });
  const g = ss(clamp((t - 0.5) / 6.0)); const age = Math.round(g * 18);
  // crib -> grown kid
  strokePath(ctx, [[120, 1250], [960, 1250]], { w: 5, seed: 3 });
  kid(ctx, 360, 1250, age, t, 5, g > 0.9 ? 'grin' : 'happy');
  text(ctx, age === 0 ? 'Day 1' : 'Age ' + age, 360, 1340, { size: 60, c: GREY });
  const n = Math.round(1 + g * 18); coinStack(ctx, 760, 1240, n, 2.2, 7);
  text(ctx, '?', 760, 1240 - n * 29 - 70, { size: 130, c: GREEN, scale: 1 + Math.sin(t * 6) * 0.06 });
  const k = pop(t, at(0, 'sip'), 0.35); if (k > 0) { ctx.save(); ctx.translate(540, 520); ctx.scale(k, k); card(ctx, -150, -55, 300, 100, MINT, 9); text(ctx, 'SIP', 0, 22, { size: 70, c: GREEN }); ctx.restore(); }
}

function invested(ctx, t) { // 1-2
  writeText(ctx, 'AAPKI JEB SE', 540, 220, S(1) + 0.05, t, { size: 100, c: NAVY, dur: 0.45 });
  const g = ss(clamp((t - S(1) - 0.2) / 1.6)); const v = 21.6 * g;
  text(ctx, '₹' + v.toFixed(1) + ' lakh', 540, 420, { size: 120, c: INK });
  text(ctx, '₹10,000 x 216 mahine', 540, 510, { size: 52, c: GREY, alpha: ramp(t, S(1) + 0.4) });
  // coins dropping into bag
  for (let i = 0; i < 4; i++) { const p = ((t * 1.3 + i * 0.25) % 1); if (t < S(2)) { const x = 540 + (i - 1.5) * 40; ctx.save(); ctx.fillStyle = '#f3d35b'; ctx.beginPath(); ctx.ellipse(x, lerp(600, 900, p), 26, 9, 0, 0, 7); ctx.fill(); ctx.restore(); } }
  moneyBag(ctx, 540, 1150, 3.0, 11);
  if (t > S(2) - 0.1) { const k = pop(t, at(2, '12%'), 0.4);
    if (k > 0) { ctx.save(); ctx.translate(540, 700); ctx.rotate(-0.05); ctx.scale(k, k); card(ctx, -360, -100, 720, 190, CREAM, 13); text(ctx, 'Maan lo: 12% / saal', 0, -10, { size: 72, c: NAVY }); text(ctx, 'guaranteed NAHI', 0, 65, { size: 58, c: RED, alpha: ramp(t, at(2, 'guaranteed')) }); ctx.restore(); } }
  fig(ctx, { x: 870, y: 1100, s: 0.85, seed: 15, t, mood: 'worried', look: -1, arms: [[-110, -80], [25, 10]], legs: [[-14, -10], [14, 10]] });
}

// chart world: years 0..18 on x 150..930, value 0..80 lakh on y 1250..450
const CX = n => 150 + n / 18 * 780, CY = v => 1250 - v / 80 * 800;
function chart(ctx, t, upTo, { inv = true } = {}) {
  strokePath(ctx, [[CX(0), CY(84)], [CX(0), CY(0)], [CX(18.6), CY(0)]], { w: 5, seed: 21 });
  for (const y of [0, 5, 10, 13, 18]) text(ctx, String(y), CX(y), CY(0) + 60, { size: 44, c: GREY });
  text(ctx, 'saal', CX(18), CY(0) + 115, { size: 44, c: GREY });
  if (inv) { const p = []; for (let n = 0; n <= upTo; n += 0.25) p.push([CX(n), CY(1.2 * n)]); if (p.length > 1) strokePath(ctx, p, { w: 5, c: GREY, seed: 22, amp: 0.3 }); }
  const p = []; for (let n = 0; n <= upTo + 1e-6; n += 0.25) p.push([CX(n), CY(FV(n))]);
  if (p.length > 1) strokePath(ctx, p, { w: 8, c: GREEN, seed: 23, amp: 0.3 });
  if (upTo > 0) { const [x, y] = p[p.length - 1]; ctx.save(); ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.restore(); }
}

function growth(ctx, t) { // 3-4
  const g = ss(clamp((t - S(3) + 0.1) / 2.0)); const up = 18 * g;
  chart(ctx, t, up);
  text(ctx, '18th BIRTHDAY', 540, 200, { size: 90, c: NAVY, alpha: ramp(t, S(3)) });
  const v = FV(up); text(ctx, '~' + lakh(v), 470, 370, { size: 120, c: GREEN });
  if (t > S(4) - 0.1) { const k = ramp(t, S(4), 0.5);
    // split bar: invested vs growth
    const x0 = 960, w = 80; box(ctx, x0, CY(21.6), w, CY(0) - CY(21.6), { fill: '#d7d7d2', lw: 4, seed: 31 });
    const top = lerp(CY(21.6), CY(76.5), k); box(ctx, x0, top, w, CY(21.6) - top, { fill: '#9fd6b2', lw: 4, seed: 32 });
    text(ctx, '₹21.6L aapka', 180, CY(60), { size: 50, c: GREY, align: 'left' });
    text(ctx, '+₹55L growth', 180, CY(51), { size: 62, c: GREEN, align: 'left', alpha: k });
  } else text(ctx, 'grey = jo aapne daala', 540, 1450, { size: 44, c: GREY, alpha: ramp(t, S(3) + 1) });
  text(ctx, '12%/saal maan ke', 470, 460, { size: 46, c: GREY });
}

function twist(ctx, t) { // 5-7: camera zooms into first 5 years, then pans to last 3
  writeText(ctx, 'TWIST', 540, 200, S(5) + 0.05, t, { size: 120, c: RED, dur: 0.4 });
  const zIn = ss(clamp((t - S(5) - 0.3) / 1.2)), zOut = ss(clamp((t - S(7) + 0.2) / 1.0));
  const fx = lerp(lerp(540, CX(3), zIn), CX(13), zOut), fy = lerp(lerp(850, CY(6), zIn), CY(48), zOut), z = lerp(lerp(1, 1.9, zIn), 1.25, zOut);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 300, 1080, 1180); ctx.clip();
  ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-fx, -fy);
  chart(ctx, t, 18);
  if (t > S(6) - 0.1 && t < S(7) - 0.1) { const k = pop(t, at(6, '₹6'), 0.3); const k2 = pop(t, at(6, '₹8'), 0.3);
    ctx.save(); ctx.fillStyle = 'rgba(224,69,47,.08)'; ctx.fillRect(CX(0), CY(20), CX(5) - CX(0), CY(0) - CY(20)); ctx.restore();
    if (k > 0) text(ctx, 'daale ₹6L', CX(2.6), CY(13), { size: 40 * k, c: GREY });
    if (k2 > 0) text(ctx, 'bane ₹8.25L', CX(2.6), CY(17.5), { size: 44 * k2, c: GREEN }); }
  if (t > S(7) - 0.1) { const k = ramp(t, at(7, '₹26'), 0.5);
    ctx.save(); ctx.fillStyle = 'rgba(47,154,90,.12)'; ctx.fillRect(CX(15), CY(80), CX(18) - CX(15), CY(0) - CY(80)); ctx.restore();
    strokePath(ctx, [[CX(14.6), CY(FV(15))], [CX(14.6), CY(FV(18))]], { w: 6, c: GREEN, seed: 41, prog: k });
    if (k > 0) text(ctx, '+₹26L', CX(10.5), CY(66), { size: 80, c: GREEN, alpha: k }); text(ctx, 'aakhri 3 saal mein', CX(10.5), CY(59), { size: 46, c: GREY, alpha: k }); }
  ctx.restore();
  if (t < S(6) - 0.1) { const k = pop(t, at(5, 'slow'), 0.35); if (k > 0) { ctx.save(); ctx.translate(540, 360); ctx.scale(k, k); text(ctx, 'pehle 5 saal = SLOW', 0, 0, { size: 70, c: NAVY }); ctx.restore(); } }
}

function late(ctx, t) { // 8-9
  writeText(ctx, '5 SAAL LATE?', 540, 210, S(8) + 0.05, t, { size: 110, c: RED, dur: 0.45 });
  const base = 1200; strokePath(ctx, [[120, base], [960, base]], { w: 5, seed: 51 });
  const g1 = 1, h1 = 76.5 / 80 * 700, g2 = ss(clamp((t - at(8, '₹37')) / 0.9)), h2 = lerp(0, 37.6 / 80 * 700, g2);
  box(ctx, 220, base - h1, 230, h1, { fill: '#9fd6b2', lw: 4, seed: 52 }); text(ctx, '~₹76L', 335, base - h1 - 30, { size: 66, c: GREEN });
  text(ctx, 'janam se', 335, base + 65, { size: 50 }); text(ctx, '18 saal', 335, base + 120, { size: 44, c: GREY });
  if (h2 > 1) box(ctx, 630, base - h2, 230, h2, { fill: PINK, lw: 4, seed: 53 });
  if (g2 > 0.5) text(ctx, '~₹37.5L', 745, base - h2 - 30, { size: 66, c: RED });
  text(ctx, 'age 5 se', 745, base + 65, { size: 50 }); text(ctx, '13 saal', 745, base + 120, { size: 44, c: GREY });
  const k = pop(t, at(9, 'aadhi'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 370); ctx.rotate(-0.04); ctx.scale(k, k); card(ctx, -380, -70, 760, 125, PINK, 55); text(ctx, 'AADHI SE BHI KAM', 0, 25, { size: 80, c: RED }); ctx.restore(); }
  fig(ctx, { x: 960, y: 1050, s: 0.6, seed: 56, t, mood: t > at(9, 'aadhi') ? 'shock' : 'worried', look: -1, arms: [[-140, -160], [140, 160]], legs: [[-14, -10], [14, 10]] });
}

function gift(ctx, t) { // 10
  writeText(ctx, 'SABSE BADA GIFT', 540, 210, S(10) + 0.05, t, { size: 100, c: NAVY, dur: 0.45 });
  const open = ramp(t, at(10, 'time'), 0.4);
  // gift box
  const bx = 600, by = 1150; box(ctx, bx - 160, by - 260, 320, 260, { fill: PINK, lw: 5, seed: 61 }); line(ctx, bx, by - 260, bx, by, { w: 8, c: RED, seed: 62 });
  ctx.save(); ctx.translate(bx + open * 230, by - 230 * open - 260 * (1 - open) + open * 200); ctx.rotate(0.5 * open); box(ctx, -180, -60, 360, 60, { fill: '#f6b5ab', lw: 5, seed: 63 }); ctx.restore();
  if (t > at(10, 'rakam')) { const k = pop(t, at(10, 'rakam'), 0.3); text(ctx, 'rakam?', 300, 560, { size: 70, c: GREY, scale: k }); crossMark(ctx, 300, 545, ramp(t, at(10, 'nahi'), 0.3), 2.2, 64); }
  if (open > 0) { const k = pop(t, at(10, 'time'), 0.45); ctx.save(); ctx.translate(bx, by - 420); ctx.scale(k, k);
    fillPoly(ctx, circlePts(0, 0, 120, 120, 30), CREAM, 65, 0.4); strokePath(ctx, circlePts(0, 0, 120, 120, 30), { w: 6, seed: 66, close: true });
    const a = t * 3; line(ctx, 0, 0, Math.sin(a) * 80, -Math.cos(a) * 80, { w: 6, seed: 67 }); line(ctx, 0, 0, 50, 0, { w: 7, seed: 68 });
    ctx.restore(); text(ctx, 'TIME', bx, by - 580, { size: 100, c: GREEN, alpha: open }); }
  kid(ctx, 240, 1150, 4, t, 69, open > 0 ? 'grin' : 'happy', [[60, 90], [140, 160]]);
}

function ending(ctx, t) { // 11
  text(ctx, 'Jaldi shuru = bada fark', 540, 300, { size: 80, c: GREEN, alpha: ramp(t, S(11)) });
  kid(ctx, 380, 1200, 18, t, 71, 'grin'); kid(ctx, 640, 1200, 3, t, 72, 'happy');
  coinStack(ctx, 850, 1190, 12, 1.6, 73);
}

await K.run([[0, hook], [S(1) - 0.15, invested], [S(3) - 0.15, growth], [S(5) - 0.15, twist], [S(8) - 0.15, late], [S(10) - 0.15, gift], [S(11) - 0.15, ending]],
  { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. 12%/saal maan ke. Advice nahi.' });
