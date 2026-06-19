#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTH_BIN="$ROOT/tools/authorize_terminal"

if [[ ! -x "$AUTH_BIN" ]]; then
  echo "Missing $AUTH_BIN — run: (cd launch-video/tools && make)"
  exit 1
fi

AUTH_LOG="$("$AUTH_BIN" 2>&1 || true)"

if echo "$AUTH_LOG" | rg -q '^Authorized!'; then
  mapfile -t VOICES < <(
    echo "$AUTH_LOG" | rg '^Personal Voice Found:' | sed 's/^Personal Voice Found: //' | sed 's/[[:space:]]*$//'
  )
  if [[ ${#VOICES[@]} -eq 0 ]]; then
    echo "Authorized, but no Personal Voice name was returned." >&2
    exit 1
  fi

  if [[ -n "${PERSONAL_VOICE_NAME:-}" ]]; then
    for voice in "${VOICES[@]}"; do
      if [[ "$voice" == "$PERSONAL_VOICE_NAME" ]]; then
        echo "$voice"
        exit 0
      fi
    done
    echo "PERSONAL_VOICE_NAME=$PERSONAL_VOICE_NAME not found. Available: ${VOICES[*]}" >&2
    exit 1
  fi

  # Default: first Personal Voice (usually the user's own)
  echo "${VOICES[0]}"
  exit 0
fi

cat <<'EOF'
Personal Voice is not available to this terminal (authorization denied).

Apple does NOT expose Personal Voice through normal `say -v` — it silently falls
back to Samantha. That is what happened on the last render.

Fix (one-time on this Mac):
  1. System Settings → Accessibility → Personal Voice
  2. Turn ON “Allow applications to request to use”
  3. Enable Terminal and/or Cursor in the app list below
  4. Confirm your Personal Voice shows as installed on this Mac (not just iPhone)
  5. Re-run: cd launch-video && npm run voiceover:check

Optional wake-up if the voice goes dormant:
  Settings → Accessibility → Live Speech → pick your Personal Voice → speak a word

Then regenerate:
  npm run voiceover && npm run render
EOF

echo ""
echo "authorize_terminal output:"
echo "$AUTH_LOG"
exit 1