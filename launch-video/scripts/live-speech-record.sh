#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LINES="$ROOT/scripts/voiceover-lines.txt"
IMPORT="$ROOT/public/voiceover/import"

mkdir -p "$IMPORT"

cat <<'EOF'
Live Speech recording (Personal Voice preview works; CLI does not)

Before you start:
  1. System Settings → Accessibility → Live Speech → ON
  2. Set Speaking Voice to Michael (your Personal Voice)
  3. QuickTime Player → File → New Audio Recording
     • Use your Mac mic (simplest) OR BlackHole for clean system audio
  4. Optional: add each line below as a Live Speech Favorite Phrase

For each scene:
  • Start QuickTime recording
  • Trigger the phrase in Live Speech (or paste the line and speak it)
  • Stop recording
  • Save into this folder using the exact filename shown

Import folder:
EOF
echo "  $IMPORT"
echo ""

idx=0
while IFS='|' read -r id text; do
  [[ -z "$id" ]] && continue
  idx=$((idx + 1))
  target="$IMPORT/$id.wav"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Scene $idx: $id"
  echo "Save as: $id.wav (or .m4a / .caf — import accepts all)"
  echo ""
  echo "$text"
  echo ""
  if [[ -f "$target" || -f "$IMPORT/$id.m4a" || -f "$IMPORT/$id.caf" ]]; then
    echo "✓ already have audio for $id"
  else
    echo "… waiting for you to record this scene"
  fi
  echo ""
done < "$LINES"

cat <<EOF

When all 6 clips are in $IMPORT, run:
  cd $ROOT && npm run voiceover:import && npm run render

Verify only (no import):
  ls -la $IMPORT
EOF