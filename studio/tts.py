#!/usr/bin/env python3
"""Free voiceover with Kokoro (English, or Hindi/Hinglish with --lang hi: voice hm_omega) (open source, runs locally). Writes voice.wav, segments.json, words.json.
usage: python studio/tts.py <video-dir> [--speed 1.05] [--gap 0.3] [--voice am_michael] [--market us|in]
<video-dir>/lines.json = list of sentences (one per line of narration, as they should appear in captions)."""
import argparse, json, os, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("--speed", type=float, default=1.05)
ap.add_argument("--gap", type=float, default=0.3); ap.add_argument("--voice", default=None); ap.add_argument("--market", default="us"); ap.add_argument("--lang", default="en", help="en or hi (Hindi/Hinglish in Devanagari)")
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
audio, t, words, segs = [], 0.0, [], []
for ln in lines:
    spoken = ln
    for x, y in (SAY_HI if HI else SAY): spoken = spoken.replace(x, y)
    s, sr = k.create(spoken, voice=VOICE, speed=a.speed, lang="hi" if HI else "en-us")
    idx = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, idx[0] - 240): idx[-1] + 480]
    dur = len(s) / sr
    segs.append({"text": ln, "start": round(t, 3), "end": round(t + dur, 3)})
    toks = ln.split(); wts = [len(re.sub(r"\W", "", w)) + 2 for w in toks]; tot = sum(wts); c = t
    for w, wt in zip(toks, wts):
        d = dur * wt / tot; words.append({"text": w, "start": round(c, 3), "end": round(c + d * 0.92, 3)}); c += d
    audio += [s, np.zeros(int(a.gap * sr), dtype=s.dtype)]; t += dur + a.gap
sf.write(f"{a.dir}/voice.wav", np.concatenate(audio), sr)
json.dump(words, open(f"{a.dir}/words.json", "w"), indent=0); json.dump(segs, open(f"{a.dir}/segments.json", "w"), indent=1)
print("total", round(t, 2), "s")
for i, g in enumerate(segs): print(i, g["start"], g["end"], g["text"][:50])
