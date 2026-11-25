#!/usr/bin/env bash
# Runs one mode for the channel in $CHANNEL and keeps the output in status/<channel>-last-run.txt
mkdir -p status
LOG="status/${CHANNEL}-last-run.txt"
{
  echo "mode=$1 channel=$CHANNEL at $(date -u +%FT%TZ)"
  case "$1" in
    check) python scripts/post.py --check ;;
    dry-run) python scripts/post.py --dry-run ;;
    scopes) python scripts/seo.py --scopes ;;
    seo) python scripts/seo.py ;;
    analytics) python scripts/analytics.py ;;
    *) python scripts/post.py; S=$?; python scripts/seo.py --videos || true; python scripts/analytics.py || true; exit $S ;;
  esac
} 2>&1 | tee "$LOG"
exit ${PIPESTATUS[0]}
