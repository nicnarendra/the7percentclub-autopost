# Daily production playbook

This repo makes and posts faceless, hand-drawn stickman finance videos for two YouTube channels:

| Channel key | Channel | Audience | Daily output | Queue folder | Plan |
|---|---|---|---|---|---|
| `in` | The 7% Club (@the.7percentclub) | India, English | 2 Shorts: 08:30 and 19:30 IST | `queue/` | `plans/india.csv` |
| `us` | The Boring Rich Club (@boringrichclub) | USA | 1 long-form at 3 PM ET + 1 Short at 7 PM ET | `channels/us/queue/` | `plans/us.csv` |

The posting robot (`.github/workflows/post.yml`) runs on GitHub's servers four times a day and uploads every queue item
whose `publish_at` has passed. **Production never uploads anything itself: it only adds finished items to the queue.**

## Goal of each daily run

Keep each channel's queue filled **3 days ahead**. Work through the plan in date order:
1. Rows with Status `Planned` whose publish time is still in the future, earliest first.
2. Stop when the queue covers the next 3 days, or after the per-run cap
   (US: 2 long + 2 Shorts; India: 4 Shorts), so one run never takes too long.
3. If a row's publish time has already passed and it was never made, set its Status to `Skipped`. Never post late.

## Setup (fresh session)

```bash
git clone https://github.com/nicnarendra/the7percentclub-autopost && cd the7percentclub-autopost
bash studio/setup.sh          # node canvas, Kokoro TTS (free, open source) + model files, ffmpeg check
```

Work in `studio/work/<slug>/`, which is git-ignored.

## Making one video

1. **Research and fact-check first.** Every number on screen must come from a current, official or reputable source,
   found with web search *today*: SEBI, RBI, NSE, Income Tax dept, Federal Reserve, IRS, BLS, SPIVA and similar.
   Prefer the newest data release. For example, the Fed's 2025 Survey of Consumer Finances replaced the 2022 one in Oct 2026.
   Illustrations, such as compounding at an assumed return, must say so on screen ("assumes 12% a year, not guaranteed").
2. **Script** → `lines.json`, one sentence per item.
   - **Line 1 is the hook.** It says the title's promise in the first 2 seconds, using the plan's hook (formulas are in the sheet's "Hook formulas" tab: F1–F8 India, G1–G10 US).
   - **Lengths:** Shorts 35–55 s, about 90–130 words. Long-form 6–10 min, about 850–1,400 words, in chapters.
   - **Write for the ear:** short sentences, numbers as words where TTS might misread them ("thirty-three thousand dollars").
     `studio/tts.py` already fixes 401(k), IRA, HSA, ETF, S&P 500, SIP, F&O, SEBI, years and ₹.
   - **Endings:**
     - US Short: points to the same day's long video ("The full guide is on our channel").
     - India: ends with following The 7% Club.
   - **Never:** stock tips, "guaranteed returns", fake urgency, or copying another creator's script.
3. **Voice:**
   - Shorts: `python studio/tts.py studio/work/<slug> --speed 1.05 --gap 0.3`
   - Long-form: `python studio/tts.py studio/work/<slug> --speed 0.95 --gap 0.4`
4. **Scenes** → copy the closest example into your work folder as `scene.mjs` and rewrite the scene functions:
   - 9:16 Short with camera motion: `studio/examples/us-day1-short-7-steps/`
   - 9:16 Short with charts: `studio/examples/in-day1-sip/`
   - 16:9 long-form with 9 chapters: `studio/examples/us-day2-youre-not-behind/` (best reference)
   - 16:9 long-form with a steps tracker: `studio/examples/us-day1-start-from-zero/`

   Drawing helpers live in `studio/lib/draw.mjs` (`fig`, `text`, `writeText`, `card`, `box`, `strokePath`, `coinStack`,
   `phone`, `checkMark`, `crossMark`, `pop`, `ramp`, …). Time everything off `segments.json` / `words.json` with `S(i)` and `at(i, 'word')`.

   **Variety and motion are required.** Every 5–10 seconds something should move or change: counters counting up, people walking or
   jumping, bars growing, cards flipping, camera pans, crowds lighting up. Don't hold one static layout for long.

   Style: paper background, Caveat hand font, ink #1d1d1f, green #2f9a5a, red #e0452f, navy #27406b.
   The font has no "→" glyph, so don't use it.
5. **Check before rendering.** `node scene.mjs --stills 2 10 25 …` with 8–12 times spread across the video. Then look at
   each PNG. Fix any overlaps, cut-off text, figures standing below their floor, or text under captions
   (Shorts burn captions at y≈1580, so keep content above y≈1480).
6. **Render and mix:**
   - `node scene.mjs`, which writes `picture.mp4`.
   - Then `python studio/mix.py studio/work/<slug> --lead <LEAD>` (for long-form also pass `--chapters i,j,k`).
   - Check the loudness is about −14 LUFS: `ffmpeg -i final.mp4 -af ebur128 -f null -`.
7. **Long-form extras:**
   - A 1280×720 `thumbnail.png`: big 2–4 word text, one emotion figure. See `thumb.mjs` in the long-form examples.
   - Chapters ("0:00 Intro" first) go in the description.
8. **Description:**
   - Starts with a keyword-rich summary of 1–2 sentences.
   - Then chapters (long-form), "Numbers in this video" with the sources named, a question for comments, and the disclaimer.
   - Disclaimer India: "📌 Educational content only. Not SEBI-registered. Not investment advice."
   - Disclaimer US: "📌 Educational content only, not financial advice."
9. **Queue it:**
   ```bash
   python studio/enqueue.py studio/work/<slug> --channel us --slug <slug> --format long \
     --publish 2026-11-29T15:00:00-05:00 --title "..." --description-file studio/work/<slug>/description.txt \
     --tags "a,b,c" --playlist start-here --lead 0.4 --day 3
   ```
   - Playlists: see `config/channel.json` (India) and `channels/us/channel.json` (US).
   - Shorts get " #Shorts" added automatically.
   - Titles must be ≤ 100 characters.
10. **Update the plan:** set the row's Status in `plans/*.csv` to `Queued`.

## Finishing the run

- Housekeeping: delete `video.mp4` from queue items that were posted (`results.youtube.id` set) more than 3 days ago.
  This keeps the repo small. Keep `post.json`.
- Commit and push: `git pull --rebase && git add -A && git commit -m "Queue <dates>" && git push`.
  End the commit message with the attribution lines your system instructions give.
- Report in a few lines: what was queued (title, channel, publish time), anything skipped, and anything that failed.

## Never

- Touch `.github/workflows`, `scripts/` or secrets unless a run is broken and the fix is obvious. Then say exactly what changed.
- Upload to YouTube or Meta directly, or change channel settings by hand.
- Overwrite a queue item that has already been posted (`enqueue.py` refuses).
