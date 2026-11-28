# Kaggle GPU voice test for The 7% Club (Hinglish). Runs Veena and Maya 2 Native built-in voices.
# Output: /kaggle/working/<engine>_<voice>.wav + .json (line timings) + log.txt
import json, os, subprocess, sys, textwrap, time, traceback
W = "/kaggle/working"; os.makedirs(W, exist_ok=True)
LOG = open(f"{W}/log.txt", "a")
def log(*a):
    m = " ".join(str(x) for x in a); print(m, flush=True); LOG.write(m + "\n"); LOG.flush()
LINES = [
 "पाँच हज़ार का loss हुआ... तो आपने बीस हज़ार का trade ले लिया, वापस जीतने के लिए। रुको!",
 "इसे कहते हैं revenge trading, और ये accounts खा जाता है।",
 "Loss के बाद, दिमाग चाहता है कि दर्द अभी के अभी ख़त्म हो।",
 "तो आप बड़ा trade लेते हो, जल्दी में, और बिना plan के।",
 "Account का ten percent गया, तो वापस आने के लिए eleven percent चाहिए।",
 "आधा गया? तो break-even के लिए hundred percent चाहिए।",
 "Loss के बाद बड़े trades ये गड्ढा और गहरा करते हैं, और जल्दी।",
 "तो market खुलने से पहले एक rule set करो: दिन का maximum loss।",
 "वो hit हुआ, तो app बंद करो, और उठ जाओ।",
 "Market कल भी रहेगा... बस ध्यान रखो, आपका पैसा भी रहे।",
 "Follow करो The Seven Percent Club!"]
json.dump(LINES, open(f"{W}/lines.json", "w"), ensure_ascii=False)

ASSEMBLE = textwrap.dedent('''
import numpy as np, soundfile as sf, json
def pitch(a, sr):
    import librosa
    y = librosa.resample(np.asarray(a, dtype=np.float32).squeeze(), orig_sr=sr, target_sr=16000)
    f0, vd, _ = librosa.pyin(y, fmin=70, fmax=400, sr=16000, frame_length=1024)
    f = f0[vd]
    return float(np.median(f)) if len(f) > 5 else 0.0
BANDS = {"male": (80, 165), "female": (170, 320)}
def pick(gen, sex, tries=8, log=print):
    lo, hi = BANDS[sex]; best, bd = None, 1e9
    for k in range(tries):
        a = gen(k)
        if a is None: continue
        p = pitch(a, 24000); mid = (lo + hi) / 2
        if lo <= p <= hi: return a, p, k + 1
        d = abs(p - mid)
        if d < bd: best, bd = (a, p), d
    return (best[0], best[1], -1) if best else (None, 0, -1)
def trim(a, sr, thr=0.012):
    i = np.where(np.abs(a) > thr)[0]
    return a if not len(i) else a[max(0, i[0]-int(.03*sr)): min(len(a), i[-1]+int(.10*sr))]
def assemble(parts, sr, path):
    out, t, tim = [], 0.0, []
    for k, a in enumerate(parts):
        a = trim(np.asarray(a, dtype=np.float32).squeeze(), sr)
        tim.append({"line": k, "start": round(t, 3), "end": round(t + len(a)/sr, 3)})
        out += [a, np.zeros(int(0.22*sr), np.float32)]; t += len(a)/sr + 0.22
    y = np.concatenate(out); y = y / max(1e-6, np.abs(y).max()) * 0.9
    sf.write(path + ".wav", y, sr); json.dump(tim, open(path + ".json", "w"), indent=1)
    return t
''')
open(f"{W}/assemble.py", "w").write(ASSEMBLE)

def sh(cmd):
    log("$", cmd); r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    log((r.stdout + r.stderr)[-3000:]); return r.returncode

