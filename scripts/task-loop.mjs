#!/usr/bin/env node
/**
 * Kitchen task loop helpers — supports product (tasks/) and QA (tasks/qa/) series.
 *
 * Usage:
 *   node scripts/task-loop.mjs next
 *   KITCHEN_LOOP_SERIES=qa node scripts/task-loop.mjs status
 */
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getLoopConfig, taskFilePattern } from "./task-loop-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = getLoopConfig(root);

function readState() {
  if (!existsSync(cfg.statePath)) {
    return {
      iteration: 0,
      lastTask: null,
      lastStatus: null,
      lastRunAt: null,
      series: cfg.series,
    };
  }
  return JSON.parse(readFileSync(cfg.statePath, "utf8"));
}

function writeState(state) {
  mkdirSync(dirname(cfg.statePath), { recursive: true });
  writeFileSync(
    cfg.statePath,
    `${JSON.stringify({ ...state, series: cfg.series }, null, 2)}\n`,
  );
}

function taskFiles() {
  if (!existsSync(cfg.tasksDir)) return [];
  const pattern = taskFilePattern(cfg.series);
  return readdirSync(cfg.tasksDir)
    .filter((f) => pattern.test(f))
    .sort();
}

/** @returns {{ id: string, path: string, title: string, markdown: string, done: boolean, pendingCriteria: string[] }} */
function parseTask(filename) {
  const path = join(cfg.tasksDir, filename);
  const markdown = readFileSync(path, "utf8");
  const id = filename.replace(/\.md$/, "");
  const titleMatch = markdown.match(/^#\s+Task\s+\d+:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : id;

  const criteriaBlock = markdown.match(
    /## Done criteria\n([\s\S]*?)(?=\n## |\n$)/,
  );
  const criteriaLines = criteriaBlock
    ? criteriaBlock[1].split("\n").filter((l) => /^- \[[ x]\]/.test(l))
    : [];

  const pendingCriteria = criteriaLines
    .filter((l) => /^- \[ \]/.test(l))
    .map((l) => l.replace(/^- \[ \] /, "").trim());

  const done =
    criteriaLines.length > 0 && pendingCriteria.length === 0;

  return { id, path, title, markdown, done, pendingCriteria };
}

function allTasks() {
  return taskFiles().map(parseTask);
}

function nextTask() {
  return allTasks().find((t) => !t.done) ?? null;
}

function allComplete() {
  return nextTask() === null && taskFiles().length > 0;
}

function qaGuidelines() {
  if (cfg.series !== "qa") return "";
  return `
## Code quality guidelines (this loop)
- Minimize \`useEffect\` — prefer mutation return values, lifted state, server redirects
- Minimize \`try/catch\` — use shared \`getErrorMessage\` from \`web/src/lib/errors.ts\`
- Minimize type casts (\`as Id<>\`) — parse at route boundaries; infer Convex types
- Maximize type inference — avoid explicit return types on components/helpers
- Do NOT add react-query or tRPC — Convex \`useQuery\`/\`useMutation\` is the data layer
- zod: route param + form validation only; zustand: client UI state only (settings tab/org)
- Match exemplar: \`web/src/lib/merge/diffLinePick.ts\` (pure, inferred types)
- Read plan: tasks reference \`plans/01N-qa-*.md\`
`;
}

function buildPrompt() {
  const task = nextTask();
  const state = readState();

  if (!task) {
    return `All Kitchen ${cfg.loopLabel} tasks in ${cfg.tasksDir.replace(root + "/", "")}/ are complete.

Run final verification, then output exactly:
<promise>${cfg.completionPromise}</promise>`;
  }

  const remaining = allTasks().filter((t) => !t.done).length;
  const taskRelPath = task.path.replace(root + "/", "");

  return `Refactor/improve the Kitchen ${cfg.loopLabel} autonomously. Execute end-to-end — do not ask the user to confirm.

## Repository
${root}

## Product location
All application code lives in \`./web\` (Next.js + Convex + Clerk).

## Read first
- ${cfg.tasksReadme}
- ${taskRelPath}
- ${cfg.plansReadme} (code QA plans 012–016 when doing QA tasks)
- docs/the-kitchen-way.md
- GLOSSARY.md
${qaGuidelines()}
## This iteration (#${state.iteration + 1})
Complete exactly ONE task file:

**${task.id}: ${task.title}**

Task file: \`${taskRelPath}\`

Pending done criteria:
${task.pendingCriteria.map((c) => `- ${c}`).join("\n") || "- (parse failed — read task file)"}

## Success criteria
1. Implement everything in the task's **Steps** and **Done criteria**
2. Respect Kitchen invariants (insert-only versions, property ACL, no git UX)
3. Run the task's **Verify** commands; fix failures before marking done
4. Update the task file: check every \`- [ ]\` under **Done criteria** to \`- [x]\`
5. Commit with message: \`${cfg.commitPrefix}: ${task.id} <short summary>\`
6. Summarize changes and name the next task

## Loop control
- ${remaining} task(s) remain after this one
- When ALL tasks in this series have done criteria \`[x]\` AND verify passes, output exactly:
  <promise>${cfg.completionPromise}</promise>
- If blocked, document under **Blockers** in the task file; do NOT output the completion promise

## Context
- Series: ${cfg.series}
- Previous iteration: ${state.lastStatus ?? "none"}
- Last task: ${state.lastTask ?? "none"}
`;
}

function cmdNext() {
  const task = nextTask();
  console.log(task ? task.id : "COMPLETE");
}

function cmdCompleteCheck() {
  console.log(allComplete() ? "COMPLETE" : "PENDING");
}

function cmdPrompt() {
  console.log(buildPrompt());
}

function cmdStatus() {
  const tasks = allTasks();
  const task = nextTask();
  const state = readState();
  console.log(
    JSON.stringify(
      {
        series: cfg.series,
        tasksDir: cfg.tasksDir.replace(root + "/", ""),
        complete: allComplete(),
        iteration: state.iteration,
        nextTask: task
          ? { id: task.id, title: task.title, pending: task.pendingCriteria }
          : null,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          done: t.done,
          pendingCount: t.pendingCriteria.length,
        })),
        logFile: cfg.logPath,
        stateFile: cfg.statePath,
        completionPromise: cfg.completionPromise,
      },
      null,
      2,
    ),
  );
}

