import { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import { loadAuth, refreshConvexJwt, runLoginFlow } from "./auth.js";
import { ensureAgentDiscoveryKit } from "./agent-discovery.js";
import { CloudToDiskEngine } from "./cloud-to-disk.js";
import { resolveConvexUrl, resolveMirrorRoot } from "./config.js";
import { DiskToCloudEngine } from "./disk-to-cloud.js";
import { EchoSuppressor } from "./echo-suppressor.js";
import { InsertQueue } from "./insert-queue.js";
import { normalizeAbsolutePath } from "./normalize-path.js";
import { flushInsertQueue } from "./queue-flush.js";
import { TrayStatus } from "./tray-status.js";
import { reconcileTree } from "./tree-reconcile.js";

const JWT_REFRESH_MS = 50 * 60 * 1000;

export async function runMirror(): Promise<void> {
  const loaded = await loadAuth();
  if (!loaded) {
    throw new Error(
      "No saved session — run `npx kitchen auth` or `kitchen-mirror login` first",
    );
  }
  const auth = loaded;

  const convexUrl = resolveConvexUrl();
  const mirrorRoot = resolveMirrorRoot();
  const client = new ConvexClient(convexUrl);
  const echo = new EchoSuppressor(500);
  const pathToFileId = new Map<string, Id<"files">>();
  const fileCurrentVersion = new Map<Id<"files">, Id<"versions">>();
  const queue = await InsertQueue.open();
  const tray = new TrayStatus();
  const forceOffline = process.env.KITCHEN_TEST_OFFLINE === "1";

  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  let connectionUnsub: (() => void) | null = null;
  let flushing = false;
  let online = false;

  const getIsOnline = (): boolean => {
    if (forceOffline) return false;
    return online;
  };

  const refreshTray = async (): Promise<void> => {
    const queued = await queue.count();
    if (flushing) {
      await tray.setSyncing(queued);
    } else if (!getIsOnline()) {
      await tray.setOffline(queued);
    } else if (queued === 0) {
      await tray.setSynced();
    } else {
      await tray.setOffline(queued);
    }
  };

  const runFlush = async (): Promise<void> => {
    if (flushing || !getIsOnline()) return;
    flushing = true;
    try {
      await flushInsertQueue({
        client,
        queue,
        tray,
        getIsOnline,
        onVersionInserted: (fileId, versionId) => {
          fileCurrentVersion.set(fileId, versionId);
        },
        onCloudHash: (fileId, hash) => {
          disk.noteCloudHash(fileId, hash);
        },
      });
      await reconcileTree(client, mirrorRoot, cloud.slugIndex, cloud.treeNodes, echo, tray);
    } finally {
      flushing = false;
      await refreshTray();
    }
  };

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
    queue,
    getIsOnline,
    onQueued: () => {
      void refreshTray();
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
    onProjectDir: (absoluteDir, projectId) => {
      void ensureAgentDiscoveryKit(absoluteDir, convexUrl, projectId);
      void disk.watchDirectory(absoluteDir);
    },
  });

  connectionUnsub = client.subscribeToConnectionState((state) => {
    const wasOnline = online;
    online = state.isWebSocketConnected;
    if (!wasOnline && online) {
      void runFlush();
      return;
    }
    void refreshTray();
  });

  cloud.start();
  await disk.start();

  online = forceOffline ? false : client.connectionState().isWebSocketConnected;
  if (getIsOnline() && (await queue.count()) > 0) {
    await runFlush();
  } else {
    await refreshTray();
  }

  refreshTimer = setInterval(() => {
    void refreshConvexJwt(auth).catch((err) =>
      console.error("JWT refresh failed:", err),
    );
  }, JWT_REFRESH_MS);

  console.log(`Kitchen mirror running — root ${mirrorRoot}`);
  console.log("Press Ctrl+C to stop");

  const shutdown = async () => {
    if (refreshTimer) clearInterval(refreshTimer);
    connectionUnsub?.();
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