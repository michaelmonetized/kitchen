#!/usr/bin/env node
/**
 * Mirror client roundtrip smoke (headless, no browser).
 * Uses CLERK_SECRET_KEY like web/scripts/smoke.mjs.
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const authFile = path.join(homedir(), ".kitchen", "mirror-auth.json");

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
  return session.id;
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

async function waitForContent(client, fileId, needle, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = await client.query(api.queries.getFileWithContent, { fileId });
    if (row?.content?.includes(needle)) return row;
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`timeout waiting for cloud content containing ${needle}`);
}

async function main() {
  await ensureAuth();
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

  const fileName = `mirror-smoke-${Date.now()}.txt`;
  const fileId = await client.mutation(api.files.insert, {
    parentId: projectId,
    type: "file",
    name: fileName,
    mime: "text/plain",
  });
  const seed = `mirror-seed ${Date.now()}\n`;
  await client.mutation(api.versions.insert, {
    fileId,
    content: new TextEncoder().encode(seed).buffer,
  });
  pass(`seeded cloud file ${fileName}`);

  const daemon = spawn(
    "node",
    [path.join(import.meta.dirname, "../dist/index.js"), "start"],
    {
      stdio: "inherit",
      env: { ...process.env, KITCHEN_MIRROR_ROOT: mirrorRoot },
    },
  );

  const localPath = path.join(dir, fileName);
  try {
    await waitForFile(localPath);
    pass(`cloud→disk wrote ${localPath}`);
    await new Promise((r) => setTimeout(r, 1000));

    const localEdit = `\nlocal-edit-${Date.now()}\n`;
    await writeFile(localPath, seed + localEdit, "utf8");
    await waitForContent(client, fileId, localEdit.trim());
    pass("disk→cloud local edit visible in Convex");

    const remote = `\nremote-edit-${Date.now()}\n`;
    const current = await client.query(api.queries.getFileWithContent, { fileId });
    const parentVersionId = current?.version?._id;
    await client.mutation(api.versions.insert, {
      fileId,
      content: new TextEncoder().encode(seed + localEdit + remote).buffer,
      ...(parentVersionId ? { parentVersionIds: [parentVersionId] } : {}),
    });

    const start = Date.now();
    while (Date.now() - start < 30_000) {
      const onDisk = await readFile(localPath, "utf8");
      if (onDisk.includes(remote.trim())) {
        pass("cloud→disk remote edit visible on disk");
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    fail("timeout waiting for remote edit on disk");
  } finally {
    daemon.kill("SIGTERM");
  }
}

main().catch((e) => fail(e.message ?? String(e)));