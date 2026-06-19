import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { InsertQueue, QueueEntry } from "./insert-queue.js";
import { notifyFork } from "./notify.js";
import type { TrayStatus } from "./tray-status.js";
import type { Id } from "./types.js";

export type QueueFlushOptions = {
  client: ConvexClient;
  queue: InsertQueue;
  tray: TrayStatus;
  onVersionInserted?: (fileId: Id<"files">, versionId: Id<"versions">) => void;
  onCloudHash?: (fileId: Id<"files">, hash: string) => void;
  getIsOnline: () => boolean;
};

export async function flushInsertQueue(
  options: QueueFlushOptions,
): Promise<{ flushed: number; remaining: number }> {
  const { client, queue, tray, onVersionInserted, onCloudHash, getIsOnline } =
    options;

  const entries = await queue.list();
  if (entries.length === 0) {
    await tray.setSynced();
    return { flushed: 0, remaining: 0 };
  }

  await tray.setSyncing(entries.length);
  let flushed = 0;

  for (const entry of entries) {
    if (!getIsOnline()) break;

    try {
      const bytes = Buffer.from(entry.contentBase64, "base64");
      const content = Uint8Array.from(bytes).buffer;
      const result = await client.mutation(api.versions.insert, {
        fileId: entry.fileId,
        content,
        ...(entry.parentVersionId
          ? { parentVersionIds: [entry.parentVersionId] }
          : {}),
      });

      await queue.remove(entry);
      flushed += 1;
      onCloudHash?.(entry.fileId, entry.hash);

      if (result?.forked) {
        void notifyFork({
          fileId: entry.fileId,
          projectId: entry.projectId,
          fileName: entry.fileName,
        });
        console.warn(
          `queue flush fork ${entry.absolutePath} — Fork policy A (author bytes on disk); merge in web`,
        );
      } else {
        const file = await client.query(api.queries.getFile, {
          fileId: entry.fileId,
        });
        if (file?.currentVersionId) {
          onVersionInserted?.(entry.fileId, file.currentVersionId);
        }
        console.log(`queue flush ${entry.absolutePath}`);
      }
    } catch (err) {
      console.error(`queue flush failed ${entry.absolutePath}:`, err);
      break;
    }
  }

  const remaining = await queue.count();
  if (remaining === 0 && getIsOnline()) {
    await tray.setSynced();
  } else {
    await tray.setOffline(remaining);
  }

  return { flushed, remaining };
}

export function isOfflineError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("websocket") ||
    msg.includes("disconnected") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("timeout")
  );
}

export type EnqueuePayload = Omit<QueueEntry, "id" | "seq" | "queuedAt">;