# The 7% Club: autopost

Posts the series' videos to YouTube Shorts, Facebook Reels and Instagram Reels
on a schedule, using the platforms' official APIs. It runs on GitHub Actions'
free scheduler, so no paid posting tool is needed.

## How it works
- Each video is a folder in `queue/` holding `video.mp4` and `post.json`
  (publish time, YouTube title/description, caption).
- `.github/workflows/post.yml` runs at 08:30 and 19:30 IST and posts every
  item whose `publish_at` has passed.
- Results (post IDs and links, or the error) are written back into
  `post.json`. A re-run only retries the platforms that failed, and never
  posts the same video twice.

## Run by hand
Actions tab > **Post due videos** > **Run workflow**, then pick a mode:
- `check`: tests that all six keys work, posts nothing
- `dry-run`: lists what is due, posts nothing
- `post`: posts what is due

## Secrets (Settings > Secrets and variables > Actions)
`YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`,
`META_PAGE_TOKEN`, `FB_PAGE_ID`, `IG_USER_ID`

## Notes
- YouTube keeps uploads from a new API project private until the project
  passes YouTube's API compliance audit. Until then, publish each Short in
  YouTube Studio with one click.
- Educational content only. Not SEBI-registered. Not investment advice.
