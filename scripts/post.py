#!/usr/bin/env python3
"""Auto-poster for The 7% Club (CHANNEL=in) and The Boring Rich Club (CHANNEL=us).

Posts every queue item whose publish_at has passed to YouTube (Shorts),
Facebook (Reel) and Instagram (Reel). Each platform's result is written back
into the item's post.json, so a re-run never posts the same video twice and
only retries the platforms that failed.

Usage:
  python scripts/post.py            # post everything that is due
  python scripts/post.py --check    # only test that every key works
  python scripts/post.py --dry-run  # show what would be posted
"""
import re
import datetime as dt, json, os, sys, time, pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent

# One profile per YouTube channel. Pick with the CHANNEL env var (default: in).
CHANNELS = {
    "in": {"name": "The 7% Club", "queue": "queue", "config": "config/channel.json",
           "playlists": "config/playlists.json", "token_env": "YT_REFRESH_TOKEN",
           "handle": "@the.7percentclub"},
    "us": {"name": "The Boring Rich Club", "queue": "channels/us/queue", "config": "channels/us/channel.json",
           "playlists": "channels/us/playlists.json", "token_env": "YT_REFRESH_TOKEN_US",
           "handle": "@boringrichclub", "channel_id": "UCsWQ7_HX6iB1s2cHB2RD-sA"},
}
CH_KEY = os.environ.get("CHANNEL", "in").strip().lower() or "in"
CH = CHANNELS[CH_KEY]
QUEUE = ROOT / CH["queue"]
CFG_APPROVAL = json.loads((ROOT / CH["config"]).read_text()).get("require_approval", False)
GRAPH = "https://graph.facebook.com/" + os.environ.get("META_API_VERSION", "v22.0")
RUPLOAD = "https://rupload.facebook.com"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))


def env(name):
    v = os.environ.get(name, "").strip()
    if not v:
        raise SystemExit(f"Missing secret {name}. Add it in GitHub: Settings > Secrets and variables > Actions.")
    return v


def log(*a):
    print(*a, flush=True)


# ---------------- YouTube ----------------
def yt_token():
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": env("YT_CLIENT_ID"), "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": env(CH["token_env"]), "grant_type": "refresh_token"}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"YouTube token refresh failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


EXPECTED_HANDLE = (os.environ.get("YT_EXPECTED_HANDLE") or CH["handle"]).lower()


def yt_channel(tok):
    """Return the handle of the channel this key uploads to (needs youtube.readonly)."""
    r = requests.get("https://www.googleapis.com/youtube/v3/channels",
                     params={"part": "snippet", "mine": "true"},
                     headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError("Cannot confirm which YouTube channel this key belongs to "
                           f"(the key needs the youtube.readonly scope too): {r.status_code} {r.text[:300]}")
    items = r.json().get("items", [])
    if len(items) != 1:
        raise RuntimeError(f"Key belongs to {len(items)} channels; expected exactly one")
    sn = items[0]["snippet"]
    if CH.get("channel_id") and items[0]["id"] != CH["channel_id"]:
        return f"id:{items[0]['id']}", sn.get("title")
    return (sn.get("customUrl") or "").lower(), sn.get("title")


def guard_channel(tok):
    handle, title = yt_channel(tok)
    if handle != EXPECTED_HANDLE:
        raise RuntimeError(f"WRONG CHANNEL: key uploads to '{title}' ({handle}), expected {EXPECTED_HANDLE}. Nothing uploaded.")
    return title


def post_youtube(item, video):
    tok = yt_token()
    guard_channel(tok)
    yt = item["youtube"]
    meta = {
        "snippet": {"title": yt["title"][:100], "description": yt["description"],
                    "tags": yt.get("tags", []), "categoryId": yt.get("categoryId", "27")},
        "status": {"privacyStatus": yt.get("privacy", "public"), "selfDeclaredMadeForKids": False},
    }
    size = video.stat().st_size
    r = requests.post(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8",
                 "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)},
        data=json.dumps(meta), timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"YouTube upload start failed: {r.status_code} {r.text}")
    with open(video, "rb") as f:
        r2 = requests.put(r.headers["Location"], data=f,
                          headers={"Authorization": f"Bearer {tok}", "Content-Type": "video/mp4",
                                   "Content-Length": str(size)}, timeout=600)
    if r2.status_code not in (200, 201):
        raise RuntimeError(f"YouTube upload failed: {r2.status_code} {r2.text}")
    body = r2.json()
    vid = body["id"]
    privacy = body.get("status", {}).get("privacyStatus")
    short = item.get("format", "short") == "short"
    out = {"id": vid, "url": f"https://youtube.com/{'shorts/' + vid if short else 'watch?v=' + vid}", "privacy": privacy}
    thumb = video.parent / "thumbnail.png"
    if thumb.exists():
        out["thumbnail"] = set_thumbnail(tok, vid, thumb)
    return out


def set_thumbnail(tok, vid, path):
    """Custom thumbnail. Needs a phone-verified channel; a failure here never fails the upload."""
    r = requests.post(f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}",
                      headers={"Authorization": f"Bearer {tok}", "Content-Type": "image/png"},
                      data=path.read_bytes(), timeout=120)
    if r.status_code >= 300:
        log(f"   thumbnail not set: {r.status_code} {r.text[:200]}")
        return "failed"
    return "set"


