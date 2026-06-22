import fs from "node:fs/promises";
import path from "node:path";
import type { ConvexClient } from "convex/browser";
import { api } from "./convex-api.js";
import type { Id } from "./types.js";
import type { ProjectInfo, TreeNode } from "./paths.js";
import type { EchoSuppressor } from "./echo-suppressor.js";
import type { TrayStatus } from "./tray-status.js";

export async function reconcileTree(
  client: ConvexClient,
  mirrorRoot: string,
  slugIndex: Map<string, ProjectInfo>,
  treeNodes: TreeNode[],
  echo: EchoSuppressor,
  tray: TrayStatus,
): Promise<void> {
  await tray.setSyncing(0); // Reconciling state

  try {
    for (const [slug, project] of slugIndex.entries()) {
      const projectDir = path.join(mirrorRoot, slug);
      await reconcileDir(
        client,
        projectDir,
        project.projectId,
        project.projectId,
        treeNodes,
        echo,
      );
    }
  } catch (err) {
    console.error("Tree reconcile failed:", err);
  }

  await tray.setSynced();
}

async function reconcileDir(
  client: ConvexClient,
  absoluteDir: string,
  projectId: Id<"files">,
  parentId: Id<"files">,
  treeNodes: TreeNode[],
  echo: EchoSuppressor,
): Promise<void> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(absoluteDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    if (entry === "node_modules") continue;

    const entryPath = path.join(absoluteDir, entry);
    const stat = await fs.stat(entryPath).catch(() => null);
    if (!stat) continue;

    const existingNode = treeNodes.find(
      (n) => n.parentId === parentId && n.name === entry,
    );

    if (stat.isDirectory()) {
      let dirId = existingNode?._id;
      if (!dirId) {
        echo.mark(entryPath);
        dirId = await client.mutation(api.files.insert, {
          parentId,
          type: "dir",
          name: entry,
        });
        console.log(`reconcile: created dir ${entryPath} in cloud`);
      }
      await reconcileDir(
        client,
        entryPath,
        projectId,
        dirId,
        treeNodes,
        echo,
      );
    } else {
      // For files, we leave them to disk-to-cloud's watcher or queue flush.
      // We only insert missing directories here.
    }
  }
}
