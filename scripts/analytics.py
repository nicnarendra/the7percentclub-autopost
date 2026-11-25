#!/usr/bin/env python3
"""Performance snapshot for the weekly review. Writes status/analytics-<channel>.json.
Needs the YouTube key to include the yt-analytics.readonly scope; without it, it says so and exits 0.
For The 7% Club it also adds Instagram/Facebook numbers where the Meta key allows it."""
import datetime as dt, json, os, pathlib, sys
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from post import yt_token, guard_channel, log, CH, CH_KEY, QUEUE, ROOT, GRAPH  # noqa: E402

def queue_index():
    idx = {}
    for d in sorted(p for p in QUEUE.iterdir() if p.is_dir()) if QUEUE.exists() else []:
        pj = d / "post.json"
        if not pj.exists(): continue
        it = json.loads(pj.read_text()); res = it.get("results", {})
        yid = res.get("youtube", {}).get("id")
        idx[d.name] = {"dir": d.name, "format": it.get("format", "short"), "title": it.get("youtube", {}).get("title") or it.get("caption", "")[:80],
                       "publish_at": it.get("publish_at"), "youtube_id": yid,
                       "instagram_id": (res.get("instagram") or res.get("instagram_carousel") or {}).get("id"),
                       "facebook_id": res.get("facebook", {}).get("id"), "playlist": it.get("youtube", {}).get("playlist")}
    return idx

def youtube(tok, idx):
    end = dt.date.today(); start = end - dt.timedelta(days=28)
    base = {"ids": "channel==MINE", "startDate": start.isoformat(), "endDate": end.isoformat()}
    H = {"Authorization": f"Bearer {tok}"}
    r = requests.get("https://youtubeanalytics.googleapis.com/v2/reports", headers=H, timeout=60, params={**base,
        "dimensions": "video", "sort": "-views", "maxResults": 200,
        "metrics": "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares"})
    if r.status_code == 403:
        return {"error": "The YouTube key has no analytics permission yet (yt-analytics.readonly). Redo the OAuth Playground step with that scope added."}
    if r.status_code != 200:
        return {"error": f"{r.status_code} {r.text[:300]}"}
    j = r.json(); cols = [c["name"] for c in j["columnHeaders"]]
    by_id = {v["youtube_id"]: v for v in idx.values() if v["youtube_id"]}
    vids = []
    for row in j.get("rows", []):
        d = dict(zip(cols, row)); meta = by_id.get(d["video"], {})
        vids.append({**d, "title": meta.get("title"), "format": meta.get("format"), "playlist": meta.get("playlist"), "publish_at": meta.get("publish_at")})
    # traffic sources for the whole channel (Shorts feed vs search vs suggested)
    r2 = requests.get("https://youtubeanalytics.googleapis.com/v2/reports", headers=H, timeout=60, params={**base,
        "dimensions": "insightTrafficSourceType", "metrics": "views", "sort": "-views"})
    traffic = r2.json().get("rows", []) if r2.status_code == 200 else []
    r3 = requests.get("https://www.googleapis.com/youtube/v3/channels", headers=H, timeout=30, params={"part": "statistics", "mine": "true"})
    stats = r3.json()["items"][0]["statistics"] if r3.status_code == 200 else {}
    return {"window": [start.isoformat(), end.isoformat()], "channel": stats, "videos": vids, "traffic_sources": traffic}

def meta(idx):
    tok = os.environ.get("META_PAGE_TOKEN"); ig = os.environ.get("IG_USER_ID")
    if CH_KEY != "in" or not tok: return None
    out = {"instagram": [], "notes": []}
    for v in idx.values():
        if not v["instagram_id"]: continue
        r = requests.get(f"{GRAPH}/{v['instagram_id']}", timeout=30, params={"access_token": tok, "fields": "like_count,comments_count,media_product_type,timestamp"})
        row = {"dir": v["dir"], "title": v["title"], **(r.json() if r.status_code == 200 else {"error": r.text[:200]})}
        ins = requests.get(f"{GRAPH}/{v['instagram_id']}/insights", timeout=30, params={"access_token": tok, "metric": "reach,views,saved,shares"})
        if ins.status_code == 200:
            row["insights"] = {m["name"]: (m.get("values") or [{}])[0].get("value") for m in ins.json().get("data", [])}
        elif not out["notes"]:
            out["notes"].append("Instagram reach/views/saves need the instagram_manage_insights permission on the Meta key.")
        out["instagram"].append(row)
    if ig:
        r = requests.get(f"{GRAPH}/{ig}", timeout=30, params={"access_token": tok, "fields": "followers_count,media_count"})
        if r.status_code == 200: out["instagram_account"] = r.json()
    return out

def main():
    tok = yt_token(); guard_channel(tok)
    idx = queue_index()
    snap = {"generated_at": dt.datetime.utcnow().isoformat() + "Z", "channel": CH["name"], "youtube": youtube(tok, idx), "meta": meta(idx),
            "queue": list(idx.values())}
    out = ROOT / "status"; out.mkdir(exist_ok=True)
    (out / f"analytics-{CH_KEY}.json").write_text(json.dumps(snap, indent=1, ensure_ascii=False) + "\n")
    y = snap["youtube"]
    log(f"Analytics saved to status/analytics-{CH_KEY}.json" + (f" ({y['error']})" if "error" in y else f": {len(y['videos'])} videos with data"))

if __name__ == "__main__":
    main()