# ---------------- Facebook Reel ----------------
def post_facebook(item, video):
    tok, page = env("META_PAGE_TOKEN"), env("FB_PAGE_ID")
    r = requests.post(f"{GRAPH}/{page}/video_reels", data={"upload_phase": "start", "access_token": tok}, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Facebook start failed: {r.status_code} {r.text}")
    vid = r.json()["video_id"]
    size = video.stat().st_size
    with open(video, "rb") as f:
        r2 = requests.post(f"{RUPLOAD}/video-upload/{GRAPH.rsplit('/',1)[1]}/{vid}", data=f,
                           headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size)}, timeout=600)
    if r2.status_code != 200:
        raise RuntimeError(f"Facebook upload failed: {r2.status_code} {r2.text}")
    r3 = requests.post(f"{GRAPH}/{page}/video_reels", data={
        "upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED",
        "description": item["caption"], "access_token": tok}, timeout=60)
    if r3.status_code != 200 or not r3.json().get("success", True):
        raise RuntimeError(f"Facebook publish failed: {r3.status_code} {r3.text}")
    return {"id": vid, "url": f"https://www.facebook.com/reel/{vid}"}


# ---------------- Instagram Reel ----------------
def _post_instagram_once(item, video, by_url=False):
    tok, ig = env("META_PAGE_TOKEN"), env("IG_USER_ID")
    data = {"media_type": "REELS", "caption": item["caption"], "share_to_feed": "true", "access_token": tok}
    if by_url:  # Instagram fetches the file itself from this public repo
        repo = os.environ.get("GITHUB_REPOSITORY", "nicnarendra/the7percentclub-autopost")
        data["video_url"] = f"https://raw.githubusercontent.com/{repo}/main/{video.relative_to(ROOT).as_posix()}"
    else:
        data["upload_type"] = "resumable"
    r = requests.post(f"{GRAPH}/{ig}/media", data=data, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Instagram container failed: {r.status_code} {r.text}")
    cid = r.json()["id"]
    if not by_url:
        size = video.stat().st_size
        with open(video, "rb") as f:
            r2 = requests.post(f"{RUPLOAD}/ig-api-upload/{GRAPH.rsplit('/',1)[1]}/{cid}", data=f,
                               headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size)}, timeout=600)
        if r2.status_code != 200:
            raise RuntimeError(f"Instagram upload failed: {r2.status_code} {r2.text}")
    for _ in range(60):  # wait up to ~10 min for Instagram to process the video
        s = requests.get(f"{GRAPH}/{cid}", params={"fields": "status_code,status", "access_token": tok}, timeout=30).json()
        code = s.get("status_code")
        if code == "FINISHED":
            break
        if code == "ERROR":
            raise RuntimeError(f"Instagram processing error: {s}")
        time.sleep(10)
    else:
        raise RuntimeError("Instagram processing timed out")
    r3 = requests.post(f"{GRAPH}/{ig}/media_publish", data={"creation_id": cid, "access_token": tok}, timeout=60)
    if r3.status_code != 200:
        raise RuntimeError(f"Instagram publish failed: {r3.status_code} {r3.text}")
    mid = r3.json()["id"]
    link = requests.get(f"{GRAPH}/{mid}", params={"fields": "permalink", "access_token": tok}, timeout=30).json().get("permalink")
    return {"id": mid, "url": link}




def post_instagram(item, video):
    # Instagram sometimes rejects an upload with a one-off processing error; try once more.
    try:
        return _post_instagram_once(item, video, by_url=True)
    except RuntimeError as e:
        log(f"   instagram: link upload failed ({str(e)[:160]}), retrying with direct upload in 20s")
        time.sleep(20)
        return _post_instagram_once(item, video)


