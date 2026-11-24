#!/usr/bin/env python3
"""The 7% Club auto-poster.

Posts every queue item whose publish_at has passed to YouTube (Shorts),
Facebook (Reel) and Instagram (Reel). Each platform's result is written back
into the item's post.json, so a re-run never posts the same video twice and
only retries the platforms that failed.

Usage:
  python scripts/post.py            # post everything that is due
  python scripts/post.py --check    # only test that every key works
  python scripts/post.py --dry-run  # show what would be posted
"""
import datetime as dt, json, os, sys, time, pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent
QUEUE = ROOT / "queue"
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
        "refresh_token": env("YT_REFRESH_TOKEN"), "grant_type": "refresh_token"}, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"YouTube token refresh failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


def post_youtube(item, video):
    tok = yt_token()
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
    return {"id": vid, "url": f"https://youtube.com/shorts/{vid}", "privacy": privacy}


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
def post_instagram(item, video):
    tok, ig = env("META_PAGE_TOKEN"), env("IG_USER_ID")
    r = requests.post(f"{GRAPH}/{ig}/media", data={
        "media_type": "REELS", "upload_type": "resumable", "caption": item["caption"],
        "share_to_feed": "true", "access_token": tok}, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Instagram container failed: {r.status_code} {r.text}")
    cid = r.json()["id"]
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


PLATFORMS = {"youtube": post_youtube, "facebook": post_facebook, "instagram": post_instagram}


def check():
    ok = True
    try:
        yt_token(); log("YouTube: key works")
    except Exception as e:
        ok = False; log("YouTube: FAILED -", e)
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
        log(f"== {d.name}: due {due.isoformat()}, posting to {', '.join(todo)}")
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
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
