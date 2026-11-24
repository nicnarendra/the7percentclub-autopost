import json, numpy as np, soundfile as sf, re
from kokoro_onnx import Kokoro
k = Kokoro("/home/claude/tts/kokoro-v1.0.onnx", "/home/claude/tts/voices-v1.0.bin")
lines = json.load(open("lines.json")); GAP = 0.38
audio, t, words, segs = [], 0.0, [], []
for ln in lines:
    s, sr = k.create(ln.replace("401(k)", "four oh one K").replace("Roth IRA", "Roth I.R.A.").replace("traditional IRA", "traditional I.R.A.").replace("2026", "twenty twenty-six"), voice="am_michael", speed=0.95, lang="en-us")
    # trim leading/trailing near-silence
    idx = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, idx[0]-240): idx[-1]+480]
    dur = len(s) / sr
    segs.append({"text": ln, "start": round(t, 3), "end": round(t + dur, 3)})
    toks = ln.split(); weights = [len(re.sub(r"\W", "", w)) + 2 for w in toks]; tot = sum(weights); c = t
    for w, wt in zip(toks, weights):
        d = dur * wt / tot; words.append({"text": w, "start": round(c, 3), "end": round(c + d * 0.92, 3)}); c += d
    audio += [s, np.zeros(int(GAP * sr), dtype=s.dtype)]; t += dur + GAP
sf.write("voice.wav", np.concatenate(audio), sr)
json.dump(words, open("words.json", "w"), indent=0); json.dump(segs, open("segments.json", "w"), indent=1)
print("total", round(t, 2), "s")
for i, g in enumerate(segs): print(i, g["start"], g["end"], g["text"][:40])
