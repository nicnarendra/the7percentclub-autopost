#!/usr/bin/env python3
"""YouTube SEO upkeep for The 7% Club.

- Applies the channel description, keywords, country and language from config/channel.json
- Creates the playlists in config/channel.json if they don't exist (ids saved to config/playlists.json)
- For every uploaded video in queue/: applies the title/description/tags from post.json,
  uploads captions.srt as English subtitles and adds the video to its playlist.
Each step is recorded in post.json, so it is done once only.

Needs the youtube.force-ssl scope on the key.
usage: seo.py [--scopes] [--channel] [--videos]   (no flags = channel + videos)
"""
import json, os, sys, pathlib, requests
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import yt_token, guard_channel, log  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config/channel.json").read_text())
PL_FILE = ROOT / "config/playlists.json"
API = "https://www.googleapis.com/youtube/v3"


def call(method, path, tok, **kw):
    r = requests.request(method, f"{API}/{path}", headers={"Authorization": f"Bearer {tok}"}, timeout=60, **kw)
    if r.status_code >= 300:
        raise RuntimeError(f"{method} {path} failed: {r.status_code} {r.text[:400]}")
    return r.json() if r.text else {}


def scopes(tok):
    r = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"access_token": tok}, timeout=30)
    return r.json().get("scope", "").split()


def apply_channel(tok):
    ch = call("GET", "channels", tok, params={"part": "brandingSettings", "mine": "true"})["items"][0]
    b = ch["brandingSettings"]
    b.setdefault("channel", {})
    b["channel"]["description"] = CFG["description"]
    b["channel"]["keywords"] = " ".join(f'"{k}"' if " " in k else k for k in CFG["keywords"])
    b["channel"]["country"] = CFG["country"]
    b["channel"]["defaultLanguage"] = CFG["defaultLanguage"]
    call("PUT", "channels", tok, params={"part": "brandingSettings"},
         json={"id": ch["id"], "brandingSettings": {"channel": b["channel"]}})
    log("Channel description, keywords, country and language updated")


def ensure_playlists(tok):
    ids = json.loads(PL_FILE.read_text()) if PL_FILE.exists() else {}
    existing = {}
    page = None
    while True:
        params = {"part": "snippet", "mine": "true", "maxResults": 50}
        if page: params["pageToken"] = page
        res = call("GET", "playlists", tok, params=params)
        for p in res.get("items", []):
            existing[p["snippet"]["title"]] = p["id"]
        page = res.get("nextPageToken")
        if not page: break
    for key, p in CFG["playlists"].items():
        if key in ids: continue
        if p["title"] in existing:
            ids[key] = existing[p["title"]]; continue
        res = call("POST", "playlists", tok, params={"part": "snippet,status"}, json={
            "snippet": {"title": p["title"], "description": p["description"], "defaultLanguage": "en"},
            "status": {"privacyStatus": "public"}})
        ids[key] = res["id"]; log(f"Playlist created: {p['title']}")
    PL_FILE.write_text(json.dumps(ids, indent=2) + "\n")
    return ids


def fix_videos(tok, playlists):
    for d in sorted(p for p in (ROOT / "queue").iterdir() if p.is_dir()):
        pj = d / "post.json"
        if not pj.exists(): continue
        item = json.loads(pj.read_text())
        yt = item.get("results", {}).get("youtube", {})
        vid = yt.get("id")
        if not vid: continue
        meta = item["youtube"]; done = yt.setdefault("seo", {})
        try:
            if not done.get("metadata"):
                call("PUT", "videos", tok, params={"part": "snippet"}, json={"id": vid, "snippet": {
                    "title": meta["title"][:100], "description": meta["description"], "tags": meta.get("tags", []),
                    "categoryId": meta.get("categoryId", "27"), "defaultLanguage": "en", "defaultAudioLanguage": "en"}})
                done["metadata"] = True; log(f"{d.name}: title/description/tags updated")
            srt = d / "captions.srt"
            if srt.exists() and not done.get("captions"):
                body = json.dumps({"snippet": {"videoId": vid, "language": "en", "name": "English", "isDraft": False}})
                r = requests.post(f"https://www.googleapis.com/upload/youtube/v3/captions?part=snippet&uploadType=multipart",
                                  headers={"Authorization": f"Bearer {tok}"}, timeout=120,
                                  files={"metadata": (None, body, "application/json; charset=UTF-8"),
                                         "media": ("captions.srt", srt.read_bytes(), "application/octet-stream")})
                if r.status_code >= 300:
                    raise RuntimeError(f"captions upload failed: {r.status_code} {r.text[:300]}")
                done["captions"] = True; log(f"{d.name}: English captions uploaded")
            key = meta.get("playlist")
            if key and not done.get("playlist"):
                call("POST", "playlistItems", tok, params={"part": "snippet"}, json={"snippet": {
                    "playlistId": playlists[key], "resourceId": {"kind": "youtube#video", "videoId": vid}}})
                done["playlist"] = key; log(f"{d.name}: added to playlist '{CFG['playlists'][key]['title']}'")
        except Exception as e:
            log(f"{d.name}: SEO step FAILED - {e}")
        pj.write_text(json.dumps(item, indent=2, ensure_ascii=False) + "\n")


def main():
    tok = yt_token()
    title = guard_channel(tok)
    sc = scopes(tok)
    if "--scopes" in sys.argv:
        log(f"Channel: {title}"); log("Scopes: " + ", ".join(s.rsplit('/', 1)[-1] for s in sc)); return
    if not any(s.endswith("youtube.force-ssl") or s.endswith("/auth/youtube") for s in sc):
        raise SystemExit("Key lacks the youtube.force-ssl scope; SEO updates skipped.")
    flags = set(sys.argv[1:]) or {"--channel", "--videos"}
    if "--channel" in flags: apply_channel(tok)
    pls = ensure_playlists(tok)
    if "--videos" in flags: fix_videos(tok, pls)


if __name__ == "__main__":
    main()
