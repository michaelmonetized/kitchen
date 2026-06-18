#!/usr/bin/env node
/**
 * Deploy Kitchen web to Convex production + Vercel production.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = dirname(fileURLToPath(import.meta.url)) + "/..";
const rootDir = join(webDir, "..");

function run(cmd, opts = {}) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { cwd: webDir, stdio: "inherit", ...opts });
}

function runVercel(cmd, opts = {}) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { cwd: rootDir, stdio: "inherit", ...opts });
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

function getConvexProdUrls() {
  const output = execSync("npx convex deploy --dry-run --yes 2>&1", {
    cwd: webDir,
    encoding: "utf8",
    shell: true,
  });
  const cloudMatch = output.match(/https:\/\/[a-z0-9-]+\.convex\.cloud/);
  const cloudUrl = cloudMatch?.[0];
  if (!cloudUrl) return {};
  const siteUrl = cloudUrl.replace(".convex.cloud", ".convex.site");
  const slug = cloudUrl.match(/https:\/\/([a-z0-9-]+)\.convex\.cloud/)?.[1];
  return {
    NEXT_PUBLIC_CONVEX_URL: cloudUrl,
    NEXT_PUBLIC_CONVEX_SITE_URL: siteUrl,
    ...(slug ? { CONVEX_DEPLOYMENT: `prod:${slug}` } : {}),
  };
}

function syncVercelProductionEnv(convexProd = {}, siteUrl) {
  const env = {
    ...parseEnvFile(join(webDir, ".env.local")),
    ...convexProd,
    ...(siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {}),
  };
  const keys = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "CLERK_JWT_ISSUER_DOMAIN",
    "NEXT_PUBLIC_CONVEX_URL",
    "NEXT_PUBLIC_CONVEX_SITE_URL",
    "CONVEX_DEPLOYMENT",
    "NEXT_PUBLIC_SITE_URL",
  ];

  for (const key of keys) {
    const value = env[key] ?? process.env[key];
    if (!value) {
      console.warn(`  skip ${key} (not set)`);
      continue;
    }
    try {
      execSync(`vercel env rm ${key} production --yes`, {
        cwd: rootDir,
        stdio: "pipe",
      });
    } catch {
      // not present yet
    }
    execSync(`printf '%s' ${JSON.stringify(value)} | vercel env add ${key} production`, {
      cwd: rootDir,
      stdio: "inherit",
      shell: true,
    });
    console.log(`  synced ${key} → production`);
  }
}

console.log("Kitchen ship: Convex production + Vercel production\n");

const localEnv = parseEnvFile(join(webDir, ".env.local"));
const clerkIssuer = localEnv.CLERK_JWT_ISSUER_DOMAIN;
if (clerkIssuer && !clerkIssuer.includes("placeholder")) {
  run(
    `npx convex env set CLERK_JWT_ISSUER_DOMAIN ${JSON.stringify(clerkIssuer)} --prod`,
  );
} else {
  console.warn(
    "CLERK_JWT_ISSUER_DOMAIN missing or placeholder — set from Clerk Frontend API URL before ship",
  );
}

const convexProd = getConvexProdUrls();
if (!convexProd.NEXT_PUBLIC_CONVEX_URL) {
  console.error("Could not resolve production Convex URL from convex deploy --dry-run");
  process.exit(1);
}
console.log(`  production Convex → ${convexProd.NEXT_PUBLIC_CONVEX_URL}`);

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kitchen-gilt-nine.vercel.app";
syncVercelProductionEnv(convexProd, siteUrl);

run("npx convex deploy --yes");

runVercel("vercel deploy --prod --yes");

const deploymentUrl = execSync("vercel ls --prod 2>/dev/null | head -1 || true", {
  cwd: rootDir,
  encoding: "utf8",
  shell: true,
}).trim();

const prodAlias = execSync(
  "vercel inspect --prod 2>/dev/null | grep -m1 'https://' || true",
  { cwd: rootDir, encoding: "utf8", shell: true },
).trim();

const baseUrl =
  process.env.SMOKE_BASE_URL ??
  (prodAlias.startsWith("http")
    ? prodAlias
    : deploymentUrl.startsWith("http")
      ? deploymentUrl
      : "https://kitchen.vercel.app");

console.log(`\n→ smoke test ${baseUrl}`);
execSync(`SMOKE_BASE_URL=${JSON.stringify(baseUrl)} node scripts/smoke.mjs`, {
  cwd: webDir,
  stdio: "inherit",
  env: {
    ...process.env,
    ...parseEnvFile(join(webDir, ".env.local")),
    ...convexProd,
  },
});

console.log(`\n✓ Shipped to ${baseUrl}`);