# ---------------- Veena (Apache-2.0): voices agastya (male), kavya (female)
VEENA = textwrap.dedent('''
import sys, json, time, torch
sys.path.insert(0, "/kaggle/working"); from assemble import assemble
from transformers import AutoModelForCausalLM, AutoTokenizer
from snac import SNAC
L = json.load(open("/kaggle/working/lines.json"))
rid = None
for r in ("maya-research/veena-tts", "maya-research/Veena"):
    try:
        tok = AutoTokenizer.from_pretrained(r); model = AutoModelForCausalLM.from_pretrained(r, torch_dtype=torch.float16, device_map="cuda"); rid = r; break
    except Exception as e: print("load fail", r, repr(e)[:300])
model.eval(); snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval().cuda()
BASE, SOS, EOS, SOH, EOH, SOA, EOA = 128266, 128257, 128258, 128259, 128260, 128261, 128262
def decode(tokens, per_pos):
    lv = [[], [], []]
    for i in range(0, len(tokens) - 6, 7):
        f = tokens[i:i+7]; c = [f[j] - BASE - (j*4096 if per_pos else 0) for j in range(7)]
        if any(x < 0 or x > 4095 for x in c): return None
        lv[0].append(c[0]); lv[1] += [c[1], c[4]]; lv[2] += [c[2], c[3], c[5], c[6]]
    if not lv[0]: return None
    with torch.inference_mode(): a = snac.decode([torch.tensor(l).unsqueeze(0).cuda() for l in lv])
    return a.squeeze().clamp(-1, 1).float().cpu().numpy()
def synth(text, spk):
    ids = tok.encode(f"<spk_{spk}> {text}", add_special_tokens=False)
    inp = torch.tensor([[SOH] + ids + [EOH, SOA, SOS]]).cuda()
    with torch.inference_mode():
        out = model.generate(inp, attention_mask=torch.ones_like(inp), max_new_tokens=min(2000, len(text)*16+200),
            do_sample=True, temperature=0.4, top_p=0.9, repetition_penalty=1.05, eos_token_id=[EOS, EOA], pad_token_id=tok.pad_token_id or 0)
    gen = [t for t in out[0][inp.shape[1]:].tolist() if BASE <= t < BASE + 7*4096]
    a = decode(gen, True)
    return a if a is not None else decode(gen, False)
from assemble import pick
SEX = {"agastya": "male", "vinaya": "male", "kavya": "female", "maitri": "female"}
for spk in ["agastya", "vinaya", "kavya", "maitri"]:
    t0 = time.time(); parts, rep = [], []
    for i, l in enumerate(L):
        def gen(k, l=l, i=i):
            torch.manual_seed(1000 * i + k); return synth(l, spk)
        a, p, n = pick(gen, SEX[spk]); parts.append(a); rep.append(f"{int(p)}Hz/{n}")
    d = assemble(parts, 24000, f"/kaggle/working/veena_{spk}")
    print("veena", spk, round(d,1), "s audio in", round(time.time()-t0), "s | pitch/tries per line:", " ".join(rep))
''')
# ---------------- Maya 2 Native (Apache-2.0): built-in Hindi voices
MAYA = textwrap.dedent('''
import sys, json, time
sys.path.insert(0, "/kaggle/working"); from assemble import assemble
from maya3 import Maya3TTS
L = json.load(open("/kaggle/working/lines.json"))
tts = Maya3TTS.from_pretrained("maya-research/maya2-native", max_seats=1)
for v in ["Siddhant", "Akshat", "Satvik", "Ritvik", "Ahana"]:
    try:
        from assemble import pick
        sex = "female" if v in ("Ahana",) else "male"; t0 = time.time(); parts, rep = [], []
        for l in L:
            a, p, n = pick(lambda k, l=l: tts.generate(l, lang="hi", voice=v, normalize=True), sex); parts.append(a); rep.append(f"{int(p)}Hz/{n}")
        d = assemble(parts, 24000, f"/kaggle/working/maya_{v}")
        print("maya", v, round(d,1), "s audio in", round(time.time()-t0), "s | pitch/tries per line:", " ".join(rep))
    except Exception as e: print("maya voice fail", v, repr(e)[:400])
tts.close()
''')
open(f"{W}/veena_job.py", "w").write(VEENA); open(f"{W}/maya_job.py", "w").write(MAYA)
sh("nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv")
t = time.time()
if sh("pip install -q snac soundfile librosa") == 0:
    sh(f"{sys.executable} {W}/veena_job.py")
log(f"veena section {time.time()-t:.0f}s")
t = time.time()
if sh("pip install -q uv && uv venv -q /tmp/maya && "
      "uv pip install -q --python /tmp/maya/bin/python soundfile numpy librosa \"maya3 @ git+https://github.com/MayaResearch/maya2-native\" "
      "--extra-index-url https://download.pytorch.org/whl/cu128 --index-strategy unsafe-best-match") == 0:
    sh(f"/tmp/maya/bin/python {W}/maya_job.py")
log(f"maya section {time.time()-t:.0f}s")
for f in ["veena_job.py", "maya_job.py", "assemble.py"]:
    try: os.remove(f"{W}/{f}")
    except OSError: pass
log("ALL DONE")
