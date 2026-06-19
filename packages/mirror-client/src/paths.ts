import path from "node:path";
import type { Id } from "./types.js";
import { normalizeAbsolutePath } from "./normalize-path.js";
import { slugify } from "./slugify.js";

export type TreeNode = {
  _id: Id<"files">;
  parentId: Id<"files">;
  name: string;
  type: "dir" | "file";
  forked: boolean;
};

export type ProjectInfo = {
  projectId: Id<"files">;
  slug: string;
  name: string;
};

export function projectSlug(name: string, orgName?: string): string {
  const base = slugify(name);
  if (!orgName) return base;
  const org = slugify(orgName);
  return `${org}-${base}`;
}

export function buildRelativePath(
  nodes: TreeNode[],
  fileId: Id<"files">,
  projectId: Id<"files">,
): string | null {
  const byId = new Map(nodes.map((n) => [n._id, n]));
  const parts: string[] = [];
  let current = byId.get(fileId);
  if (!current) return null;

  while (current && current._id !== projectId) {
    parts.unshift(current.name);
    if (current.parentId === projectId) break;
    const parent = byId.get(current.parentId);
    if (!parent) return null;
    current = parent;
  }

  return parts.join(path.sep);
}

export function mirrorPath(
  mirrorRoot: string,
  projectSlug: string,
  relativePath: string,
): string {
  return path.join(mirrorRoot, projectSlug, relativePath);
}

/** Resolve parent dir id from a relative directory path under a project root. */
export function resolveParentId(
  nodes: TreeNode[],
  projectId: Id<"files">,
  relativeDir: string,
): Id<"files"> | null {
  if (!relativeDir) return projectId;

  let parentId: Id<"files"> = projectId;
  for (const segment of relativeDir.split(path.sep)) {
    if (!segment) continue;
    const child = nodes.find(
      (n) => n.parentId === parentId && n.name === segment && n.type === "dir",
    );
    if (!child) return null;
    parentId = child._id;
  }
  return parentId;
}

export function parseMirrorPath(
  mirrorRoot: string,
  absolutePath: string,
  slugToProject: Map<string, ProjectInfo>,
): { project: ProjectInfo; relativePath: string } | null {
  const normalizedRoot = normalizeAbsolutePath(mirrorRoot);
  const normalized = normalizeAbsolutePath(absolutePath);
  if (!normalized.startsWith(normalizedRoot + path.sep)) return null;

  const remainder = normalized.slice(normalizedRoot.length + 1);
  const segments = remainder.split(path.sep);
  const slug = segments[0];
  if (!slug) return null;

  const project = slugToProject.get(slug);
  if (!project) return null;

  const relativePath = segments.slice(1).join(path.sep);
  if (!relativePath) return null;

  return { project, relativePath };
}