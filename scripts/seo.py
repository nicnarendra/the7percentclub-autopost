#!/usr/bin/env python3
"""YouTube SEO upkeep (CHANNEL=in: The 7% Club, CHANNEL=us: The Boring Rich Club).

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
from post import yt_token, guard_channel, log, CH, CH_KEY, QUEUE  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / CH["config"]).read_text())
PL_FILE = ROOT / CH["playlists"]
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
    banner = CFG.get("banner")
    if banner and not (ROOT / CH["playlists"]).with_name("banner.done").exists():
        img = (ROOT / banner).read_bytes()
        r = requests.post("https://www.googleapis.com/upload/youtube/v3/channelBanners/insert",
                          headers={"Authorization": f"Bearer {tok}", "Content-Type": "image/png"}, data=img, timeout=120)
        if r.status_code >= 300:
            log(f"Banner upload FAILED: {r.status_code} {r.text[:300]}"); return
        b.setdefault("image", {})["bannerExternalUrl"] = r.json()["url"]
        call("PUT", "channels", tok, params={"part": "brandingSettings"},
             json={"id": ch["id"], "brandingSettings": {"channel": b["channel"], "image": b["image"]}})
        (ROOT / CH["playlists"]).with_name("banner.done").write_text(r.json()["url"] + "\n")
        log("Channel banner uploaded")


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
            "snippet": {"title": p["title"], "description": p["description"], "defaultLanguage": CFG.get("videoLanguage", "en")},
            "status": {"privacyStatus": "public"}})
        ids[key] = res["id"]; log(f"Playlist created: {p['title']}")
    PL_FILE.write_text(json.dumps(ids, indent=2) + "\n")
    return ids


def fix_videos(tok, playlists):
    for d in sorted(p for p in QUEUE.iterdir() if p.is_dir()) if QUEUE.exists() else []:
        pj = d / "post.json"
        if not pj.exists(): continue
        item = json.loads(pj.read_text())
        yt = item.get("results", {}).get("youtube", {})
        vid = yt.get("id")
        lang = item.get("language") or CFG.get("videoLanguage", "en")
        if not vid: continue
        meta = item["youtube"]; done = yt.setdefault("seo", {})
        try:
            if not done.get("metadata"):
                call("PUT", "videos", tok, params={"part": "snippet"}, json={"id": vid, "snippet": {
                    "title": meta["title"][:100], "description": meta["description"], "tags": meta.get("tags", []),
                    "categoryId": meta.get("categoryId", "27"), "defaultLanguage": lang, "defaultAudioLanguage": lang}})
                done["metadata"] = True; log(f"{d.name}: title/description/tags updated")
            srt = d / "captions.srt"
            if srt.exists() and not done.get("captions"):
                body = json.dumps({"snippet": {"videoId": vid, "language": lang, "name": "हिन्दी" if lang == "hi" else "English", "isDraft": False}})
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
            if not done.get("comment"):
                txt = comment_text(d, item, playlists)
                if txt:
                    call("POST", "commentThreads", tok, params={"part": "snippet"}, json={"snippet": {
                        "videoId": vid, "topLevelComment": {"snippet": {"textOriginal": txt}}}})
                    done["comment"] = True; log(f"{d.name}: link comment posted (pin it in Studio for best results)")
        except Exception as e:
            log(f"{d.name}: SEO step FAILED - {e}")
        pj.write_text(json.dumps(item, indent=2, ensure_ascii=False) + "\n")


def comment_text(d, item, playlists):
    """First comment under each video: a question + where to watch next. Returns None to retry later."""
    if item.get("comment"):
        return item["comment"]
    q = item.get("question") or "Which part surprised you most? Tell me below 👇"
    key = item["youtube"].get("playlist")
    pl = f"https://www.youtube.com/playlist?list={playlists[key]}" if key and key in playlists else None
    if item.get("format", "short") == "short":
        # US: point the Short at the same day's long video
        for o in sorted(QUEUE.iterdir()):
            pj = o / "post.json"
            if o == d or not o.name.startswith(d.name[:10]) or not pj.exists(): continue
            other = json.loads(pj.read_text())
            if other.get("format") == "long":
                lid = other.get("results", {}).get("youtube", {}).get("id")
                if not lid: return None
                return f"📺 Full step-by-step video: https://youtu.be/{lid}\n\n{q}"
        return f"▶ More like this: {pl}\n\n{q}" if pl else q
    return f"{q}\n\n▶ Next: the full series here {pl}" if pl else q


STATE_FILE = ROOT / CH["playlists"].replace("playlists.json", "state.json")


def load_state():
    return json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state(st):
    STATE_FILE.write_text(json.dumps(st, indent=2) + "\n")


def snapshot(tok):
    """Save the channel's current profile picture and stats into status/ so they can be checked without Studio."""
    ch = call("GET", "channels", tok, params={"part": "snippet,statistics", "mine": "true"})["items"][0]
    url = ch["snippet"]["thumbnails"].get("high", ch["snippet"]["thumbnails"]["default"])["url"]
    out = ROOT / "status"; out.mkdir(exist_ok=True)
    img = requests.get(url, timeout=60)
    if img.ok:
        (out / f"{CH_KEY}-avatar.jpg").write_bytes(img.content)
    st = ch["statistics"]
    log(f"Profile picture saved to status/{CH_KEY}-avatar.jpg; subscribers {st.get('subscriberCount')}, "
        f"videos {st.get('videoCount')}, views {st.get('viewCount')}")
    return ch["id"]


