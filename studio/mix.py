#!/usr/bin/env python3
"""Final audio mix: voice (EQ + compressor) on top, music ducked under it, light SFX, loudness -14 LUFS.
usage: python studio/mix.py <video-dir> --lead 0.3 [--music decisions|investigations] [--chapters 4,15,26] [--sfx sfx.json]
Reads <dir>/picture.mp4, voice.wav, segments.json. Writes <dir>/final.mp4.
--chapters: line indexes where a new scene starts (swish + pop). Default: every line (good for Shorts).
--sfx: optional JSON list of [name, seconds, gain] with name in: pop, error, click, drop, swish, swish2, coin, bell, page."""
import argparse, json, subprocess, os
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("--lead", type=float, default=0.3)
ap.add_argument("--music", default="decisions"); ap.add_argument("--chapters", default=""); ap.add_argument("--sfx", default="")
a = ap.parse_args(); D = a.dir.rstrip("/")
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets/audio/audio/")
N = {"pop": "rubberduck-water-40/bubble_01.ogg", "error": "kenney-interface/error_002.ogg", "click": "kenney-interface/click_002.ogg",
     "drop": "kenney-interface/drop_002.ogg", "swish": "artisticdude-swishes/swish-1.wav", "swish2": "artisticdude-swishes/swish-10.wav",
     "coin": "kenney-rpg/handleCoins.ogg", "bell": "kenney-impact/impactBell_heavy_001.ogg", "page": "kenney-rpg/bookFlip1.ogg"}
# *.wav is git-ignored, so the swish files are missing in a fresh clone: fall back to a committed page-flip sound.
N = {k: (v if os.path.exists(A + v) else "kenney-rpg/bookFlip1.ogg") for k, v in N.items()}
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{D}/picture.mp4"]).decode().strip())
seg = [s["start"] + a.lead for s in json.load(open(f"{D}/segments.json"))]
ch = [int(x) for x in a.chapters.split(",") if x]  # scene changes only; no SFX on every line (it fights the voice rhythm)
sfx = [("swish", seg[i] - 0.35, .10) for i in ch if i < len(seg)]
if a.sfx: sfx += [tuple(x) for x in json.load(open(a.sfx))]
inp = ["-i", f"{D}/picture.mp4", "-i", f"{D}/voice.wav", "-stream_loop", "-1", "-i", A + f"music/bgm-{a.music}.mp3"]
f = [f"[1:a]aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=150:makeup=4dB,adelay={int(a.lead*1000)}:all=1,apad=whole_dur={dur},asplit=2[vo][vk]",
     f"[2:a]aresample=48000,atrim=0:{dur},volume={0.045 if dur < 70 else 0.04},afade=t=in:d=0.8,afade=t=out:st={max(dur-2,0)}:d=2[m0]",
     "[m0][vk]sidechaincompress=threshold=0.03:ratio=4:attack=80:release=1200[mu]"]
mx = ["[vo]", "[mu]"]; i = 3
for name, t, g in sfx:
    inp += ["-i", A + N[name]]; f.append(f"[{i}:a]aresample=48000,volume={g*0.45:.3f},adelay={int(max(t,0)*1000)}:all=1[s{i}]"); mx.append(f"[s{i}]"); i += 1
f.append(f"{''.join(mx)}amix=inputs={len(mx)}:normalize=0,atrim=0:{dur},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(f), "-map", "0:v", "-map", "[aout]", "-map_metadata", "-1",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", f"{D}/final.mp4"], check=True)
print("wrote", f"{D}/final.mp4", round(dur, 2), "s")
