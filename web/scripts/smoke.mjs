#!/usr/bin/env node
/**
 * Kitchen production smoke test (fetch + Convex HTTP client).
 *
 * Usage:
 *   SMOKE_BASE_URL=https://kitchen.vercel.app node scripts/smoke.mjs
 *
 * Requires CLERK_SECRET_KEY and NEXT_PUBLIC_CONVEX_URL for the authenticated flow.
 */
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const smokeEmail =
  process.env.SMOKE_TEST_EMAIL ?? "kitchen-smoke@hustlestack.dev";
const smokePassword =
  process.env.SMOKE_TEST_PASSWORD ?? "KitchenSmokeTest1!";

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

async function fetchCheck(path, { contains, status = 200 } = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  if (res.status !== status) {
    fail(`${path} returned ${res.status}, expected ${status}`);
  }
  const text = await res.text();
  if (contains && !text.includes(contains)) {
    fail(`${path} missing expected content: ${contains}`);
  }
  pass(`${path} (${status})`);
  return text;
}

async function getClerkConvexToken() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    fail("CLERK_SECRET_KEY required for authenticated smoke flow");
  }

  const clerk = createClerkClient({ secretKey });
  const listed = await clerk.users.getUserList({
    emailAddress: [smokeEmail],
    limit: 1,
  });

  let userId;
  if (listed.data.length > 0) {
    userId = listed.data[0].id;
  } else {
    const created = await clerk.users.createUser({
      emailAddress: [smokeEmail],
      password: smokePassword,
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
    userId = created.id;
    pass(`created smoke user ${smokeEmail}`);
  }

  const sessions = await clerk.sessions.getSessionList({
    userId,
    status: "active",
    limit: 1,
  });

  const session =
    sessions.data[0] ??
    (await clerk.sessions.createSession({ userId }));

  const token = await clerk.sessions.getToken(session.id, "convex");
  if (!token?.jwt) {
    fail("failed to obtain Convex JWT from Clerk session");
  }

  pass("Clerk session → Convex JWT");
  return token.jwt;
}

async function runConvexFlow() {
  const convexUrl = process.env.SMOKE_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    fail(
      "NEXT_PUBLIC_CONVEX_URL or SMOKE_CONVEX_URL required for authenticated smoke flow",
    );
  }
  if (baseUrl.startsWith("http") && !baseUrl.includes("localhost")) {
    const devMarker = "canny-perch-896";
    if (convexUrl.includes(devMarker)) {
      fail(
        `remote smoke must not use dev Convex (${devMarker}); set SMOKE_CONVEX_URL to production`,
      );
    }
  }

  const jwt = await getClerkConvexToken();
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(jwt);

  await client.mutation(api.users.ensureCurrent, {});
  pass("users.ensureCurrent (sign-in provisioning)");

  const personal = await client.mutation(api.admin.ensurePersonalOrg, {});
  let projectId = personal?.projectId;

  if (!projectId) {
    const projects = await client.query(api.queries.projectsForUser, {});
    if (!projects?.length) {
      fail("no project available after ensurePersonalOrg");
    }
    projectId = projects[0].project._id;
    pass("reused existing project");
  } else {
    pass("ensurePersonalOrg created sample project");
  }

  const fileId = await client.mutation(api.files.insert, {
    parentId: projectId,
    type: "file",
    name: `smoke-${Date.now()}.txt`,
    mime: "text/plain",
  });
  pass(`files.insert (${fileId})`);

  const content = new TextEncoder().encode(
    `kitchen smoke ${new Date().toISOString()}\n`,
  );
  const versionId = await client.mutation(api.versions.insert, {
    fileId,
    content: content.buffer,
  });
  pass(`versions.insert (${versionId})`);
}

console.log(`Smoke test → ${baseUrl}\n`);

await fetchCheck("/api/health");
const health = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
if (!health?.ok) fail("/api/health body missing ok:true");

await fetchCheck("/", { contains: "Kitchen" });
await fetchCheck("/sign-in", { contains: "sign" });

await runConvexFlow();

console.log("\nAll smoke checks passed.");