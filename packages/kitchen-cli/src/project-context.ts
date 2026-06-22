import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { resolveMirrorRoot } from "@kitchen/mirror-client/config";
import { normalizeAbsolutePath } from "@kitchen/mirror-client/normalize-path";

export type ProjectContext = {
  convexUrl: string;
  projectId?: string;
  projectSlug: string;
  relativePath: string;
};

type ConvexJson = {
  deploymentUrl?: string;
  projectId?: string;
};

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readConvexJson(kitchenDir: string): Promise<ConvexJson | null> {
  const convexPath = path.join(kitchenDir, "convex.json");
  if (!(await pathExists(convexPath))) return null;
  try {
    return JSON.parse(await readFile(convexPath, "utf8")) as ConvexJson;
  } catch {
    return null;
  }
}

/** Locate Kitchen project from cwd + user-supplied relative path. */
export async function resolveProjectContext(
  fileArg: string,
  cwd = process.cwd(),
): Promise<ProjectContext> {
  const normalizedArg = fileArg.replace(/\\/g, "/");
  const isAbsolute = path.isAbsolute(fileArg);

  if (isAbsolute) {
    const mirrorRoot = resolveMirrorRoot();
    const normalizedRoot = normalizeAbsolutePath(mirrorRoot);
    const normalized = normalizeAbsolutePath(fileArg);
    if (!normalized.startsWith(normalizedRoot + path.sep)) {
      throw new Error(`Path is outside mirror root (${mirrorRoot})`);
    }
    const remainder = normalized.slice(normalizedRoot.length + 1);
    const segments = remainder.split(path.sep);
    const projectSlug = segments[0];
    if (!projectSlug) throw new Error("Could not determine project from path");
    const relativePath = segments.slice(1).join("/");
    const projectDir = path.join(mirrorRoot, projectSlug);
    const convex = await readConvexJson(path.join(projectDir, ".kitchen"));
    if (!convex?.deploymentUrl) {
      throw new Error(`Missing .kitchen/convex.json under ${projectDir}`);
    }
    return {
      convexUrl: convex.deploymentUrl,
      projectId: convex.projectId,
      projectSlug,
      relativePath,
    };
  }

  let dir = cwd;
  for (;;) {
    const kitchenDir = path.join(dir, ".kitchen");
    if (await pathExists(kitchenDir)) {
      const convex = await readConvexJson(kitchenDir);
      if (convex?.deploymentUrl) {
        const projectSlug = path.basename(dir);
        const relFromCwd = path.relative(dir, path.resolve(cwd, normalizedArg));
        const relativePath = relFromCwd.replace(/\\/g, "/");
        return {
          convexUrl: convex.deploymentUrl,
          projectId: convex.projectId,
          projectSlug,
          relativePath,
        };
      }
    }

    const mirrorRoot = resolveMirrorRoot();
    const normalizedRoot = normalizeAbsolutePath(mirrorRoot);
    const normalizedDir = normalizeAbsolutePath(dir);
    if (normalizedDir.startsWith(normalizedRoot + path.sep)) {
      const remainder = normalizedDir.slice(normalizedRoot.length + 1);
      const projectSlug = remainder.split(path.sep)[0];
      if (projectSlug) {
        const projectDir = path.join(mirrorRoot, projectSlug);
        const convex = await readConvexJson(path.join(projectDir, ".kitchen"));
        if (convex?.deploymentUrl) {
          const relFromProject = path.relative(projectDir, path.resolve(cwd, normalizedArg));
          return {
            convexUrl: convex.deploymentUrl,
            projectId: convex.projectId,
            projectSlug,
            relativePath: relFromProject.replace(/\\/g, "/"),
          };
        }
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    "Could not resolve Kitchen project — run from a mirrored project directory",
  );
}