function cmdBump() {
  const state = readState();
  const task = nextTask();
  state.iteration += 1;
  state.lastRunAt = new Date().toISOString();
  state.lastTask = task ? task.id : null;
  state.lastStatus = task ? "running" : "complete";
  writeState(state);
  console.log(state.iteration);
}

function cmdVerify() {
  const webDir = join(root, "web");
  if (!existsSync(join(webDir, "package.json"))) {
    console.error("web/package.json missing");
    process.exit(1);
  }
  execSync("npm run build", { cwd: webDir, stdio: "inherit" });
  try {
    execSync("npm run lint", { cwd: webDir, stdio: "inherit" });
  } catch {
    // lint warnings allowed
  }
  if (cfg.series === "qa") {
    try {
      execSync("npx tsc --noEmit -p tsconfig.json", {
        cwd: webDir,
        stdio: "inherit",
      });
    } catch {
      process.exit(1);
    }
  }
}

const command = process.argv[2] ?? "help";

switch (command) {
  case "next":
    cmdNext();
    break;
  case "prompt":
    cmdPrompt();
    break;
  case "complete-check":
    cmdCompleteCheck();
    break;
  case "status":
    cmdStatus();
    break;
  case "bump":
    cmdBump();
    break;
  case "verify":
    cmdVerify();
    break;
  default:
    console.error(
      "Usage: node scripts/task-loop.mjs <next|prompt|complete-check|status|bump|verify>",
    );
    process.exit(command === "help" ? 0 : 1);
}