import sys,re
src,dst=sys.argv[1],sys.argv[2]
s=open(src).read()
pal={"'#FDFDFC'":"'#F3EFE6'","'#2f9a5a'":"'#5d8a5a'","'#e0452f'":"'#b86f52'","'#27406b'":"'#4f6f8f'","'#f3d35b'":"'#d9b45f'",
"'#d9ecdd'":"'#dfe6d6'","'#f9d6cf'":"'#f0d2c6'","'#fff8de'":"'#f6ecd2'","'#dde6f3'":"'#dde3e8'","'#9fd6b2'":"'#a9bea3'","'#f4b9ae'":"'#e3a89a'",
"'#cfe8d6'":"'#dfe6d6'","'#e9d9a8'":"'#e6d3a3'","'#f6c9d0'":"'#e3a89a'","'#fff'":"'#FBF8F1'","'#ececec'":"'#e6e0d4'"}
for a,b in pal.items(): s=s.replace(a,b)
# no grid: warm paper with faint fibre texture
s=re.sub(r"function paper\(ctx\) \{.*?\n\}\n", """function paper(ctx) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(120,100,70,.035)'; for (let i = 0; i < 900; i++) { const x = (i * 733) % W, y = (i * 389) % H; ctx.fillRect(x, y, 2, 2); }
}
""", s, count=1, flags=re.S)
# B2 wrappers: thin hand headings, Noto Sans numbers, finer ink figures
s=s.replace("const R = await import(", "const R0 = await import(")
s=s.replace("const { fig, text,", "const R = { ...R0 };\nconst { GlobalFonts } = require('@napi-rs/canvas'); GlobalFonts.registerFromPath(new URL('../../assets/fonts/NotoSans.ttf', import.meta.url).pathname, 'Sans');\nconst { fig: fig0, text: text0,")
s=s.replace("} = R;\n", """} = R;
const IVORY_HEAD = '#FBF8F1';
const fig = (ctx, o) => fig0(ctx, { ...o, lw: o.lw ? o.lw * 0.7 : 3.6, headFill: o.headFill || IVORY_HEAD, c: o.c || '#3a3a37' });
function text(ctx, s, x, y, o = {}) {
  if (/^[\\$≈~−+-]?[\\$0-9]/.test(s) && /[0-9]/.test(s)) { const a = o.alpha ?? 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.scale || 1, o.scale || 1);
    ctx.font = `700 ${Math.round((o.size || 80) * 0.78)}px Sans`; ctx.fillStyle = o.c || '#3a3a37'; ctx.textAlign = o.align || 'center'; ctx.fillText(s, 0, 0); ctx.restore(); return; }
  text0(ctx, s, x, y, { ...o, weight: o.weight === 'normal' ? 'normal' : (o.size || 80) >= 60 ? 'normal' : 'bold', c: o.c || '#3a3a37' });
}
""",1)
open(dst,'w').write(s)
