// Hinglish Short: revenge trading (recovery maths: -10% needs +11.1%, -50% needs +100%)
import { kit } from '../../lib/kit.mjs';
const K = await kit(import.meta.url, { lead: 0.3 });
const { S, E, at, R } = K;
const { fig, text, writeText, strokePath, circlePts, box, card, fillPoly, coinStack, phone, pop, ramp, ss, lerp, clamp, crossMark, checkMark, marks, sweat, line } = R;
const INK = '#1d1d1f', RED = '#e0452f', GREEN = '#2f9a5a', NAVY = '#27406b', GREY = '#9aa0a6', DIRT = '#c9a77c';

function stopSign(ctx, x, y, k) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([Math.cos(a) * 130, Math.sin(a) * 130]); }
  fillPoly(ctx, p, RED, 5, 0.3); strokePath(ctx, p, { w: 6, seed: 6, close: true }); text(ctx, 'RUKO!', 0, 25, { size: 76, c: '#fff' }); ctx.restore(); }

function hook(ctx, t) { // 0
  const k = pop(t, 0.05, 0.35);
  if (k > 0) { ctx.save(); ctx.translate(540, 300); ctx.scale(k, k); card(ctx, -280, -80, 560, 150, '#f9d6cf', 10); text(ctx, 'P&L: −₹5,000', 0, 22, { size: 80, c: RED }); ctx.restore(); }
  const big = at(0, '₹20');
  const g = ss(clamp((t - big) / 0.8));
  coinStack(ctx, 300, 1150, 4, 1.8, 11);
  if (g > 0) { coinStack(ctx, 760, 1150, Math.round(4 + g * 12), 2.4, 12); text(ctx, '₹20,000', 760, 1150 - (4 + g * 12) * 29 - 50, { size: 70, c: RED, alpha: g }); }
  const f = fig(ctx, { x: 540, y: 1030, s: 1.15, seed: 13, t, mood: 'angry', tilt: g > 0 ? 14 : 0, arms: g > 0 ? [[60, 70], [80, 95]] : [[-25, -10], [25, 10]], legs: g > 0 ? [[-30, -20], [10, 25]] : [[-14, -10], [14, 10]] });
  sweat(ctx, f.head[0] - 50, f.head[1] - 10, 0.9, t);
  stopSign(ctx, 540, 700, pop(t, at(0, 'ruko'), 0.3));
}

function name(ctx, t) { // 1-3
  writeText(ctx, 'REVENGE TRADING', 540, 240, S(1) + 0.05, t, { size: 104, c: RED, dur: 0.5 });
  if (t < S(2)) { text(ctx, 'accounts kha jaata hai', 540, 360, { size: 60, c: GREY, alpha: ramp(t, at(1, 'accounts')) });
    for (let i = 0; i < 3; i++) { const k = pop(t, at(1, 'accounts') + i * 0.25, 0.3); if (k <= 0) continue; ctx.save(); ctx.translate(250 + i * 290, 800); ctx.scale(k * 0.8, k * 0.8);
      card(ctx, -110, -150, 220, 300, '#fff', 20 + i); text(ctx, '₹', 0, -30, { size: 110, c: GREY }); crossMark(ctx, 0, 0, ramp(t, at(1, 'accounts') + 0.4 + i * 0.25, 0.3), 2, 24 + i); ctx.restore(); }
    return; }
  // phone: frantic BUY taps
  ctx.save(); ctx.translate(330, 820); ctx.scale(2.6, 2.6); phone(ctx, 0, 0, 1, 30); ctx.restore();
  const tap = Math.floor((t - S(2)) * 4) % 2 === 0;
  if (t > S(3)) { box(ctx, 230, 830, 200, 90, { fill: tap ? GREEN : '#9fd6b2', lw: 4, seed: 31 }); text(ctx, 'BUY', 330, 890, { size: 60, c: '#fff' });
    box(ctx, 230, 940, 200, 90, { fill: '#f9d6cf', lw: 4, seed: 32 }); text(ctx, 'SIZE x4', 330, 1000, { size: 46, c: RED }); }
  else { const hp = []; for (let i = 0; i <= 30; i++) { const u = i / 30; hp.push([250 + u * 160, 900 + (i % 6 === 3 ? -60 : i % 6 === 4 ? 40 : 0)]); } strokePath(ctx, hp, { w: 5, c: RED, seed: 33, prog: ramp(t, S(2), 1.5) }); text(ctx, 'dard!', 330, 1010, { size: 54, c: RED }); }
  const f = fig(ctx, { x: 760, y: 1000, s: 1.1, seed: 34, t, mood: t > S(3) ? 'angry' : 'cry', look: -1, arms: t > S(3) ? [[-100, -60 + (tap ? 10 : -10)], [25, 10]] : [[-140, -160], [140, 160]], legs: [[-14, -10], [14, 10]] });
  if (t > S(3)) { ['BADA', 'JALDI', 'BINA PLAN'].forEach((w, i) => { const tt = [at(3, 'bada'), at(3, 'jaldi'), at(3, 'bina')][i]; const k = pop(t, tt, 0.3);
    if (k > 0) text(ctx, w, 760, 470 + i * 110, { size: 74, c: i === 2 ? RED : NAVY, scale: lerp(0.6, 1, k) }); }); }
}

