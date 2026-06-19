#!/usr/bin/env bash
# Code quality loop — runs gx against tasks/qa/ until QA refactor tasks complete.
#
# Usage:
#   ./loop-qa.sh
#   KITCHEN_LOOP_MAX_ITER=5 ./loop-qa.sh
#
set -euo pipefail

export KITCHEN_LOOP_SERIES=qa
export KITCHEN_TASKS_DIR=tasks/qa
export KITCHEN_LOOP_STATE_DIR=.kitchen-loop/qa
export KITCHEN_COMPLETION_PROMISE=KITCHEN_QA_COMPLETE
export KITCHEN_COMPLETE_MARKER=QA_COMPLETE
export KITCHEN_LOOP_LABEL="code QA"

exec "$(cd "$(dirname "$0")" && pwd)/loop.sh"