#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/voiceover"
TOOLS="$ROOT/tools"
MYSAY="$TOOLS/mysay.dylib"
SPEAK="$TOOLS/personal-speak"
RATE="${VOICE_RATE:-175}"
LINES="$ROOT/scripts/voiceover-lines.txt"

mkdir -p "$OUT"

if [[ ! -x "$SPEAK ]]; then
  (cd "$TOOLS" && make personal-speak)
fi

"$ROOT/scripts/verify-personal-voice.sh" || {
  echo ""
  echo "Aborting TTS generation. Use npm run voiceover:import for manual clips."
  exit 1
}

if [[ -n "${PERSONAL_VOICE_NAME:-}" ]]; then
  VOICE_NAME="$PERSONAL_VOICE_NAME"
else
  VOICE_NAME="$("$ROOT/scripts/preflight-personal-voice.sh" | head -1 | sed 's/[[:space:]]*$//')"
fi

echo ""
echo "Using Personal Voice: $VOICE_NAME"
echo "Output: $OUT"
echo ""

personal_say() {
  local text="$1"
  local caf="$2"
  DYLD_INSERT_LIBRARIES="$MYSAY" "$SPEAK" -v "$VOICE_NAME" -o "$caf" "$text"
}

manifest='{"voiceName":"'"$VOICE_NAME"'","fps":30,"scenes":['
first=true

while IFS='|' read -r id text; do
  [[ -z "$id" ]] && continue
  caf="$OUT/$id.caf"
  wav="$OUT/$id.wav"

  echo "→ $id"
  personal_say "$text" "$caf"
  afconvert -f WAVE -d LEI16@44100 "$caf" "$wav" -q 127
  duration="$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$wav")"
  echo "  ${duration}s"

  if [[ "$first" = true ]]; then first=false; else manifest+=","; fi
  manifest+='{"id":"'"$id"'","audio":"voiceover/'"$id"'.wav","durationSeconds":'"$duration"',"padSeconds":0.6}'
done < "$LINES"

manifest+=']}'
printf '%s\n' "$manifest" > "$OUT/manifest.json"
echo ""
echo "Wrote $OUT/manifest.json"