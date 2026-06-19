#!/usr/bin/env node
/**
 * Verify agent discovery kit materialization (create-if-missing, no overwrite).
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const REQUIRED_PHRASES = [
  "no git",
  "versions",
  "npx kitchen changes",
  "npx kitchen auth",
  "~/.kitchen/auth.json",
  "role:public",
  "Offline",
  "npx convex",
];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

async function main() {
  const { ensureAgentDiscoveryKit } = await import("../dist/agent-discovery.js");
  const convexUrl = "https://example.convex.cloud";
  const root = await mkdtemp(path.join(tmpdir(), "kitchen-agent-discovery-"));

  try {
    const projectDir = path.join(root, "acme-my-app");
    await ensureAgentDiscoveryKit(projectDir, convexUrl);

    const agentsPath = path.join(projectDir, ".kitchen", "docs", "AGENTS.md");
    const convexPath = path.join(projectDir, ".kitchen", "convex.json");

    let agents;
    try {
      agents = await readFile(agentsPath, "utf8");
    } catch {
      fail(`missing ${agentsPath}`);
    }
    pass(`created ${agentsPath}`);

    for (const phrase of REQUIRED_PHRASES) {
      if (!agents.toLowerCase().includes(phrase.toLowerCase())) {
        fail(`AGENTS.md missing required phrase: ${phrase}`);
      }
    }
    pass("AGENTS.md prompt-compatible (versions, npx convex, no git, auth, public, offline)");

    const convexJson = JSON.parse(await readFile(convexPath, "utf8"));
    if (convexJson.deploymentUrl !== convexUrl) {
      fail(`convex.json deploymentUrl mismatch: ${convexJson.deploymentUrl}`);
    }
    pass(`created ${convexPath}`);

    const custom = "# user-edited agent notes\n";
    await writeFile(agentsPath, custom, "utf8");
    await ensureAgentDiscoveryKit(projectDir, "https://other.convex.cloud");
    const after = await readFile(agentsPath, "utf8");
    if (after !== custom) {
      fail("AGENTS.md was overwritten after user edit");
    }
    pass("create-if-missing preserves user-edited AGENTS.md");

    const convexAfter = JSON.parse(await readFile(convexPath, "utf8"));
    if (convexAfter.deploymentUrl !== convexUrl) {
      fail("convex.json was overwritten after initial materialization");
    }
    pass("create-if-missing preserves existing convex.json");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((e) => fail(e.message ?? String(e)));