def post_ig_carousel(item, video):
    """Instagram carousel from <item>/carousel/*.jpg. Images are fetched by Instagram from this public repo."""
    tok, ig = env("META_PAGE_TOKEN"), env("IG_USER_ID")
    d = video.parent
    imgs = sorted((d / "carousel").glob("*.jpg"), key=lambda x: int(re.sub(r"\D", "", x.stem) or 0))[:10]
    if len(imgs) < 2:
        raise RuntimeError("carousel needs 2-10 JPGs in carousel/")
    repo = os.environ.get("GITHUB_REPOSITORY", "nicnarendra/the7percentclub-autopost")
    ref = os.environ.get("CAROUSEL_REF", "main")
    kids = []
    for img in imgs:
        url = f"https://raw.githubusercontent.com/{repo}/{ref}/{img.relative_to(ROOT).as_posix()}"
        r = requests.post(f"{GRAPH}/{ig}/media", data={"image_url": url, "is_carousel_item": "true", "access_token": tok}, timeout=60)
        if r.status_code != 200:
            raise RuntimeError(f"carousel slide {img.name} failed: {r.status_code} {r.text[:300]}")
        kids.append(r.json()["id"])
    r = requests.post(f"{GRAPH}/{ig}/media", data={"media_type": "CAROUSEL", "children": ",".join(kids),
                                                   "caption": item["caption"], "access_token": tok}, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"carousel container failed: {r.status_code} {r.text[:300]}")
    cid = r.json()["id"]
    for _ in range(30):
        st = requests.get(f"{GRAPH}/{cid}", params={"fields": "status_code", "access_token": tok}, timeout=30).json().get("status_code")
        if st in ("FINISHED", None): break
        if st == "ERROR": raise RuntimeError("carousel processing error")
        time.sleep(5)
    r3 = requests.post(f"{GRAPH}/{ig}/media_publish", data={"creation_id": cid, "access_token": tok}, timeout=60)
    if r3.status_code != 200:
        raise RuntimeError(f"carousel publish failed: {r3.status_code} {r3.text[:300]}")
    mid = r3.json()["id"]
    link = requests.get(f"{GRAPH}/{mid}", params={"fields": "permalink", "access_token": tok}, timeout=30).json().get("permalink")
    return {"id": mid, "url": link}


PLATFORMS = {"youtube": post_youtube, "facebook": post_facebook, "instagram": post_instagram, "instagram_carousel": post_ig_carousel}


def check():
    ok = True
    try:
        title = guard_channel(yt_token()); log(f"YouTube: key works, uploads to '{title}' ({EXPECTED_HANDLE})")
    except Exception as e:
        ok = False; log("YouTube: FAILED -", e)
    if CH_KEY != "in":
        return ok
    tok = os.environ.get("META_PAGE_TOKEN", "")
    for name, path, fields in (("Facebook Page", os.environ.get("FB_PAGE_ID", ""), "name"),
                               ("Instagram", os.environ.get("IG_USER_ID", ""), "username")):
        r = requests.get(f"{GRAPH}/{path}", params={"fields": fields, "access_token": tok}, timeout=30)
        if r.status_code == 200:
            log(f"{name}: key works ({r.json().get(fields)})")
        else:
            ok = False; log(f"{name}: FAILED - {r.status_code} {r.text}")
    return ok


def main():
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    dry = "--dry-run" in sys.argv
    now = dt.datetime.now(IST)
    failures = 0
    attempted = 0
    log(f"Channel: {CH['name']} ({CH_KEY})")
    if not QUEUE.exists():
        log("Queue folder empty"); return
    for d in sorted(p for p in QUEUE.iterdir() if p.is_dir()):
        pj = d / "post.json"
        if not pj.exists():
            continue
        item = json.loads(pj.read_text())
        due = dt.datetime.fromisoformat(item["publish_at"])
        results = item.setdefault("results", {})
        todo = [p for p in item.get("platforms", PLATFORMS) if not results.get(p, {}).get("id")]
        if due > now or not todo:
            continue
        if item.get("hold") or (CFG_APPROVAL and not item.get("approved")):
            log(f"== {d.name}: waiting for owner approval, skipped")
            continue
        attempted += 1
        late = (now - due).total_seconds() / 60
        log(f"== {d.name}: due {due.isoformat()}, posting to {', '.join(todo)}" + (f" (LATE by {late:.0f} min)" if late > 20 else ""))
        if dry:
            continue
        for p in todo:
            try:
                results[p] = {**PLATFORMS[p](item, d / "video.mp4"), "posted_at": dt.datetime.now(IST).isoformat()}
                log(f"   {p}: OK {results[p].get('url')}")
            except Exception as e:
                failures += 1
                results[p] = {"error": str(e)[:500], "failed_at": dt.datetime.now(IST).isoformat()}
                log(f"   {p}: FAILED {e}")
            pj.write_text(json.dumps(item, indent=2, ensure_ascii=False) + "\n")
    if not attempted and not dry:
        sys.exit(3)  # nothing due (run.sh treats this as a quiet success)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
