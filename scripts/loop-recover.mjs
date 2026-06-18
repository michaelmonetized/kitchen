#!/usr/bin/env node
/**
 * Analyze loop stop state and append recovery tasks if needed.
 *
 * Usage: node scripts/loop-recover.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tasksDir = join(root, "tasks");

function taskFiles() {
  return readdirSync(tasksDir)
    .filter((f) => /^[0-9]{3}-.+\.md$/.test(f))
    .sort();
}

function parseTask(filename) {
  const markdown = readFileSync(join(tasksDir, filename), "utf8");
  const criteria = [...markdown.matchAll(/^- \[[ x]\] (.+)$/gm)];
  const pending = criteria.filter((m) => m[0].startsWith("- [ ]"));
  return { filename, markdown, pending: pending.map((m) => m[1]), done: pending.length === 0 };
}

function nextId() {
  const nums = taskFiles().map((f) => parseInt(f.slice(0, 3), 10));
  const max = Math.max(...nums);
  return String(max + 1).padStart(3, "0");
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
} else if (!buildPasses) {
  recovery.push({
    name: "recover-build",
    goal: "Fix web production build failures",
    steps: [
      "Run cd web && npm run build and fix TypeScript/errors",
      "Ensure placeholder Clerk mode or valid keys",
      "Mark blocking task done criteria only when verify passes",
    ],
  });
}

if (incomplete.length > 0) {
  const next = incomplete[0];
  recovery.push({
    name: `continue-${next.filename.replace(".md", "")}`,
    goal: `Resume ${next.filename}`,
    steps: incomplete.slice(0, 3).map((t) => `Complete ${t.filename} (${t.pending.length} criteria left)`),
  });
}

const existingRecovery = taskFiles().filter((f) => f.includes("-recover-"));
if (recovery.length > 0 && existingRecovery.length === 0) {
  for (const item of recovery) {
    const id = nextId();
    const path = join(tasksDir, `${id}-${item.name}.md`);
    const body = `# Task ${id}: ${item.name.replace(/-/g, " ")}

**Auto-generated recovery task** — created because the build loop stopped before completion.

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
node scripts/task-loop.mjs status
\`\`\`
`;
    writeFileSync(path, body);
    console.log(`Created tasks/${id}-${item.name}.md`);
  }
} else if (recovery.length === 0) {
  console.log("No recovery tasks needed.");
} else {
  console.log("Recovery tasks already exist — skipping creation.");
}

console.log(
  JSON.stringify(
    {
      webExists,
      buildPasses,
      incompleteCount: incomplete.length,
      next: incomplete[0]?.filename ?? "COMPLETE",
    },
    null,
    2,
  ),
);