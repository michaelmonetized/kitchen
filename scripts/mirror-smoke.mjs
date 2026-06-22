#!/usr/bin/env node
/**
 * Launch gate mirror smoke — bidirectional sync proof (headless).
 *
 * Usage:
 *   node scripts/mirror-smoke.mjs
 *
 * Env:
 *   CONVEX_URL or NEXT_PUBLIC_CONVEX_URL — Convex deployment
 *   MIRROR_ROOT or KITCHEN_MIRROR_ROOT — mirror root (default: $TMP/kitchen-mirror-smoke)
 *   PROJECT_ID — optional; uses personal org project if unset
 *   CLERK_SECRET_KEY — required (same as web/scripts/smoke.mjs)
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const api = anyApi;
const smokeEmail =
  process.env.SMOKE_TEST_EMAIL ?? "kitchen-smoke@hustlestack.dev";
const smokeEmailB =
  process.env.SMOKE_TEST_EMAIL_B ?? "kitchen-smoke-b@hustlestack.dev";
const convexUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
const mirrorRoot =
  process.env.MIRROR_ROOT ??
  process.env.KITCHEN_MIRROR_ROOT ??
  path.join(tmpdir(), "kitchen-mirror-smoke");
const authFile = path.join(homedir(), ".kitchen", "auth.json");
const timeoutMs = Number(process.env.MIRROR_SMOKE_TIMEOUT_MS ?? 45_000);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function projectDir(orgName, projectName) {
  return path.join(
    mirrorRoot,
    `${slugify(orgName)}-${slugify(projectName)}`,
  );
}

async function waitFor(
  label,
  predicate,
  timeout = timeoutMs,
  interval = 500,
) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  fail(`timeout: ${label}`);
}

async function ensureAuth() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) fail("CLERK_SECRET_KEY required");
  if (!convexUrl) fail("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL required");

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
    `${JSON.stringify(
      { sessionId: session.id, userId, email: smokeEmail, savedAt: Date.now() },
      null,
      2,
    )}\n`,
  );
  pass("mirror auth session saved");
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

async function convexClientForEmail(email) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) fail("CLERK_SECRET_KEY required");
  const clerk = createClerkClient({ secretKey });
  const listed = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  const clerkUserId =
    listed.data[0]?.id ??
    (
      await clerk.users.createUser({
        emailAddress: [email],
        password: "KitchenSmokeTest1!",
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      })
    ).id;

  const sessions = await clerk.sessions.getSessionList({
    userId: clerkUserId,
    status: "active",
    limit: 1,
  });
  const session =
    sessions.data[0] ?? (await clerk.sessions.createSession({ userId: clerkUserId }));

  const token = await clerk.sessions.getToken(session.id, "convex");
  if (!token?.jwt) fail(`Convex JWT for ${email}`);
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token.jwt);
  const convexUserId = await client.mutation(api.users.ensureCurrent, {});
  if (!convexUserId) fail(`ensureCurrent failed for ${email}`);
  return { client, convexUserId };
}

async function versionCount(client, fileId) {
  const versions = await client.query(api.queries.listVersions, {
    fileId,
    limit: 100,
  });
  return versions?.length ?? 0;
}

async function main() {
  console.log(`Mirror smoke → ${convexUrl}`);
  console.log(`Mirror root → ${mirrorRoot}\n`);

  await mkdir(mirrorRoot, { recursive: true });
  await ensureAuth();
  const client = await convexClient();
  await client.mutation(api.users.ensureCurrent, {});

  const personal = await client.mutation(api.admin.ensurePersonalOrg, {});
  let projectId = process.env.PROJECT_ID ?? personal?.projectId;
  if (!projectId) {
    const projects = await client.query(api.queries.projectsForUser, {});
    projectId = projects[0]?.project._id;
  }
  if (!projectId) fail("no project — sign in and create one first");

  const projects = await client.query(api.queries.projectsForUser, {});
  const row = projects.find((p) => p.project._id === projectId);
  if (!row) fail(`project ${projectId} not found for smoke user`);

  const dir = projectDir(row.org.name, row.project.name);
  pass(`Convex reachable; project ${row.project.name}`);

  const daemon = spawn(
    "node",
    [
      path.join(
        import.meta.dirname,
        "../packages/mirror-client/dist/index.js",
      ),
      "start",
    ],
    {
      stdio: "inherit",
      env: { ...process.env, KITCHEN_MIRROR_ROOT: mirrorRoot },
    },
  );

  try {
    await waitFor("project tree on disk", async () => {
      try {
        const s = await stat(dir);
        return s.isDirectory();
      } catch {
        return false;
      }
    });
    pass(`project tree exists at ${dir}`);

    const stamp = Date.now();
    const fileName = `mirror-smoke-${stamp}.txt`;
    const fileId = await client.mutation(api.files.insert, {
      parentId: projectId,
      type: "file",
      name: fileName,
      mime: "text/plain",
    });
    const seed = `mirror-seed ${stamp}\n`;
    await client.mutation(api.versions.insert, {
      fileId,
      content: new TextEncoder().encode(seed).buffer,
    });
    pass(`seeded cloud file ${fileName}`);

    const localPath = path.join(dir, fileName);
    await waitFor("cloud→disk initial write", async () => {
      try {
        const content = await readFile(localPath, "utf8");
        return content.includes("mirror-seed");
      } catch {
        return false;
      }
    });
    pass("cloud→disk wrote file bytes");

    // Let echo suppression expire and watcher path map settle
    await new Promise((r) => setTimeout(r, 1500));

    const localEdit = `local-edit-${stamp}\n`;
    await writeFile(localPath, seed + localEdit, "utf8");
    await waitFor("disk→cloud local edit", async () => {
      const row = await client.query(api.queries.getFileWithContent, { fileId });
      return row?.content?.includes(localEdit.trim()) ?? false;
    });
    pass("disk→cloud local edit visible in Convex");

    const remote = `remote-edit-${stamp}\n`;
    const current = await client.query(api.queries.getFileWithContent, { fileId });
    const parentVersionId = current?.version?._id;
    await client.mutation(api.versions.insert, {
      fileId,
      content: new TextEncoder().encode(seed + localEdit + remote).buffer,
      ...(parentVersionId ? { parentVersionIds: [parentVersionId] } : {}),
    });

    await waitFor("cloud→disk remote patch", async () => {
      try {
        const onDisk = await readFile(localPath, "utf8");
        return onDisk.includes(remote.trim());
      } catch {
        return false;
      }
    });
    pass("cloud→disk remote edit visible on disk");

    const movedName = `moved-${stamp}.txt`;
    const movedPath = path.join(dir, movedName);
    await rename(localPath, movedPath);
    await waitFor("local mv → Convex metadata", async () => {
      const file = await client.query(api.queries.getFile, { fileId });
      return file?.name === movedName;
    });
    pass("local mv updated Convex parentId/name");

    const subdirName = `smoke-dir-${stamp}`;
    const subdirId = await client.mutation(api.files.insert, {
      parentId: projectId,
      type: "dir",
      name: subdirName,
    });
    const webMovedName = `web-moved-${stamp}.txt`;
    await client.mutation(api.files.updateMetadata, {
      fileId,
      name: webMovedName,
      parentId: subdirId,
    });

    const webMovedPath = path.join(dir, subdirName, webMovedName);
    await waitFor("web move → disk rename", async () => {
      try {
        await stat(webMovedPath);
        return true;
      } catch {
        return false;
      }
    });
    pass(`web move renamed disk file to ${webMovedPath}`);

    const stormFile = `echo-storm-${stamp}.txt`;
    const stormId = await client.mutation(api.files.insert, {
      parentId: projectId,
      type: "file",
      name: stormFile,
      mime: "text/plain",
    });
    const stormSeed = `storm-base ${stamp}\n`;
    await client.mutation(api.versions.insert, {
      fileId: stormId,
      content: new TextEncoder().encode(stormSeed).buffer,
    });

    const stormPath = path.join(dir, stormFile);
    await waitFor("echo storm file materialized", async () => {
      try {
        await readFile(stormPath, "utf8");
        return true;
      } catch {
        return false;
      }
    });

    const beforeStorm = await versionCount(client, stormId);
    for (let i = 0; i < 10; i++) {
      await writeFile(stormPath, `${stormSeed}line-${i}-${Date.now()}\n`, "utf8");
    }

    await waitFor("echo storm debounce settle", async () => {
      await new Promise((r) => setTimeout(r, 1500));
      return true;
    });

    const afterStorm = await versionCount(client, stormId);
    const newVersions = afterStorm - beforeStorm;
    if (newVersions > 10) {
      fail(
        `echo storm: ${newVersions} new versions (expected ≤10 debounced inserts)`,
      );
    }
    if (afterStorm > 11) {
      fail(`echo storm: total version count ${afterStorm} > 11`);
    }
    pass(
      `echo storm debounce ok (${newVersions} new versions, total ${afterStorm} ≤ 11)`,
    );

    const deleteFile = `soft-delete-${stamp}.txt`;
    const deleteId = await client.mutation(api.files.insert, {
      parentId: projectId,
      type: "file",
      name: deleteFile,
      mime: "text/plain",
    });
    const deleteSeed = `delete-seed ${stamp}\n`;
    await client.mutation(api.versions.insert, {
      fileId: deleteId,
      content: new TextEncoder().encode(deleteSeed).buffer,
    });

    const deletePath = path.join(dir, deleteFile);
    await waitFor("soft delete file materialized", async () => {
      try {
        await readFile(deletePath, "utf8");
        return true;
      } catch {
        return false;
      }
    });

    const versionIdsBeforeDelete = (
      await client.query(api.queries.listVersions, { fileId: deleteId, limit: 10 })
    ).map((v) => v._id);

    await unlink(deletePath);
    await waitFor("local rm → tombstone property", async () => {
      const file = await client.query(api.queries.getFile, { fileId: deleteId });
      return file?.properties?.deleted === "true";
    });
    pass("local rm set properties.deleted = true");

    const tree = await client.query(api.queries.listProjectTree, { projectId });
    if (tree.some((n) => n._id === deleteId)) {
      fail("tombstoned file still in listProjectTree");
    }
    pass("tombstoned file absent from listProjectTree");

    const versionsAfterDelete = await client.query(api.queries.listVersions, {
      fileId: deleteId,
      limit: 10,
    });
    if (!versionIdsBeforeDelete.every((id) => versionsAfterDelete.some((v) => v._id === id))) {
      fail("version history missing after tombstone");
    }
    pass("version history still queryable by fileId");

    const mkdirName = `local-mkdir-${stamp}`;
    const mkdirPath = path.join(dir, mkdirName);
    await mkdir(mkdirPath);
    await waitFor("local mkdir → Convex dir row", async () => {
      const tree = await client.query(api.queries.listProjectTree, { projectId });
      return tree.some(
        (n) => n.name === mkdirName && n.type === "dir" && n.parentId === projectId,
      );
    });
    pass("local mkdir created Convex dir row");

    const { client: userBClient, convexUserId: userBConvexId } =
      await convexClientForEmail(smokeEmailB);

    const orgContext = await client.query(api.admin.getOrgContext, {
      orgId: row.org._id,
    });
    const editorRole = orgContext?.roles?.find((r) => r.name === "editor");
    if (!editorRole) fail("editor role missing for fork smoke");
    try {
      await client.mutation(api.roles.assignUser, {
        userId: userBConvexId,
        roleId: editorRole._id,
        projectFileId: projectId,
      });
    } catch (err) {
      if (!String(err).includes("ALREADY")) throw err;
    }

    const forkFile = `fork-policy-${stamp}.txt`;
    const forkId = await client.mutation(api.files.insert, {
      parentId: projectId,
      type: "file",
      name: forkFile,
      mime: "text/plain",
    });
    const forkSeed = `fork-base-${stamp}\n`;
    await client.mutation(api.versions.insert, {
      fileId: forkId,
      content: new TextEncoder().encode(forkSeed).buffer,
    });
    const seedVersionRow = await client.query(api.queries.listVersions, {
      fileId: forkId,
      limit: 1,
    });
    const seedVersionId = seedVersionRow[0]?._id;
    if (!seedVersionId) fail("fork seed version missing");

    const forkPath = path.join(dir, forkFile);
    await waitFor("fork test file materialized", async () => {
      try {
        await readFile(forkPath, "utf8");
        return true;
      } catch {
        return false;
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    const userAEdit = `user-a-${stamp}\n`;
    await writeFile(forkPath, forkSeed + userAEdit, "utf8");
    await waitFor("fork user A disk edit in Convex", async () => {
      const row = await client.query(api.queries.getFileWithContent, { fileId: forkId });
      return row?.content?.includes(userAEdit.trim()) ?? false;
    });

    const userBEdit = `user-b-remote-${stamp}\n`;
    await userBClient.mutation(api.versions.insert, {
      fileId: forkId,
      content: new TextEncoder().encode(forkSeed + userBEdit).buffer,
      parentVersionIds: [seedVersionId],
    });

    await waitFor("fork state in Convex", async () => {
      const file = await client.query(api.queries.getFile, { fileId: forkId });
      return file?.forked === true;
    });
    pass("two-user save created fork in Convex");

    await new Promise((r) => setTimeout(r, 2000));
    const onDiskAfterFork = await readFile(forkPath, "utf8");
    if (!onDiskAfterFork.includes(userAEdit.trim())) {
      fail("fork policy: user A bytes missing from disk");
    }
    if (onDiskAfterFork.includes(userBEdit.trim())) {
      fail("fork policy: remote user B bytes overwrote local disk (policy A violated)");
    }
    pass("fork policy A: each machine keeps own bytes until merge");

    console.log("\nAll mirror smoke checks passed.");
  } finally {
    daemon.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
  }
}

main().catch((e) => fail(e.message ?? String(e)));