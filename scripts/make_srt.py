#!/usr/bin/env python3
"""Build captions.srt from a queue item's words.json (word timings of the voiceover).
usage: make_srt.py <queue-dir> [lead_seconds]"""
import json, re, sys, pathlib
d = pathlib.Path(sys.argv[1]); lead = float(sys.argv[2]) if len(sys.argv) > 2 else 0.3
words = [{**w, "start": w["start"] + lead, "end": w["end"] + lead} for w in json.load(open(d / "words.json"))]
cues, cur = [], []
for w in words:
    cur.append(w)
    if re.search(r"[.?!:,]$|\.\.\.$", w["text"]) or len(" ".join(x["text"] for x in cur)) > 22:
        cues.append(cur); cur = []
if cur: cues.append(cur)
def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
out = []
for i, c in enumerate(cues, 1):
    end = min(cues[i][0]["start"] - 0.02, c[-1]["end"] + 0.6) if i < len(cues) else c[-1]["end"] + 0.8
    out.append(f"{i}\n{ts(c[0]['start'])} --> {ts(end)}\n{' '.join(x['text'] for x in c).replace('...', '…')}\n")
(d / "captions.srt").write_text("\n".join(out), encoding="utf-8")
print(f"wrote {d/'captions.srt'} ({len(cues)} cues)")
