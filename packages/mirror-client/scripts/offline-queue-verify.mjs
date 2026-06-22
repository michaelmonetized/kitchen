#!/usr/bin/env node
/**
 * Offline save queue smoke — durable queue + reconnect flush.
 * Uses KITCHEN_TEST_OFFLINE=1 to queue without Convex insert, then flushes on reconnect.
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { anyApi } from "convex/server";

const api = anyApi;
const smokeEmail =
  process.env.SMOKE_TEST_EMAIL ?? "kitchen-smoke@hustlestack.dev";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
const mirrorRoot =
  process.env.KITCHEN_MIRROR_ROOT ?? path.join(homedir(), "Projects");
const kitchenDir = path.join(homedir(), ".kitchen");
const authFile = path.join(kitchenDir, "auth.json");
const queueDir = path.join(kitchenDir, "queue");
const statusFile = path.join(kitchenDir, "status.json");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

async function ensureAuth() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) fail("CLERK_SECRET_KEY required");
  if (!convexUrl) fail("NEXT_PUBLIC_CONVEX_URL required");

  const clerk = createClerkClient({ secretKey });
  const listed = await clerk.users.getUserList({
    emailAddress: [smokeEmail],
    limit: 1,
  });
  const userId =
    listed.data[0]?.id ??
    (
      await clerk.users.createUser({
        emailAddress: [smokeEmail],
        password: "KitchenSmokeTest1!",
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      })
    ).id;

  const sessions = await clerk.sessions.getSessionList({
    userId,
    status: "active",
    limit: 1,
  });
  const session =
    sessions.data[0] ?? (await clerk.sessions.createSession({ userId }));

  await mkdir(path.dirname(authFile), { recursive: true });
  await writeFile(
    authFile,
    JSON.stringify(
      { sessionId: session.id, userId, email: smokeEmail, savedAt: Date.now() },
      null,
      2,
    ) + "\n",
  );
  pass("saved mirror auth session");
}

async function convexClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const clerk = createClerkClient({ secretKey });
  const auth = JSON.parse(await readFile(authFile, "utf8"));
  const token = await clerk.sessions.getToken(auth.sessionId, "convex");
  if (!token?.jwt) fail("Convex JWT");
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token.jwt);
  return client;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function projectDir(orgName, projectName) {
  return path.join(mirrorRoot, `${slugify(orgName)}-${slugify(projectName)}`);
}

async function waitForFile(filePath, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await readFile(filePath, "utf8");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  fail(`timeout waiting for ${filePath}`);
}

async function waitForQueueEntry(timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const names = await readdir(queueDir).catch(() => []);
    const entries = names.filter((n) => /^\d{10}-.+\.json$/.test(n));
    if (entries.length > 0) return entries.length;
    await new Promise((r) => setTimeout(r, 400));
  }
  fail("timeout waiting for queue entry");
}

async function waitForContent(client, fileId, needle, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = await client.query(api.queries.getFileWithContent, { fileId });
    if (row?.content?.includes(needle)) return row;
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`timeout waiting for cloud content containing ${needle}`);
}

async function waitForStatus(labelPart, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const status = JSON.parse(await readFile(statusFile, "utf8"));
      if (status.label?.includes(labelPart)) return status;
    } catch {
      // not written yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`timeout waiting for tray status containing "${labelPart}"`);
}

async function testQueuePersistence() {
  const testDir = path.join(kitchenDir, "queue-verify-test");
  await rm(testDir, { recursive: true, force: true });
  await mkdir(testDir, { recursive: true });

  const { InsertQueue } = await import("../dist/insert-queue.js");
  const q1 = await InsertQueue.open(testDir);
  await q1.enqueue({
    absolutePath: "/tmp/offline-test.txt",
    fileId: "test-file-id",
    hash: "abc123",
    contentBase64: Buffer.from("offline bytes").toString("base64"),
    projectId: "test-project-id",
    fileName: "offline-test.txt",
    queuedAt: Date.now(),
  });
  const count1 = await q1.count();
  if (count1 !== 1) fail(`expected 1 queued entry, got ${count1}`);

  const q2 = await InsertQueue.open(testDir);
  const count2 = await q2.count();
  if (count2 !== 1) fail(`queue did not survive restart (count ${count2})`);
  const entries = await q2.list();
  if (entries[0]?.hash !== "abc123") fail("queue entry hash mismatch after restart");
  pass("durable queue survives daemon restart");

  await rm(testDir, { recursive: true, force: true });
}

async function main() {
  await ensureAuth();
  await testQueuePersistence();

  const client = await convexClient();
  await client.mutation(api.users.ensureCurrent, {});
  const personal = await client.mutation(api.admin.ensurePersonalOrg, {});
  let projectId = personal?.projectId;
  if (!projectId) {
    const projects = await client.query(api.queries.projectsForUser, {});
    projectId = projects[0]?.project._id;
  }
  if (!projectId) fail("no project");

  const projects = await client.query(api.queries.projectsForUser, {});
  const row = projects.find((p) => p.project._id === projectId);
  const dir = projectDir(row.org.name, row.project.name);

  await rm(queueDir, { recursive: true, force: true });

  const fileName = `offline-smoke-${Date.now()}.txt`;
  const fileId = await client.mutation(api.files.insert, {
    parentId: projectId,
    type: "file",
    name: fileName,
    mime: "text/plain",
  });
  const seed = `offline-seed ${Date.now()}\n`;
  await client.mutation(api.versions.insert, {
    fileId,
    content: new TextEncoder().encode(seed).buffer,
  });
  pass(`seeded cloud file ${fileName}`);

  const daemonOffline = spawn(
    "node",
    [path.join(import.meta.dirname, "../dist/index.js"), "start"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        KITCHEN_MIRROR_ROOT: mirrorRoot,
        KITCHEN_TEST_OFFLINE: "1",
      },
    },
  );

  const localPath = path.join(dir, fileName);
  const offlineEdit = `offline-edit-${Date.now()}\n`;
  try {
    await waitForFile(localPath);
    pass(`cloud→disk wrote ${localPath}`);
    await new Promise((r) => setTimeout(r, 1000));
    await writeFile(localPath, seed + offlineEdit, "utf8");

    const queued = await waitForQueueEntry();
    pass(`offline edit queued (${queued} entry)`);

    const status = await waitForStatus("queued");
    if (!status.label.includes("Offline")) fail(`unexpected tray label: ${status.label}`);
    pass(`tray status: ${status.label}`);

    const names = await readdir(queueDir);
    const entryFile = names.find((n) => /^\d{10}-.+\.json$/.test(n));
    const entry = JSON.parse(
      await readFile(path.join(queueDir, entryFile), "utf8"),
    );
    if (!entry.hash || !entry.queuedAt || !entry.absolutePath) {
      fail("queue entry missing path/hash/timestamp");
    }
    pass("queue entry has path, hash, timestamp");
  } finally {
    daemonOffline.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
  }

  const daemonOnline = spawn(
    "node",
    [path.join(import.meta.dirname, "../dist/index.js"), "start"],
    {
      stdio: "inherit",
      env: { ...process.env, KITCHEN_MIRROR_ROOT: mirrorRoot },
    },
  );

  try {
    await waitForContent(client, fileId, offlineEdit.trim());
    pass("reconnect flush: offline edit visible in Convex");

    const remaining = (await readdir(queueDir)).filter((n) =>
      /^\d{10}-.+\.json$/.test(n),
    );
    if (remaining.length > 0) fail(`queue not drained (${remaining.length} left)`);
    pass("queue drained after reconnect");

    const synced = await waitForStatus("Synced");
    pass(`tray status after flush: ${synced.label}`);
  } finally {
    daemonOnline.kill("SIGTERM");
  }
}

main().catch((e) => fail(e.message ?? String(e)));