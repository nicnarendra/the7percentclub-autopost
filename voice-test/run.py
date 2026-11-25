"""Voice test: voice the same Hinglish script with one open-source engine.

Usage: python voice-test/run.py veena|parler|chatterbox
Writes voice-test/out/<engine>.mp3 and <engine>-log.txt.
Runs on the GitHub Actions robot (CPU only), not in the daily pipeline.
"""
import json, os, re, subprocess, sys, time, traceback

import numpy as np
import soundfile as sf

ENGINE = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)
LINES = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
SPLIT = re.compile(r"(?<=[.?!।])\s+")
LOG = open(os.path.join(OUT, f"{ENGINE}-log.txt"), "w", encoding="utf-8")


def log(*a):
    msg = " ".join(str(x) for x in a)
    print(msg, flush=True)
    LOG.write(msg + "\n")
    LOG.flush()


# ---------------------------------------------------------------- engines
def load_veena():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from snac import SNAC

    torch.set_num_threads(os.cpu_count() or 4)
    model = tok = None
    for rid in ("maya-research/veena-tts", "maya-research/Veena"):
        try:
            tok = AutoTokenizer.from_pretrained(rid)
            model = AutoModelForCausalLM.from_pretrained(rid, torch_dtype=torch.bfloat16)
            log("loaded", rid)
            break
        except Exception as e:
            log("could not load", rid, "->", repr(e)[:300])
    if model is None:
        raise RuntimeError("Veena model not available")
    model.eval()
    snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval()
    BASE, SOS, EOS, SOH, EOH, SOA, EOA = 128266, 128257, 128258, 128259, 128260, 128261, 128262
    speaker = os.environ.get("VEENA_SPEAKER", "agastya")

    def decode(tokens, per_pos):
        lv = [[], [], []]
        for i in range(0, len(tokens) - 6, 7):
            f = tokens[i:i + 7]
            c = [f[j] - BASE - (j * 4096 if per_pos else 0) for j in range(7)]
            if any(x < 0 or x > 4095 for x in c):
                return None
            lv[0].append(c[0]); lv[1] += [c[1], c[4]]; lv[2] += [c[2], c[3], c[5], c[6]]
        if not lv[0]:
            return None
        with torch.inference_mode():
            audio = snac.decode([torch.tensor(l).unsqueeze(0) for l in lv])
        return audio.squeeze().clamp(-1, 1).float().numpy()

    def synth(text):
        ids = tok.encode(f"<spk_{speaker}> {text}", add_special_tokens=False)
        inp = torch.tensor([[SOH] + ids + [EOH, SOA, SOS]])
        with torch.inference_mode():
            out = model.generate(
                inp, attention_mask=torch.ones_like(inp),
                max_new_tokens=min(1400, len(text) * 14 + 140),
                do_sample=True, temperature=0.4, top_p=0.9, repetition_penalty=1.05,
                eos_token_id=[EOS, EOA], pad_token_id=tok.pad_token_id or 0)
        gen = [t for t in out[0][inp.shape[1]:].tolist() if BASE <= t < BASE + 7 * 4096]
        audio = decode(gen, True)
        if audio is None:
            audio = decode(gen, False)
        if audio is None:
            raise RuntimeError(f"no decodable audio ({len(gen)} tokens)")
        return audio, 24000

    return synth


def load_parler():
    import torch
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    torch.set_num_threads(os.cpu_count() or 4)
    rid = "ai4bharat/indic-parler-tts"
    model = ParlerTTSForConditionalGeneration.from_pretrained(rid).eval()
    tok = AutoTokenizer.from_pretrained(rid)
    dtok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    desc = os.environ.get("PARLER_DESC",
        "Rohit speaks in a confident, warm and conversational tone with natural expression, "
        "at a moderate pace. The recording is very clear and close-up, with no background noise.")
    d = dtok(desc, return_tensors="pt")

    def synth(text):
        p = tok(text, return_tensors="pt")
        with torch.inference_mode():
            g = model.generate(input_ids=d.input_ids, attention_mask=d.attention_mask,
                               prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
        return g.cpu().numpy().squeeze().astype(np.float32), model.config.sampling_rate

    return synth


def load_chatterbox():
    import torch
    _load = torch.load
    torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": "cpu"})
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    torch.set_num_threads(os.cpu_count() or 4)
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    ref = os.path.join(HERE, "ref_male.wav")

    def synth(text):
        wav = model.generate(text, language_id="hi", audio_prompt_path=ref,
                             exaggeration=0.5, cfg_weight=0.5)
        return wav.squeeze().cpu().numpy().astype(np.float32), model.sr

    return synth


# ---------------------------------------------------------------- assembly
def trim(a, sr, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    s = max(0, idx[0] - int(0.05 * sr)); e = min(len(a), idx[-1] + int(0.15 * sr))
    return a[s:e]


def main():
    t0 = time.time()
    synth = {"veena": load_veena, "parler": load_parler, "chatterbox": load_chatterbox}[ENGINE]()
    log(f"model ready in {time.time() - t0:.0f}s")
    parts, sr = [], None
    for li, line in enumerate(LINES):
        sents = [s for s in SPLIT.split(line.strip()) if s]
        for si, s in enumerate(sents):
            t1 = time.time()
            a, sr = synth(s)
            a = trim(a, sr)
            log(f"line {li + 1} sent {si + 1}: {len(a) / sr:.2f}s audio in {time.time() - t1:.0f}s")
            parts.append(a)
            last = si == len(sents) - 1
            gap = 0.7 if s.endswith("?") else (0.6 if last else 0.35)
            if li == len(LINES) - 1 and last:
                gap = 0.3
            parts.append(np.zeros(int(gap * sr), np.float32))
    audio = np.concatenate(parts)
    audio = audio / max(1e-6, np.abs(audio).max()) * 0.9
    wav = os.path.join(OUT, f"{ENGINE}.wav")
    sf.write(wav, audio, sr)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav,
                    "-af", "loudnorm=I=-16:TP=-1.5", "-b:a", "128k",
                    os.path.join(OUT, f"{ENGINE}.mp3")], check=True)
    os.remove(wav)
    log(f"done: {len(audio) / sr:.1f}s of audio, total {time.time() - t0:.0f}s")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("FAILED\n" + traceback.format_exc())
        sys.exit(1)
