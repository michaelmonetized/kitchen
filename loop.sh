#!/usr/bin/env bash
# Kitchen autonomous build loop — runs gx agents until web product ships.
#
# gx alias (from ~/.config/zsh/aliases):
#   grok --always-approve --effort max -m grok-composer-2.5-fast \
#     --permission-mode bypassPermissions --reasoning-effort xhigh --todo-gate
#
# Usage:
#   ./loop.sh                  # run until all tasks complete + verify passes
#   KITCHEN_LOOP_MAX_ITER=5 ./loop.sh   # cap iterations (0 = unlimited)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

MAX_ITER="${KITCHEN_LOOP_MAX_ITER:-0}"
MAX_TURNS="${KITCHEN_LOOP_MAX_TURNS:-120}"
SLEEP_SEC="${KITCHEN_LOOP_SLEEP_SEC:-5}"
COMPLETION_PROMISE="KITCHEN_SHIP_COMPLETE"
STATE_DIR="${ROOT}/.kitchen-loop"
LOG_FILE="${STATE_DIR}/loop.log"
GROK_BIN="${GROK_BIN:-${HOME}/.grok/bin/grok}"
# Prefer zsh login shell so gx alias + CLIs (clerk, vercel, npx convex) are on PATH.
USE_ZSH="${USE_ZSH:-1}"

mkdir -p "$STATE_DIR"

if [[ ! -x "$GROK_BIN" ]]; then
  echo "grok binary not found: $GROK_BIN" >&2
  echo "Set GROK_BIN or install grok CLI." >&2
  exit 1
fi

if [[ ! -f "${ROOT}/scripts/task-loop.mjs" ]]; then
  echo "Missing scripts/task-loop.mjs" >&2
  exit 1
fi

# Match ~/.config/zsh/aliases `gx` profile (bash cannot use zsh aliases directly).
run_gx() {
  local prompt="$1"
  local gx_args=(
    --always-approve
    --effort max
    -m grok-composer-2.5-fast
    --permission-mode bypassPermissions
    --reasoning-effort xhigh
    --todo-gate
    -p "$prompt"
    --cwd "$ROOT"
    --check
    --max-turns "$MAX_TURNS"
  )
  if [[ "$USE_ZSH" == "1" ]]; then
    zsh -lic "export PATH=\"${HOME}/.bun/bin:${HOME}/.nvm/versions/node/v23.9.0/bin:${HOME}/.local/bin:\$PATH\"; exec \"$GROK_BIN\" $(printf '%q ' "${gx_args[@]}")"
  else
    "$GROK_BIN" "${gx_args[@]}"
  fi
}

echo "Kitchen loop starting in $ROOT" | tee -a "$LOG_FILE"
echo "Agent: gx profile via $GROK_BIN" | tee -a "$LOG_FILE"
echo "Max iterations: $(if [[ "$MAX_ITER" == "0" ]]; then echo unlimited; else echo "$MAX_ITER"; fi)" | tee -a "$LOG_FILE"
echo "Tasks: tasks/001-*.md → tasks/014-*.md" | tee -a "$LOG_FILE"

while true; do
  if node scripts/task-loop.mjs complete-check | grep -qx COMPLETE; then
    if node scripts/task-loop.mjs verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "All tasks complete and verify passed." | tee -a "$LOG_FILE"
      echo "KITCHEN_SHIP_COMPLETE" > "${STATE_DIR}/SHIP_COMPLETE"
      exit 0
    fi
    echo "Tasks marked complete but verify failed — continuing loop." | tee -a "$LOG_FILE"
  fi

  ITERATION="$(node scripts/task-loop.mjs bump)"
  NEXT_TASK="$(node scripts/task-loop.mjs next)"

  if [[ "$NEXT_TASK" == "COMPLETE" ]]; then
    echo "No pending tasks; running verify..." | tee -a "$LOG_FILE"
    if node scripts/task-loop.mjs verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "KITCHEN_SHIP_COMPLETE" > "${STATE_DIR}/SHIP_COMPLETE"
      exit 0
    fi
    echo "Verify failed with no pending tasks — check web/ build." | tee -a "$LOG_FILE"
    sleep "$SLEEP_SEC"
    continue
  fi

  if [[ "$MAX_ITER" != "0" && "$ITERATION" -gt "$MAX_ITER" ]]; then
    echo "Reached KITCHEN_LOOP_MAX_ITER=$MAX_ITER — stopping." | tee -a "$LOG_FILE"
    echo "Next task: $NEXT_TASK" | tee -a "$LOG_FILE"
    exit 0
  fi

  echo "" | tee -a "$LOG_FILE"
  echo "=== Iteration $ITERATION: $NEXT_TASK ===" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  PROMPT="$(node scripts/task-loop.mjs prompt)"

  run_gx "$PROMPT" 2>&1 | tee -a "$LOG_FILE" || {
    echo "gx exited non-zero on iteration $ITERATION (continuing loop)" | tee -a "$LOG_FILE"
  }

  if grep -q "<promise>${COMPLETION_PROMISE}</promise>" "$LOG_FILE" 2>/dev/null; then
    echo "Completion promise detected — running verify..." | tee -a "$LOG_FILE"
    if node scripts/task-loop.mjs verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "KITCHEN_SHIP_COMPLETE" > "${STATE_DIR}/SHIP_COMPLETE"
      exit 0
    fi
  fi

  if node scripts/task-loop.mjs complete-check | grep -qx COMPLETE; then
    if node scripts/task-loop.mjs verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "Tasks complete and verified." | tee -a "$LOG_FILE"
      echo "KITCHEN_SHIP_COMPLETE" > "${STATE_DIR}/SHIP_COMPLETE"
      exit 0
    fi
  fi

  node scripts/loop-recover.mjs 2>&1 | tee -a "$LOG_FILE" || true

  sleep "$SLEEP_SEC"
done