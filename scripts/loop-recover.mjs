#!/usr/bin/env node
/**
 * Analyze loop stop state and append recovery tasks if needed.
 * Respects KITCHEN_LOOP_SERIES / KITCHEN_TASKS_DIR (see task-loop-config.mjs).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getLoopConfig, taskFilePattern } from "./task-loop-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = getLoopConfig(root);
const tasksDir = cfg.tasksDir;

function taskFiles() {
  if (!existsSync(tasksDir)) return [];
  const pattern = taskFilePattern(cfg.series);
  return readdirSync(tasksDir)
    .filter((f) => pattern.test(f))
    .sort();
}

function parseTask(filename) {
  const markdown = readFileSync(join(tasksDir, filename), "utf8");
  const criteria = [...markdown.matchAll(/^- \[[ x]\] (.+)$/gm)];
  const pending = criteria.filter((m) => m[0].startsWith("- [ ]"));
  return {
    filename,
    markdown,
    pending: pending.map((m) => m[1]),
    done: pending.length === 0,
  };
}

function nextId() {
  const files = taskFiles();
  if (files.length === 0) return "001";
  const nums = files.map((f) => parseInt(f.slice(0, 3), 10));
  return String(Math.max(...nums) + 1).padStart(3, "0");
}

function buildOk() {
  try {
    execSync("npm run build", {
      cwd: join(root, "web"),
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

const tasks = taskFiles().map(parseTask);
const incomplete = tasks.filter((t) => !t.done);
const webExists = existsSync(join(root, "web", "package.json"));
const buildPasses = webExists && buildOk();

const recovery = [];

if (!webExists) {
  recovery.push({
    name: "recover-web-scaffold",
    goal: "Recreate or repair ./web after failed loop iteration",
    steps: ["Re-run tasks/001-web-scaffold.md criteria", "npm run build in web/"],
  });
} else if (incomplete.length > 0) {
  const next = incomplete[0];
  recovery.push({
    name: `continue-${next.filename.replace(".md", "")}`,
    goal: `Resume ${next.filename}`,
    steps: incomplete
      .slice(0, 3)
      .map((t) => `Complete ${t.filename} (${t.pending.length} criteria left)`),
  });
} else if (!buildPasses) {
  recovery.push({
    name: "recover-build",
    goal: "Fix web production build failures",
    steps: [
      "Run cd web && npm run build and fix TypeScript/errors",
      "Mark blocking task done criteria only when verify passes",
    ],
  });
}

const openRecovery = tasks.filter(
  (t) =>
    !t.done &&
    (t.filename.includes("-continue-") || t.filename.includes("-recover-")),
);

if (recovery.length > 0 && openRecovery.length === 0) {
  for (const item of recovery) {
    const id = nextId();
    const path = join(tasksDir, `${id}-${item.name}.md`);
    const relTasksDir = tasksDir.replace(root + "/", "");
    const body = `# Task ${id}: ${item.name.replace(/-/g, " ")}

**Auto-generated recovery task** — created because the ${cfg.loopLabel} loop stopped before completion.

## Goal

${item.goal}

## Done criteria

- [ ] Recovery goal achieved
- [ ] \`npm run build\` passes in \`web/\`
- [ ] Original pending tasks unblocked or completed

## Steps

${item.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Verify

\`\`\`bash
cd web && npm run build
KITCHEN_LOOP_SERIES=${cfg.series} node scripts/task-loop.mjs status
\`\`\`
`;
    writeFileSync(path, body);
    console.log(`Created ${relTasksDir}/${id}-${item.name}.md`);
  }
} else if (recovery.length === 0) {
  console.log("No recovery tasks needed.");
} else if (openRecovery.length > 0) {
  console.log(
    `Open recovery task(s) already exist (${openRecovery.map((t) => t.filename).join(", ")}) — skipping creation.`,
  );
} else {
  console.log("No recovery tasks needed.");
}

console.log(
  JSON.stringify(
    {
      series: cfg.series,
      tasksDir: tasksDir.replace(root + "/", ""),
      webExists,
      buildPasses,
      incompleteCount: incomplete.length,
      next: incomplete[0]?.filename ?? "COMPLETE",
    },
    null,
    2,
  ),
);