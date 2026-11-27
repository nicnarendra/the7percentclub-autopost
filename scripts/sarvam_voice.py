"""Voice every voice-jobs/<slug>/lines.json that has no voice.wav yet, with Sarvam Bulbul v3.
lines.json = {"speaker": "kabir", "pace": 1.1, "lines": [...]}  (Devanagari Hindi, English words in English letters)
Writes voice.wav (24 kHz mono, 0.22 s between lines) and timing.json ([{line,start,end}]). Needs SARVAM_API_KEY."""
import base64, glob, io, json, os, sys, time
import numpy as np, requests, soundfile as sf
KEY = os.environ.get("SARVAM_API_KEY", "").strip()
if not KEY: sys.exit("SARVAM_API_KEY missing")
SR, GAP = 24000, 0.22
def tts(text, speaker, pace):
    for attempt in range(4):
        r = requests.post("https://api.sarvam.ai/text-to-speech", timeout=90,
            headers={"api-subscription-key": KEY, "Content-Type": "application/json"},
            json={"text": text, "language_code": "hi-IN", "speaker": speaker, "model": "bulbul:v3", "pace": pace, "speech_sample_rate": SR})
        if r.status_code == 200:
            a, _ = sf.read(io.BytesIO(base64.b64decode(r.json()["audios"][0])), dtype="float32")
            return a if a.ndim == 1 else a.mean(1)
        print("HTTP", r.status_code, r.text[:200]); time.sleep(4 * (attempt + 1))
    raise RuntimeError("Sarvam failed for: " + text[:60])
def trim(a, thr=0.012):
    i = np.where(np.abs(a) > thr)[0]
    return a if not len(i) else a[max(0, i[0] - int(.03 * SR)): min(len(a), i[-1] + int(.10 * SR))]
bad = 0
for f in sorted(glob.glob("voice-jobs/*/lines.json")):
    d = os.path.dirname(f)
    if os.path.exists(f"{d}/voice.wav"): continue
    try:
        job = json.load(open(f, encoding="utf-8")); parts, t, tim = [], 0.0, []
        for k, line in enumerate(job["lines"]):
            a = trim(tts(line, job.get("speaker", "kabir"), job.get("pace", 1.1)))
            tim.append({"line": k, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
            parts += [a, np.zeros(int(GAP * SR), np.float32)]; t += len(a) / SR + GAP
        y = np.concatenate(parts); y = y / max(1e-6, np.abs(y).max()) * 0.9
        sf.write(f"{d}/voice.wav", y, SR); json.dump(tim, open(f"{d}/timing.json", "w"), indent=1)
        print("voiced", d, round(t, 1), "s")
    except Exception as e:
        bad += 1; print("FAILED", d, e)
sys.exit(1 if bad else 0)
