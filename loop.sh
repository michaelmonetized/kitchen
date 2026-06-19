#!/usr/bin/env bash
# Kitchen autonomous build loop — runs gx agents until task series completes.
#
# Product loop (default):
#   ./loop.sh
#
# Code QA loop:
#   ./loop-qa.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export KITCHEN_LOOP_SERIES="${KITCHEN_LOOP_SERIES:-product}"
export KITCHEN_TASKS_DIR="${KITCHEN_TASKS_DIR:-tasks}"
export KITCHEN_LOOP_STATE_DIR="${KITCHEN_LOOP_STATE_DIR:-.kitchen-loop}"
export KITCHEN_COMPLETION_PROMISE="${KITCHEN_COMPLETION_PROMISE:-KITCHEN_SHIP_COMPLETE}"
export KITCHEN_COMPLETE_MARKER="${KITCHEN_COMPLETE_MARKER:-SHIP_COMPLETE}"
export KITCHEN_LOOP_LABEL="${KITCHEN_LOOP_LABEL:-web/cloud product}"

MAX_ITER="${KITCHEN_LOOP_MAX_ITER:-0}"
MAX_TURNS="${KITCHEN_LOOP_MAX_TURNS:-120}"
SLEEP_SEC="${KITCHEN_LOOP_SLEEP_SEC:-5}"
STATE_DIR="${ROOT}/${KITCHEN_LOOP_STATE_DIR}"
LOG_FILE="${STATE_DIR}/loop.log"
COMPLETE_FILE="${STATE_DIR}/${KITCHEN_COMPLETE_MARKER}"
GROK_BIN="${GROK_BIN:-${HOME}/.grok/bin/grok}"
USE_ZSH="${USE_ZSH:-1}"

mkdir -p "$STATE_DIR"

if [[ ! -x "$GROK_BIN" ]]; then
  echo "grok binary not found: $GROK_BIN" >&2
  exit 1
fi

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

task_loop() {
  node scripts/task-loop.mjs "$@"
}

echo "Kitchen loop starting in $ROOT" | tee -a "$LOG_FILE"
echo "Series: ${KITCHEN_LOOP_SERIES} (${KITCHEN_LOOP_LABEL})" | tee -a "$LOG_FILE"
echo "Tasks dir: ${KITCHEN_TASKS_DIR}" | tee -a "$LOG_FILE"
echo "Agent: gx via $GROK_BIN" | tee -a "$LOG_FILE"
echo "Max iterations: $(if [[ "$MAX_ITER" == "0" ]]; then echo unlimited; else echo "$MAX_ITER"; fi)" | tee -a "$LOG_FILE"

while true; do
  if task_loop complete-check | grep -qx COMPLETE; then
    if task_loop verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "All tasks complete and verify passed." | tee -a "$LOG_FILE"
      echo "$KITCHEN_COMPLETION_PROMISE" > "$COMPLETE_FILE"
      exit 0
    fi
    echo "Tasks complete but verify failed — continuing." | tee -a "$LOG_FILE"
  fi

  ITERATION="$(task_loop bump)"
  NEXT_TASK="$(task_loop next)"

  if [[ "$NEXT_TASK" == "COMPLETE" ]]; then
    if task_files=$(ls "${KITCHEN_TASKS_DIR}"/[0-9][0-9][0-9]-*.md 2>/dev/null | wc -l) && [[ "$task_files" -eq 0 ]]; then
      echo "No task files in ${KITCHEN_TASKS_DIR} — aborting." | tee -a "$LOG_FILE"
      exit 1
    fi
    echo "No pending tasks; running verify..." | tee -a "$LOG_FILE"
    if task_loop verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "$KITCHEN_COMPLETION_PROMISE" > "$COMPLETE_FILE"
      exit 0
    fi
    sleep "$SLEEP_SEC"
    continue
  fi

  if [[ "$MAX_ITER" != "0" && "$ITERATION" -gt "$MAX_ITER" ]]; then
    echo "Reached KITCHEN_LOOP_MAX_ITER=$MAX_ITER — stopping." | tee -a "$LOG_FILE"
    exit 0
  fi

  echo "" | tee -a "$LOG_FILE"
  echo "=== Iteration $ITERATION: $NEXT_TASK ===" | tee -a "$LOG_FILE"

  PROMPT="$(task_loop prompt)"
  ITER_LOG="${STATE_DIR}/iteration-${ITERATION}.log"
  run_gx "$PROMPT" 2>&1 | tee -a "$LOG_FILE" | tee "$ITER_LOG" || {
    echo "gx exited non-zero on iteration $ITERATION (continuing)" | tee -a "$LOG_FILE"
  }

  if grep -q "<promise>${KITCHEN_COMPLETION_PROMISE}</promise>" "$ITER_LOG" 2>/dev/null; then
    if task_loop verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "$KITCHEN_COMPLETION_PROMISE" > "$COMPLETE_FILE"
      exit 0
    fi
  fi

  if task_loop complete-check | grep -qx COMPLETE; then
    if task_loop verify 2>&1 | tee -a "$LOG_FILE"; then
      echo "$KITCHEN_COMPLETION_PROMISE" > "$COMPLETE_FILE"
      exit 0
    fi
  fi

  node scripts/loop-recover.mjs 2>&1 | tee -a "$LOG_FILE" || true
  sleep "$SLEEP_SEC"
done