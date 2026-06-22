import { loadAuth } from "@kitchen/mirror-client/auth";
import { AUTH_FAIL_MESSAGE } from "./auth-cmd.js";
import { api, createClient } from "./convex-client.js";
import { loadKitchenEnv } from "./env.js";
import { resolveProjectContext } from "./project-context.js";

function failAuthRequired(): never {
  console.error(AUTH_FAIL_MESSAGE);
  process.exit(1);
}

async function queryOrFail<T>(
  fn: () => Promise<T>,
  auth: Awaited<ReturnType<typeof loadAuth>>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!auth) failAuthRequired();
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Kitchen query failed";
    throw new Error(message);
  }
}

export type ChangesOptions = {
  path: string;
  since?: string;
  limit?: number;
};

function parseSinceMs(instant: string): number {
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) {
    throw new Error(
      `Invalid --since instant "${instant}" — use Temporal-compatible ISO 8601 (e.g. 2026-06-01T00:00:00Z)`,
    );
  }
  return ms;
}

function parseArgs(argv: string[]): ChangesOptions {
  const positional: string[] = [];
  let since: string | undefined;
  let limit: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--since") {
      since = argv[++i];
      if (!since) throw new Error("--since requires an ISO 8601 instant");
      continue;
    }
    if (arg.startsWith("--since=")) {
      since = arg.slice("--since=".length);
      continue;
    }
    if (arg === "--limit") {
      const raw = argv[++i];
      if (!raw) throw new Error("--limit requires a number");
      limit = Number(raw);
      if (!Number.isFinite(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer");
      }
      continue;
    }
    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
      if (!Number.isFinite(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer");
      }
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length !== 1) {
    throw new Error("Usage: kitchen changes <path> [--since <instant>] [--limit N]");
  }

  return { path: positional[0]!, since, limit };
}

export async function runChangesCommand(argv: string[]): Promise<void> {
  await loadKitchenEnv();
  const options = parseArgs(argv);
  const ctx = await resolveProjectContext(options.path);

  const auth = await loadAuth();
  let client = await createClient(ctx.convexUrl, auth);

  let projectId: string | undefined = ctx.projectId;
  if (!projectId && auth) {
    const resolvedId = await queryOrFail(
      () =>
        client.query(api.cli.projectIdForSlug, {
          slug: ctx.projectSlug,
        }) as Promise<string | null>,
      auth,
    );
    projectId = resolvedId ?? undefined;
  }

  if (!projectId) {
    if (!auth) failAuthRequired();
    throw new Error(`Project not found for slug "${ctx.projectSlug}"`);
  }

  let resolved = await queryOrFail(
    () =>
      client.query(api.cli.resolveFileByPath, {
        projectId,
        relativePath: ctx.relativePath,
      }) as Promise<{ fileId: string; isPublic: boolean } | null>,
    auth,
  );

  if (!resolved && !auth) failAuthRequired();

  if (!resolved && auth) {
    client = await createClient(ctx.convexUrl, auth);
    resolved = await queryOrFail(
      () =>
        client.query(api.cli.resolveFileByPath, {
          projectId,
          relativePath: ctx.relativePath,
        }) as Promise<{ fileId: string; isPublic: boolean } | null>,
      auth,
    );
  }

  if (!resolved) {
    console.error(`File not found: ${ctx.relativePath}`);
    process.exit(1);
  }

  const sinceMs = options.since ? parseSinceMs(options.since) : undefined;
  const result = await queryOrFail(
    () =>
      client.query(api.cli.listChanges, {
        fileId: resolved.fileId,
        since: sinceMs,
        limit: options.limit,
      }) as Promise<{
    error: "NOT_FOUND" | "FORBIDDEN" | null;
    changes: Array<{
      id: string;
      creationTime: number;
      authorUserId: string;
      parentVersionIds: string[];
      }>;
      }>,
    auth,
  );

  if (result.error === "FORBIDDEN") {
    if (!auth) failAuthRequired();
    console.error("FORBIDDEN");
    process.exit(1);
  }

  if (result.error === "NOT_FOUND") {
    console.error(`File not found: ${ctx.relativePath}`);
    process.exit(1);
  }

  console.log(JSON.stringify(result.changes, null, 2));
}