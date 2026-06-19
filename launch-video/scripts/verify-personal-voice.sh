#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/tools"
MYSAY="$TOOLS/mysay.dylib"
TEST="${1:-This is a personal voice verification test.}"

if [[ ! -x "$TOOLS/personal-speak" ]]; then
  (cd "$TOOLS" && make personal-speak)
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

render() {
  local voice="$1"
  local out="$tmpdir/$voice.caf"
  DYLD_INSERT_LIBRARIES="$MYSAY" "$TOOLS/personal-speak" -v "$voice" -o "$out" "$TEST" >/dev/null
  md5 -q "$out"
}

echo "Verifying Personal Voice synthesis (Michael vs Rusty vs Samantha)..."
michael_hash="$(render Michael)"
rusty_hash="$(render Rusty)"
sam_hash="$(render Samantha)"

echo "Michael:  $michael_hash"
echo "Rusty:    $rusty_hash"
echo "Samantha: $sam_hash"
echo ""

if [[ "$michael_hash" == "$sam_hash" && "$rusty_hash" == "$sam_hash" ]]; then
  cat <<'EOF'
RESULT: macOS is rendering byte-identical audio for Personal Voice and Samantha.

Your Personal Voice is authorized (Michael / Rusty) but the neural model is not
actually being used for file export — everything sounds like Samantha.

Try on this Mac:
  1. System Settings → Accessibility → Personal Voice
  2. Open Michael → tap Preview — does THAT sound like you?
  3. If preview is wrong too: recreate or re-download Personal Voice on this Mac
  4. If preview is right but CLI is wrong: record manually (see voiceover:import)

Workaround: record your own clips and import them:
  npm run voiceover:import
EOF
  exit 1
fi

echo "RESULT: Personal Voice audio differs from Samantha. Safe to run npm run voiceover."