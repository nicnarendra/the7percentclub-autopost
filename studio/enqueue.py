#!/usr/bin/env python3
"""Put a finished video into a channel's posting queue.
usage: python studio/enqueue.py <video-dir> --channel us|in --slug my-video --publish "2026-11-29T15:00:00-05:00" \
         --format short|long --title "..." --description-file desc.txt --tags "a,b,c" --playlist start-here [--lead 0.3] [--caption-file cap.txt]
Copies final.mp4 (as video.mp4), words.json and thumbnail.png (if present), writes post.json and captions.srt."""
import argparse, datetime as dt, json, pathlib, shutil, subprocess, sys
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("--channel", required=True); ap.add_argument("--slug", required=True)
ap.add_argument("--publish", required=True); ap.add_argument("--format", required=True); ap.add_argument("--title", required=True)
ap.add_argument("--description-file", required=True); ap.add_argument("--tags", default=""); ap.add_argument("--playlist", default="")
ap.add_argument("--lead", type=float, default=0.3); ap.add_argument("--caption-file", default=""); ap.add_argument("--day", type=int, default=0)
a = ap.parse_args()
ROOT = pathlib.Path(__file__).resolve().parent.parent
qdir = ROOT / ("queue" if a.channel == "in" else f"channels/{a.channel}/queue")
when = dt.datetime.fromisoformat(a.publish)
d = qdir / f"{when.strftime('%Y-%m-%d-%H%M')}-{a.slug}"
if (d / "post.json").exists() and json.loads((d / "post.json").read_text()).get("results", {}).get("youtube", {}).get("id"):
    sys.exit(f"{d.name} is already posted; refusing to overwrite")
d.mkdir(parents=True, exist_ok=True); src = pathlib.Path(a.dir)
shutil.copy(src / "final.mp4", d / "video.mp4"); shutil.copy(src / "words.json", d / "words.json")
if (src / "thumbnail.png").exists(): shutil.copy(src / "thumbnail.png", d / "thumbnail.png")
cfg = json.loads((ROOT / ("config/channel.json" if a.channel == "in" else f"channels/{a.channel}/channel.json")).read_text())
if a.playlist and a.playlist not in cfg["playlists"]: sys.exit(f"unknown playlist {a.playlist}; choose from {list(cfg['playlists'])}")
title = a.title if a.format == "long" or "#Shorts" in a.title else a.title + " #Shorts"
if len(title) > 100: sys.exit(f"title too long ({len(title)} > 100)")
item = {"day": a.day, "slot": a.format, "format": a.format, "publish_at": when.isoformat(), "platforms": ["youtube", "facebook", "instagram"] if (a.channel == "in" and a.caption_file) else ["youtube"],
        "youtube": {"title": title, "description": pathlib.Path(a.description_file).read_text().strip(),
                    "tags": [t.strip() for t in a.tags.split(",") if t.strip()], "categoryId": "27", "privacy": "public", "playlist": a.playlist or None}}
if a.caption_file: item["caption"] = pathlib.Path(a.caption_file).read_text().strip()
(d / "post.json").write_text(json.dumps(item, indent=2, ensure_ascii=False) + "\n")
subprocess.run([sys.executable, str(ROOT / "scripts/make_srt.py"), str(d), str(a.lead)], check=True)
print("queued", d.relative_to(ROOT))
