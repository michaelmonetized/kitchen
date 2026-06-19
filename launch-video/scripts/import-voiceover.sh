#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/voiceover"
LINES="$ROOT/scripts/voiceover-lines.txt"
IMPORT_DIR="${1:-$OUT/import}"

mkdir -p "$OUT"

if [[ ! -d "$IMPORT_DIR" ]]; then
  cat <<EOF
Usage: npm run voiceover:import [folder]

Record one clip per scene (your real voice) and place files in:
  $OUT/import/

Expected filenames (any of these per scene):
  01-hook.wav  OR  01-hook.m4a  OR  01-hook.caf
  02-problem.*
  03-four-layers.*
  04-three-modes.*
  05-product.*
  06-cta.*

Lines to record are in: scripts/voiceover-lines.txt

Your Personal Voice PREVIEW in Settings sounds like you, but macOS CLI export
still renders Samantha. Use Live Speech (same engine as Preview):

  1. Settings → Accessibility → Live Speech → ON
  2. Speaking Voice → Michael
  3. Add each line from scripts/voiceover-lines.txt as a Favorite Phrase
  4. QuickTime → New Audio Recording
  5. Record each phrase (6 separate files), save here with scene names

Walkthrough: npm run voiceover:record

Then run:
  npm run voiceover:import
  npm run render
EOF
  mkdir -p "$IMPORT_DIR"
  exit 1
fi

manifest='{"voiceName":"manual-import","fps":30,"scenes":['
first=true

while IFS='|' read -r id _text; do
  [[ -z "$id" ]] && continue
  src=""
  for ext in wav m4a caf mp3 aiff; do
    if [[ -f "$IMPORT_DIR/$id.$ext" ]]; then
      src="$IMPORT_DIR/$id.$ext"
      break
    fi
  done

  if [[ -z "$src" ]]; then
    echo "Missing audio for $id in $IMPORT_DIR"
    exit 1
  fi

  wav="$OUT/$id.wav"
  echo "→ $id  ($src)"
  afconvert -f WAVE -d LEI16@44100 "$src" "$wav" -q 127
  duration="$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$wav")"
  echo "  ${duration}s"

  if [[ "$first" = true ]]; then first=false; else manifest+=","; fi
  manifest+='{"id":"'"$id"'","audio":"voiceover/'"$id"'.wav","durationSeconds":'"$duration"',"padSeconds":0.6}'
done < "$LINES"

manifest+=']}'
printf '%s\n' "$manifest" > "$OUT/manifest.json"
echo "Wrote $OUT/manifest.json"