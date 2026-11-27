#!/usr/bin/env python3
"""Use the Sarvam 'Kabir' voice for a Hinglish Short (replaces tts.py for the India channel).
Step 1:  python studio/kabir_voice.py request <work-dir> <slug>
         -> writes voice-jobs/<slug>/lines.json from <work-dir>/voice_lines.json. Commit + push it; the
            "Hinglish voice (Sarvam Kabir)" GitHub workflow voices it in ~1-2 min and pushes voice.wav + timing.json.
Step 2:  git pull until voice-jobs/<slug>/voice.wav exists (poll every 30 s, give up after 15 min).
Step 3:  python studio/kabir_voice.py apply <work-dir> <slug>
         -> copies voice.wav into <work-dir>, writes segments.json + words.json from display.json (captions),
            snapping caption phrases to the pauses in the voice.
voice_lines.json: one sentence per line, Devanagari Hindi with English words in English letters, numbers written as
spoken ("three point seven five percent", "एक लाख रुपये"), last line "Follow करो The Seven Percent Club!".
display.json: same sentences in Roman Hinglish with digits and ₹ (what the captions show). Same number of lines."""
import json, os, re, shutil, sys
import numpy as np, soundfile as sf
mode, W, slug = sys.argv[1], sys.argv[2].rstrip("/"), sys.argv[3]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); J = f"{ROOT}/voice-jobs/{slug}"
if mode == "request":
    lines = json.load(open(f"{W}/voice_lines.json", encoding="utf-8")); disp = json.load(open(f"{W}/display.json", encoding="utf-8"))
    assert len(lines) == len(disp), "voice_lines.json and display.json need the same number of lines"
    os.makedirs(J, exist_ok=True)
    json.dump({"speaker": "kabir", "pace": 1.1, "lines": lines}, open(f"{J}/lines.json", "w"), ensure_ascii=False, indent=1)
    print("wrote", J + "/lines.json  -> git add -f, commit, push, then poll for voice.wav"); sys.exit(0)
tim = json.load(open(f"{J}/timing.json")); disp = json.load(open(f"{W}/display.json", encoding="utf-8"))
assert len(tim) == len(disp)
shutil.copy(f"{J}/voice.wav", f"{W}/voice.wav"); x, sr = sf.read(f"{W}/voice.wav")
fr = int(.01 * sr); e = np.sqrt(np.convolve(x ** 2, np.ones(fr) / fr, "same"))
segs, words = [], []
for t, shown in zip(tim, disp):
    s, en = t["start"], t["end"]; segs.append({"text": shown, "start": s, "end": en})
    phrases = [p for p in re.split(r"(?<=[,.?!:])\s+", shown) if p]
    a, b = int(s * sr), int(en * sr); seg = e[a:b]; thr = max(0.01, np.percentile(seg, 90) * 0.08); q = seg < thr; pauses = []; i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) / sr >= 0.09 and i > 0 and j < len(q): pauses.append(((i + j) / 2) / sr + s)
            i = j
        else: i += 1
    wts = [sum(len(re.sub(r"\W", "", w)) + 2 for w in p.split()) for p in phrases]; tot = sum(wts); bounds = [s]; c = s
    for k in range(len(phrases) - 1):
        c += (en - s) * wts[k] / tot; near = [p for p in pauses if abs(p - c) < 0.6 and p > bounds[-1] + 0.2]
        bounds.append(min(near, key=lambda p: abs(p - c)) if near else c)
    bounds.append(en)
    for k, p in enumerate(phrases):
        toks = p.split(); w = [len(re.sub(r"\W", "", z)) + 2 for z in toks]; tt = sum(w); cc = bounds[k]
        for z, wt in zip(toks, w):
            d = (bounds[k + 1] - bounds[k]) * wt / tt; words.append({"text": z, "start": round(cc, 3), "end": round(cc + d * .92, 3)}); cc += d
json.dump(segs, open(f"{W}/segments.json", "w"), indent=1, ensure_ascii=False); json.dump(words, open(f"{W}/words.json", "w"), indent=0, ensure_ascii=False)
print("total", round(segs[-1]["end"], 2), "s"); [print(i, g["start"], g["end"], g["text"][:50]) for i, g in enumerate(segs)]
