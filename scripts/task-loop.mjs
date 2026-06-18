#!/usr/bin/env node
/**
 * Kitchen task loop helpers (tasks/001-*.md).
 *
 * Usage:
 *   node scripts/task-loop.mjs next            # next incomplete task id or COMPLETE
 *   node scripts/task-loop.mjs prompt          # agent prompt for next task
 *   node scripts/task-loop.mjs complete-check  # COMPLETE or PENDING
 *   node scripts/task-loop.mjs status          # JSON snapshot
 *   node scripts/task-loop.mjs bump            # increment iteration counter
 *   node scripts/task-loop.mjs verify          # build gate (exit 1 on fail)
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

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tasksDir = join(root, "tasks");
const stateDir = join(root, ".kitchen-loop");
const statePath = join(stateDir, "loop.state.json");
const logPath = join(stateDir, "loop.log");
const completionPromise = "KITCHEN_SHIP_COMPLETE";

function readState() {
  if (!existsSync(statePath)) {
    return {
      iteration: 0,
      lastTask: null,
      lastStatus: null,
      lastRunAt: null,
    };
  }
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function writeState(state) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function taskFiles() {
  return readdirSync(tasksDir)
    .filter((f) => /^[0-9]{3}-.+\.md$/.test(f))
    .sort();
}

/** @returns {{ id: string, path: string, title: string, markdown: string, done: boolean, pendingCriteria: string[] }} */
function parseTask(filename) {
  const path = join(tasksDir, filename);
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
  return nextTask() === null;
}

function buildPrompt() {
  const task = nextTask();
  const state = readState();

  if (!task) {
    return `All Kitchen web/cloud tasks in tasks/ are complete.

Run final verification, then output exactly:
<promise>${completionPromise}</promise>`;
  }

  const remaining = allTasks().filter((t) => !t.done).length;

  return `Build the Kitchen web/cloud product autonomously. Execute end-to-end — do not ask the user to confirm.

## Repository
${root}

## Product location
All application code lives in \`./web\` (Next.js + Convex + Clerk).

## Read first (ground truth)
- tasks/README.md
- ${task.path.replace(root + "/", "")}
- docs/the-kitchen-way.md
- docs/concepts/schema.md
- docs/concepts/permissions.md
- docs/clients/web-and-mobile.md
- GLOSSARY.md

## This iteration (#${state.iteration + 1})
Complete exactly ONE task file:

**${task.id}: ${task.title}**

Task file: \`tasks/${task.id}.md\`

Pending done criteria:
${task.pendingCriteria.map((c) => `- ${c}`).join("\n") || "- (parse failed — read task file)"}

## Success criteria
1. Implement everything in the task's **Steps** and **Done criteria**
2. Respect Kitchen invariants (insert-only versions, three entities, property ACL)
3. Run the task's **Verify** commands; fix failures before marking done
4. Update the task file: check every \`- [ ]\` under **Done criteria** to \`- [x]\`
5. If the task touches shared docs, update only what the task requires
6. Commit with message: \`feat(web): ${task.id} <short summary>\`
7. Summarize changes and name the next task

## Constraints
- Web app root: \`./web\` only (Convex in \`web/convex/\`)
- Reference backend: Convex (docs/concepts/schema.md)
- Auth: Clerk (Next.js App Router patterns)
- No git operations in the product UX; versions are insert-only rows
- Collab sessions are protocol — no \`collab_sessions\` Convex table
- Voice/chat external; Kitchen syncs file bytes only
- Use existing \`packages/collab-*\` where task 012 applies — do not duplicate protocol

## Loop control
- ${remaining} task(s) remain after this one
- When ALL tasks/00*.md done criteria are \`[x]\` AND \`node scripts/task-loop.mjs verify\` passes, output exactly:
  <promise>${completionPromise}</promise>
- If blocked (missing API keys, external service), document blocker at bottom of task file under **Blockers** and do NOT output the completion promise

## Context
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
        logFile: logPath,
        stateFile: statePath,
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
    console.error("web/package.json missing — run task 001 first");
    process.exit(1);
  }
  execSync("npm run build", { cwd: webDir, stdio: "inherit" });
  try {
    execSync("npm run lint", { cwd: webDir, stdio: "inherit" });
  } catch {
    // lint script optional until added
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