def extras(tok, channel_id, playlists):
    """One-time growth extras: subscribe watermark, channel trailer, home-page playlist shelf."""
    st = load_state()
    wm = CFG.get("watermark")
    if wm and not st.get("watermark"):
        tries = [{"type": "offsetFromStart", "offsetMs": "0"},  # whole video
                 {"type": "offsetFromEnd", "offsetMs": "15000", "durationMs": "15000"}]  # last 15 s
        for timing in tries:
            meta = json.dumps({"timing": timing, "position": {"type": "corner", "cornerPosition": "bottomRight"}})
            r = requests.post(f"https://www.googleapis.com/upload/youtube/v3/watermarks/set?channelId={channel_id}&uploadType=multipart",
                              headers={"Authorization": f"Bearer {tok}"}, timeout=120,
                              files={"metadata": (None, meta, "application/json; charset=UTF-8"),
                                     "media": ("watermark.png", (ROOT / wm).read_bytes(), "image/png")})
            if r.status_code < 300:
                st["watermark"] = timing["type"]; log(f"Subscribe watermark set ({timing['type']})"); break
            log(f"Watermark attempt {timing['type']} FAILED: {r.status_code} {r.text[:200]}")
    # trailer + home shelf need the first video to be live
    first = CFG.get("trailer_item")
    vid = None
    if first and (QUEUE / first / "post.json").exists():
        vid = json.loads((QUEUE / first / "post.json").read_text()).get("results", {}).get("youtube", {}).get("id")
    if vid and not st.get("trailer"):
        try:
            ch = call("GET", "channels", tok, params={"part": "brandingSettings", "mine": "true"})["items"][0]
            b = ch["brandingSettings"]; b["channel"]["unsubscribedTrailer"] = vid
            call("PUT", "channels", tok, params={"part": "brandingSettings"},
                 json={"id": ch["id"], "brandingSettings": {"channel": b["channel"]}})
            st["trailer"] = vid; log(f"Channel trailer set to {vid}")
        except Exception as e:
            log(f"Trailer FAILED: {e}")
    shelf = CFG.get("home_shelf")
    if vid and shelf and not st.get("shelf"):
        try:
            call("POST", "channelSections", tok, params={"part": "snippet,contentDetails"}, json={
                "snippet": {"type": "singlePlaylist", "position": 0},
                "contentDetails": {"playlists": [playlists[shelf]]}})
            st["shelf"] = shelf; log(f"Home page shelf added: {CFG['playlists'][shelf]['title']}")
        except Exception as e:
            log(f"Home shelf FAILED: {e}")
    save_state(st)


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
    cid = snapshot(tok)
    extras(tok, cid, pls)


if __name__ == "__main__":
    main()
