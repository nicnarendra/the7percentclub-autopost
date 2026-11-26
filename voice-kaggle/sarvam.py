"""Sarvam Bulbul v3 voices for the same Hinglish test script. Needs SARVAM_API_KEY."""
import base64, io, json, os, sys, time
import numpy as np, requests, soundfile as sf
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get("SARVAM_API_KEY", "").strip()
if not KEY: print("no SARVAM_API_KEY; skipping"); sys.exit(0)
LINES = json.load(open(os.path.join(os.path.dirname(__file__), "lines.json"), encoding="utf-8"))
SR = 24000
def tts(text, speaker, pace):
    for attempt in range(3):
        r = requests.post("https://api.sarvam.ai/text-to-speech", timeout=60,
            headers={"api-subscription-key": KEY, "Content-Type": "application/json"},
            json={"text": text, "language_code": "hi-IN", "speaker": speaker, "model": "bulbul:v3",
                  "pace": pace, "speech_sample_rate": SR})
        if r.status_code == 200:
            a, sr = sf.read(io.BytesIO(base64.b64decode(r.json()["audios"][0])), dtype="float32")
            return a if a.ndim == 1 else a.mean(1)
        print(speaker, "HTTP", r.status_code, r.text[:300]); time.sleep(3)
    raise RuntimeError("sarvam failed")
def trim(a, thr=0.012):
    i = np.where(np.abs(a) > thr)[0]
    return a if not len(i) else a[max(0, i[0]-int(.03*SR)): min(len(a), i[-1]+int(.10*SR))]
for spk, pace in [("shubh", 1.1), ("manan", 1.1), ("aditya", 1.1), ("rahul", 1.1), ("kabir", 1.1), ("shreya", 1.1)]:
    try:
        parts, t, tim = [], 0.0, []
        for k, l in enumerate(LINES):
            a = trim(tts(l, spk, pace)); tim.append({"line": k, "start": round(t, 3), "end": round(t + len(a)/SR, 3)})
            parts += [a, np.zeros(int(.22*SR), np.float32)]; t += len(a)/SR + .22
        y = np.concatenate(parts); y = y / max(1e-6, np.abs(y).max()) * .9
        sf.write(f"{OUT}/sarvam_{spk}.wav", y, SR); json.dump(tim, open(f"{OUT}/sarvam_{spk}.json", "w"), indent=1)
        print("sarvam", spk, round(t, 1), "s")
    except Exception as e: print("sarvam voice failed", spk, e)
