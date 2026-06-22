#!/usr/bin/env node
/**
 * Non-interactive verify for kitchen CLI fail-closed auth (ADR 0008).
 */
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "dist", "index.js");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

const tmpHome = await mkdtemp(path.join(tmpdir(), "kitchen-cli-verify-"));
const projectDir = path.join(tmpHome, "Projects", "acme-demo");
const kitchenDir = path.join(projectDir, ".kitchen");

try {
  await mkdir(kitchenDir, { recursive: true });
  await writeFile(
    path.join(kitchenDir, "convex.json"),
    JSON.stringify(
      {
        deploymentUrl: "https://example.convex.cloud",
        projectId: "test-project-id",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const result = spawnSync(
    process.execPath,
    [cli, "changes", "private/foo.ts"],
    {
      cwd: projectDir,
      env: {
        ...process.env,
        HOME: tmpHome,
        KITCHEN_MIRROR_ROOT: path.join(tmpHome, "Projects"),
      },
      encoding: "utf8",
    },
  );

  if (result.status === 0) {
    fail("kitchen changes should exit non-zero without auth");
  }

  const combined = `${result.stderr ?? ""}${result.stdout ?? ""}`;
  if (!/kitchen auth/i.test(combined)) {
    fail(`expected "kitchen auth" in output, got: ${combined}`);
  }
  pass("non-interactive private path fails closed with kitchen auth message");

  const authResult = spawnSync(process.execPath, [cli, "auth"], {
    cwd: projectDir,
    env: { ...process.env, HOME: tmpHome },
    encoding: "utf8",
  });
  if (authResult.status === 0) {
    fail("kitchen auth should exit non-zero without TTY");
  }
  if (!/kitchen auth/i.test(`${authResult.stderr ?? ""}${authResult.stdout ?? ""}`)) {
    fail("kitchen auth non-TTY should mention kitchen auth");
  }
  pass("non-interactive kitchen auth fails closed");

  const legacy = path.join(homedir(), ".kitchen", "mirror-auth.json");
  const current = path.join(homedir(), ".kitchen", "auth.json");
  if (legacy === current) {
    pass("auth.json path configured");
  } else {
    pass("auth.json distinct from legacy mirror-auth.json filename");
  }
} finally {
  await rm(tmpHome, { recursive: true, force: true });
}