function hole(ctx, t) { // 4-6
  const big = t > S(5);
  writeText(ctx, big ? 'AADHA GAYA = +100%' : '−10% = +11% chahiye', 540, 240, big ? S(5) : S(4) + 0.05, t, { size: 78, c: big ? RED : NAVY, dur: 0.5 });
  const depth = big ? lerp(180, 620, ss(clamp((t - S(5)) / 1.2))) : 180 * ss(clamp((t - S(4)) / 0.8));
  const deeper = t > S(6) ? Math.sin((t - S(6)) * 5) * 8 + 40 * clamp((t - S(6)) / 2) : 0;
  const gy = 720, d = depth + deeper;
  ctx.save(); ctx.fillStyle = DIRT; ctx.fillRect(0, gy, 1080, 660); ctx.fillStyle = '#FDFDFC'; ctx.fillRect(380, gy, 320, d); ctx.restore();
  strokePath(ctx, [[0, gy], [380, gy], [380, gy + d], [700, gy + d], [700, gy], [1080, gy]], { w: 6, seed: 40 });
  // ladder showing the climb needed
  const lh = d; strokePath(ctx, [[600, gy + d], [600, gy - 40]], { w: 5, seed: 41 }); strokePath(ctx, [[660, gy + d], [660, gy - 40]], { w: 5, seed: 42 });
  for (let y = gy + d - 40; y > gy - 30; y -= 50) line(ctx, 600, y, 660, y, { w: 4, seed: 43 + Math.round(y) });
  fig(ctx, { x: 480, y: gy + d - 150, s: 0.85, seed: 44, t, mood: big ? 'cry' : 'worried', look: 1, arms: [[-25, -10], [100, 160]], legs: [[-14, -10], [14, 10]] });
  text(ctx, big ? '−50%' : '−10%', 230, gy + 120, { size: 90, c: RED });
  text(ctx, big ? '+100%' : '+11%', 860, gy + 120, { size: 90, c: GREEN });
  if (t > S(6)) { // shovel = bigger trades
    const a = Math.sin(t * 6) * 0.3; ctx.save(); ctx.translate(430, gy + d - 60); ctx.rotate(-0.6 + a); line(ctx, 0, 0, 0, -160, { w: 7, seed: 45 }); fillPoly(ctx, [[-30, 0], [30, 0], [0, 50]], GREY, 46, 0.3); ctx.restore();
    text(ctx, 'bade trades = gehra gaddha', 540, 600, { size: 58, c: RED, alpha: ramp(t, S(6)) }); }
}

function rule(ctx, t) { // 7-8
  writeText(ctx, 'EK RULE', 540, 240, S(7) + 0.05, t, { size: 120, c: GREEN, dur: 0.4 });
  const k = pop(t, at(7, 'din'), 0.4);
  if (k > 0) { ctx.save(); ctx.translate(540, 560); ctx.rotate(-0.03); ctx.scale(k, k); card(ctx, -380, -150, 760, 300, '#fff8de', 50);
    text(ctx, 'DIN KA MAX LOSS', 0, -40, { size: 72, c: NAVY }); text(ctx, 'example: ₹2,000', 0, 70, { size: 66, c: RED }); ctx.restore(); }
  if (t > S(8)) {
    const off = at(8, 'band'); const closed = t > off;
    ctx.save(); ctx.translate(300, 1000); ctx.scale(2, 2); phone(ctx, 0, 0, 1, 51); ctx.restore();
    if (closed) { ctx.save(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(225, 870, 150, 260); ctx.restore(); text(ctx, 'OFF', 300, 1010, { size: 50, c: '#fff' }); }
    const walk = clamp((t - at(8, 'uth')) / 2);
    fig(ctx, { x: 640 + walk * 300, y: 1060, s: 1.0, seed: 52, t, mood: closed ? 'smug' : 'neutral', look: closed ? 1 : -1,
      arms: [[-25, -10], [25, 10]], legs: walk > 0 && walk < 1 ? [[-20 * Math.sin(t * 9) - 4, -10], [20 * Math.sin(t * 9) + 4, 10]] : [[-14, -10], [14, 10]] });
  }
}

function ending(ctx, t) { // 9-10
  // sunrise "kal"
  const sy = lerp(1100, 850, ss(clamp((t - S(9)) / 2)));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, 1100); ctx.clip(); fillPoly(ctx, circlePts(540, sy, 170, 170, 30), '#f3d35b', 60, 0.3); strokePath(ctx, circlePts(540, sy, 170, 170, 30), { w: 5, seed: 61, close: true }); ctx.restore();
  strokePath(ctx, [[80, 1100], [1000, 1100]], { w: 6, seed: 62 });
  writeText(ctx, 'MARKET KAL BHI HOGA', 540, 260, S(9) + 0.05, t, { size: 80, c: NAVY, dur: 0.5 });
  if (t > at(9, 'bas')) { writeText(ctx, 'PAISA BHI HONA CHAHIYE', 540, 380, at(9, 'bas'), t, { size: 74, c: GREEN, dur: 0.5 }); coinStack(ctx, 820, 1100, 8, 1.8, 63); }
  fig(ctx, { x: 300, y: 980, s: 1.0, seed: 64, t, mood: 'grin', arms: [[-150, -175], [40, 20]], legs: [[-14, -10], [14, 10]] });
}

await K.run([[0, hook], [S(1) - 0.15, name], [S(4) - 0.15, hole], [S(7) - 0.15, rule], [S(9) - 0.15, ending]],
  { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. Investment advice nahi.' });
