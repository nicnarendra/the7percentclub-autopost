#!/usr/bin/env python3
"""Free voiceover with Kokoro (English, or Hindi/Hinglish with --lang hi: voice hm_omega) (open source, runs locally). Writes voice.wav, segments.json, words.json.
usage: python studio/tts.py <video-dir> [--speed 1.0] [--gap-sent 0.42 --gap-line 0.55 --gap-q 0.7] [--voice am_michael] [--market us|in]
<video-dir>/lines.json = list of sentences (one per line of narration, as they should appear in captions)."""
import argparse, json, os, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("--speed", type=float, default=1.0)
ap.add_argument("--gap", type=float, default=None, help="(old) ignored; use --gap-sent/--gap-line"); ap.add_argument("--gap-sent", type=float, default=0.42); ap.add_argument("--gap-line", type=float, default=0.55); ap.add_argument("--gap-q", type=float, default=0.7); ap.add_argument("--voice", default=None); ap.add_argument("--market", default="us"); ap.add_argument("--lang", default="en", help="en or hi (Hindi/Hinglish in Devanagari)")
a = ap.parse_args()
HI = a.lang == "hi"
VOICE = a.voice or ("hm_omega" if HI else "am_michael")
M = os.path.expanduser(os.environ.get("KOKORO_DIR", "~/.cache/kokoro"))
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
SAY = [("401(k)", "four oh one K"), ("Roth IRA", "Roth I.R.A."), ("traditional IRA", "traditional I.R.A."), ("an IRA", "an I.R.A."),
       ("HSA", "H.S.A."), ("ETF", "E.T.F."), ("S&P 500", "S and P five hundred"), ("SIP", "S.I.P."), ("F&O", "F and O"), ("SEBI", "Sebi"),
       ("2022", "twenty twenty-two"), ("2025", "twenty twenty-five"), ("2026", "twenty twenty-six"), ("2027", "twenty twenty-seven"), ("₹", " rupees ")]
SAY_HI = [("SIP", "एसआईपी"), ("F&O", "एफ एंड ओ"), ("SEBI", "सेबी"), ("RBI", "आरबीआई"), ("NSE", "एनएसई"), ("EMI", "ईएमआई"),
          ("FD", "एफडी"), ("CIBIL", "सिबिल"), ("GST", "जीएसटी"), ("STT", "एसटीटी"), ("%", " प्रतिशत"), ("₹", "")]
lines = json.load(open(f"{a.dir}/lines.json"))
# Optional display.json: what the captions show (e.g. Roman Hinglish) while lines.json is what the voice says (Devanagari).
import os.path
display = json.load(open(f"{a.dir}/display.json")) if os.path.exists(f"{a.dir}/display.json") else lines
assert len(display) == len(lines), "display.json must have one entry per line in lines.json"
audio, t, words, segs = [], 0.0, [], []
SPLIT = re.compile(r"(?<=[.?!।])\s+")
def synth(text):
    spoken = text
    for x, y in (SAY_HI if HI else SAY): spoken = spoken.replace(x, y)
    s, sr = k.create(spoken, voice=VOICE, speed=a.speed, lang="hi" if HI else "en-us")
    idx = np.where(np.abs(s) > 0.008)[0]
    # keep a little air around each phrase so word starts/ends are not clipped
    return s[max(0, idx[0] - int(0.06 * sr)): idx[-1] + int(0.15 * sr)], sr
for li, (ln, shown) in enumerate(zip(lines, display)):
    sp, sh = SPLIT.split(ln.strip()), SPLIT.split(shown.strip())
    if len(sp) != len(sh): sp, sh = [ln], [shown]
    line_start = t
    for j, (x, y) in enumerate(zip(sp, sh)):
        s, sr = synth(x); dur = len(s) / sr
        toks = y.split(); wts = [len(re.sub(r"\W", "", w)) + 2 for w in toks]; tot = sum(wts); c = t + 0.04
        for w, wt in zip(toks, wts):
            d = (dur - 0.12) * wt / tot; words.append({"text": w, "start": round(c, 3), "end": round(c + d * 0.92, 3)}); c += d
        last = j == len(sp) - 1
        # natural rhythm: short breath between sentences of a line, longer at line ends, longest after a question/hook
        gap = (a.gap_q if y.rstrip().endswith("?") else (a.gap_line if last else a.gap_sent))
        if li == len(lines) - 1 and last: gap = 0.2
        audio += [s, np.zeros(int(gap * sr), dtype=s.dtype)]; t += dur
        seg_end = t; t += gap
    segs.append({"text": shown, "start": round(line_start, 3), "end": round(seg_end, 3)})
sf.write(f"{a.dir}/voice.wav", np.concatenate(audio), sr)
json.dump(words, open(f"{a.dir}/words.json", "w"), indent=0); json.dump(segs, open(f"{a.dir}/segments.json", "w"), indent=1)
print("total", round(t, 2), "s")
for i, g in enumerate(segs): print(i, g["start"], g["end"], g["text"][:50])
