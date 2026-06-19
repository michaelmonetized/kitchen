import path from "node:path";
import { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import { loadAuth, refreshConvexJwt, runLoginFlow } from "./auth.js";
import { ensureAgentDiscoveryKit } from "./agent-discovery.js";
import { CloudToDiskEngine } from "./cloud-to-disk.js";
import { resolveConvexUrl, resolveMirrorRoot } from "./config.js";
import { DiskToCloudEngine } from "./disk-to-cloud.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import { normalizeAbsolutePath } from "./normalize-path.js";

const JWT_REFRESH_MS = 50 * 60 * 1000;

export async function runMirror(): Promise<void> {
  const loaded = await loadAuth();
  if (!loaded) {
    throw new Error(
      "No saved session — run `npm run login -w @kitchen/mirror-client` first",
    );
  }
  const auth = loaded;

  const convexUrl = resolveConvexUrl();
  const mirrorRoot = resolveMirrorRoot();
  const client = new ConvexClient(convexUrl);
  const echo = new EchoSuppressor(500);
  const pathToFileId = new Map<string, Id<"files">>();
  const fileCurrentVersion = new Map<Id<"files">, Id<"versions">>();

  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  client.setAuth(async () => refreshConvexJwt(auth));

  await client.mutation(api.users.ensureCurrent, {});

  let cloud!: CloudToDiskEngine;
  const remapPath = (oldPath: string, newPath: string, fileId: Id<"files">) => {
    pathToFileId.delete(normalizeAbsolutePath(oldPath));
    pathToFileId.set(normalizeAbsolutePath(newPath), fileId);
  };

  const disk = new DiskToCloudEngine({
    client,
    mirrorRoot,
    echo,
    getSlugIndex: () => cloud.slugIndex,
    getPathToFileId: () => pathToFileId,
    getTreeNodes: () => cloud.treeNodes,
    onPathRemapped: remapPath,
    getCurrentVersionId: (fileId) => fileCurrentVersion.get(fileId),
    onVersionInserted: (fileId, versionId) => {
      fileCurrentVersion.set(fileId, versionId);
    },
  });

  cloud = new CloudToDiskEngine({
    client,
    mirrorRoot,
    echo,
    onPathMapped: (absolutePath, fileId) => {
      pathToFileId.set(normalizeAbsolutePath(absolutePath), fileId);
    },
    onPathRemapped: remapPath,
    onVersionSynced: (fileId, versionId) => {
      fileCurrentVersion.set(fileId, versionId);
    },
    onContentHash: (fileId, hash) => {
      disk.noteCloudHash(fileId, hash);
    },
    onProjectDir: (absoluteDir) => {
      void ensureAgentDiscoveryKit(absoluteDir, convexUrl);
      void disk.watchDirectory(absoluteDir);
    },
  });

  cloud.start();
  await disk.start();

  refreshTimer = setInterval(() => {
    void refreshConvexJwt(auth).catch((err) =>
      console.error("JWT refresh failed:", err),
    );
  }, JWT_REFRESH_MS);

  console.log(`Kitchen mirror running — root ${mirrorRoot}`);
  console.log("Press Ctrl+C to stop");

  const shutdown = async () => {
    if (refreshTimer) clearInterval(refreshTimer);
    cloud.stop();
    await disk.stop();
    client.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await new Promise(() => {});
}

export async function runLogin(): Promise<void> {
  await runLoginFlow();
}