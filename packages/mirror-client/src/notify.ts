import { exec } from "node:child_process";
import { promisify } from "node:util";
import { resolveSiteUrl } from "./config.js";
import type { Id } from "./types.js";

const execAsync = promisify(exec);

const notifiedForks = new Set<string>();

export function mergeDeepLink(
  projectId: Id<"files">,
  fileId: Id<"files">,
): string {
  const base = resolveSiteUrl().replace(/\/$/, "");
  return `${base}/app/projects/${projectId}/files/${fileId}/merge`;
}

export async function notifyFork(options: {
  fileId: Id<"files">;
  projectId: Id<"files">;
  fileName: string;
}): Promise<void> {
  const key = options.fileId;
  if (notifiedForks.has(key)) return;
  notifiedForks.add(key);

  const url = mergeDeepLink(options.projectId, options.fileId);
  const title = "Kitchen — forked file";
  const body = `${options.fileName} needs merge. Open merge UI to pick lines.`;

  if (process.platform === "darwin") {
    const script = `display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)} subtitle ${JSON.stringify(url)}`;
    try {
      await execAsync(`osascript -e ${JSON.stringify(script)}`);
      return;
    } catch {
      // fall through to console
    }
  }

  console.warn(`${title}: ${body}`);
  console.warn(`Merge: ${url}`);
}