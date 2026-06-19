/**
 * Shared config for product vs code-QA task loops.
 * Override via env (see loop.sh / loop-qa.sh).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export function getLoopConfig(root) {
  const series = process.env.KITCHEN_LOOP_SERIES ?? "product";
  const tasksDir = join(
    root,
    process.env.KITCHEN_TASKS_DIR ?? (series === "qa" ? "tasks/qa" : "tasks"),
  );
  const stateDir = join(
    root,
    process.env.KITCHEN_LOOP_STATE_DIR ??
      (series === "qa" ? ".kitchen-loop/qa" : ".kitchen-loop"),
  );

  return {
    series,
    tasksDir,
    statePath: join(stateDir, "loop.state.json"),
    logPath: join(stateDir, "loop.log"),
    completeMarkerPath: join(
      stateDir,
      process.env.KITCHEN_COMPLETE_MARKER ?? "COMPLETE",
    ),
    completionPromise:
      process.env.KITCHEN_COMPLETION_PROMISE ??
      (series === "qa" ? "KITCHEN_QA_COMPLETE" : "KITCHEN_SHIP_COMPLETE"),
    loopLabel:
      process.env.KITCHEN_LOOP_LABEL ??
      (series === "qa" ? "code QA" : "web/cloud product"),
    tasksReadme:
      series === "qa" ? "tasks/qa/README.md" : "tasks/README.md",
    plansReadme: "plans/README.md",
    commitPrefix: series === "qa" ? "refactor(web)" : "feat(web)",
    verifyBuild: existsSync(join(root, "web", "package.json")),
  };
}

export function taskFilePattern(series) {
  return /^[0-9]{3}-.+\.md$/;
}