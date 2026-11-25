// Shared boilerplate for 9:16 B1 Shorts: timing, captions, transitions, stills/render loop.
// usage in a scene file:
//   import { kit } from '../../lib/kit.mjs';
//   const K = await kit(import.meta.url, { lead: 0.3 });
//   const { S, at, R } = K;  ... define scene functions (ctx, t) ...
//   await K.run([[0, hook], [S(1) - 0.15, next], ...], { end: 'Follow karo The 7% Club', disclaimer: 'Sirf jaankari ke liye. Investment advice nahi.' });
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';

export async function kit(sceneUrl, { lead = 0.3, tail = 1.8 } = {}) {
  const require = createRequire(new URL('../package.json', import.meta.url));
  const { createCanvas } = require('@napi-rs/canvas');
  const R = await import('./draw.mjs');
  const W = 1080, H = 1920, FPS = 30;
  const rd = f => JSON.parse(fs.readFileSync(new URL(f, sceneUrl)));
  const SEG = rd('./segments.json').map(s => ({ ...s, start: s.start + lead, end: s.end + lead }));
  const WORDS = rd('./words.json').map(w => ({ ...w, start: w.start + lead, end: w.end + lead }));
  const S = i => SEG[i].start, E = i => SEG[i].end;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9₹%]/g, '');
  const at = (i, w) => { const x = WORDS.find(o => o.start >= SEG[i].start - 0.01 && o.start <= SEG[i].end && norm(o.text).startsWith(norm(w))); return x ? x.start : SEG[i].start; };
  const END = SEG[SEG.length - 1].end + tail;
  const CUES = (() => { const cues = []; let cur = [];
    const flush = () => { if (cur.length) { cues.push({ start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map(w => w.text).join(' ') }); cur = []; } };
    for (const w of WORDS) { cur.push(w); const tt = cur.map(x => x.text).join(' '); if (/[.?!:,]$/.test(w.text) || tt.length > 22) flush(); }
    flush(); cues.forEach((c, i) => { const nx = cues[i + 1]; c.end = Math.min(nx ? nx.start - 0.02 : c.end + 0.8, c.end + 0.6); }); return cues; })();
  const dir = new URL('./', sceneUrl).pathname;

  async function run(SCENES, { end, disclaimer } = {}) {
    const { text, paper, pop, ramp, ss, lerp, clamp } = R;
    const last = SEG.length - 1, GREEN = '#2f9a5a', GREY = '#9aa0a6';
    function drawFrame(ctx, t) {
      paper(ctx);
      let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
      const [t0, fn] = SCENES[idx]; const k = idx ? ss((t - t0) / 0.18) : 1;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30); fn(ctx, t); ctx.restore();
      if (k < 1 && idx) { ctx.save(); ctx.globalAlpha = 1 - k; SCENES[idx - 1][1](ctx, t); ctx.restore(); }
      if (end && t > E(last) - 1.2) { const kk = pop(t, E(last) - 1.2, 0.4); text(ctx, end, 540, 1420, { size: 70, c: GREEN, alpha: clamp(kk * 2), scale: lerp(0.7, 1, kk) }); }
      if (disclaimer && t > E(last) + 0.3) text(ctx, disclaimer, 540, 1490, { size: 40, c: GREY, weight: 'normal', alpha: ramp(t, E(last) + 0.3, 0.3) });
      const c = CUES.find(c => t >= c.start - 0.05 && t <= c.end);
      if (c) text(ctx, c.text, 540, 1565, { size: 76, c: '#2b2b2b', weight: 'bold' });
    }
    const canvas = createCanvas(W, H); const ctx = canvas.getContext('2d');
    const args = process.argv.slice(2);
    if (args[0] === '--stills') {
      for (const t of args.slice(1).map(Number)) { drawFrame(ctx, t); fs.writeFileSync(`${dir}st-${String(t.toFixed(1)).padStart(5, '0')}.png`, canvas.toBuffer('image/png')); }
      return;
    }
    const out = dir + 'picture.mp4';
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let n = 0; n < Math.round(END * FPS); n++) { drawFrame(ctx, n / FPS); const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, END.toFixed(2));
  }
  return { R, W, H, SEG, WORDS, S, E, at, END, run };
}
