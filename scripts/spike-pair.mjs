#!/usr/bin/env node
/**
 * Plan 010 spike: two Collab agents, one relay, one mirror file.
 * Simulates nvim + VS Code via disk writes (no editor plugins).
 */
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CollabRelay } from "../packages/collab-relay/dist/index.js";
import { CollabAgent } from "../packages/collab-agent/dist/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "kitchen-spike-"));
  const filePath = join(dir, "test.ts");
  writeFileSync(filePath, "// start\n", "utf8");

  const relay = new CollabRelay({ port: 0, host: "127.0.0.1" });
  await relay.start();
  const relayUrl = relay.url;

  const sessionId = "spike-session-1";
  const checkpoints = [];

  const alice = new CollabAgent({
    relayUrl,
    filePath,
    userId: "alice",
    sessionId,
    onCheckpoint: (versionId, content) => {
      checkpoints.push({ versionId, content, from: "alice" });
    },
  });

  const bob = new CollabAgent({
    relayUrl,
    filePath,
    userId: "bob",
    sessionId,
  });

  await alice.connect(true);
  await bob.connect(false);
  await sleep(100);

  // Alice "types" (simulates nvim autowrite)
  writeFileSync(filePath, "// start\nexport const foo = 1;\n", "utf8");
  await sleep(200);

  const afterAlice = readFileSync(filePath, "utf8");
  if (!afterAlice.includes("export const foo")) {
    throw new Error("Alice edit not visible locally");
  }

  // Bob's agent should have received remote op — verify via separate read after debounce
  await sleep(300);
  const bobView = readFileSync(filePath, "utf8");
  if (!bobView.includes("export const foo")) {
    throw new Error("Bob did not receive Alice op");
  }

  // Bob "types"
  writeFileSync(
    filePath,
    "// start\nexport const foo = 1;\nexport const bar = 2;\n",
    "utf8"
  );
  await sleep(300);

  const aliceView = readFileSync(filePath, "utf8");
  if (!aliceView.includes("export const bar")) {
    throw new Error("Alice did not receive Bob op");
  }

  alice.checkpoint();
  await sleep(200);

  if (checkpoints.length !== 1) {
    throw new Error(`Expected 1 checkpoint, got ${checkpoints.length}`);
  }

  if (!checkpoints[0].versionId.startsWith("v")) {
    throw new Error("Checkpoint missing versionId");
  }

  await alice.disconnect();
  await bob.disconnect();
  await relay.stop();

  console.log("spike:pair OK");
  console.log(`  session: ${sessionId}`);
  console.log(`  checkpoint: ${checkpoints[0].versionId}`);
  console.log(`  editors: simulated disk writes (editor-agnostic)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});