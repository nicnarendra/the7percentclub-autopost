#!/usr/bin/env bash
# One-time setup for a fresh machine/session: node canvas, Kokoro TTS + model files, ffmpeg check.
set -e
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: install it (apt-get install -y ffmpeg)"; exit 1; }
[ -d node_modules/@napi-rs/canvas ] || npm install --silent
python3 -c "import kokoro_onnx, soundfile" 2>/dev/null || pip install --quiet --break-system-packages kokoro-onnx soundfile
M="${KOKORO_DIR:-$HOME/.cache/kokoro}"; mkdir -p "$M"
U=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s "$M/kokoro-v1.0.onnx" ] || curl -sSL -o "$M/kokoro-v1.0.onnx" "$U/kokoro-v1.0.onnx"
[ -s "$M/voices-v1.0.bin" ] || curl -sSL -o "$M/voices-v1.0.bin" "$U/voices-v1.0.bin"
echo "studio ready"
