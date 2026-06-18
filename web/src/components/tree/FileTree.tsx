"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type TreeNode = {
  _id: Id<"files">;
  parentId: Id<"files">;
  name: string;
  type: "dir" | "file";
  forked: boolean;
};

function buildChildrenMap(nodes: TreeNode[]) {
  const map = new Map<Id<"files">, TreeNode[]>();
  for (const node of nodes) {
    const siblings = map.get(node.parentId) ?? [];
    siblings.push(node);
    map.set(node.parentId, siblings);
  }
  return map;
}

function FileTreeNode({
  projectId,
  node,
  childrenByParent,
}: {
  projectId: string;
  node: TreeNode;
  childrenByParent: Map<Id<"files">, TreeNode[]>;
}) {
  const children = childrenByParent.get(node._id) ?? [];

  if (node.type === "file") {
    return (
      <li>
        <div className="flex items-center gap-1">
          <Link
            href={`/app/projects/${projectId}/files/${node._id}`}
            className="flex flex-1 items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-100"
          >
            <span>{node.name}</span>
          </Link>
          {node.forked && (
            <Link
              href={`/app/projects/${projectId}/files/${node._id}/merge`}
              className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 hover:bg-amber-200"
            >
              fork
            </Link>
          )}
        </div>
      </li>
    );
  }

  return (
    <li>
      <details className="group">
        <summary className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-stone-100">
          {node.name}/
        </summary>
        {children.length > 0 && (
          <ul className="ml-3 border-l border-stone-200 pl-2">
            {children.map((child) => (
              <FileTreeNode
                key={String(child._id)}
                projectId={projectId}
                node={child}
                childrenByParent={childrenByParent}
              />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}

export function FileTree({
  projectId,
  rootId,
}: {
  projectId: string;
  rootId: Id<"files">;
}) {
  const tree = useQuery(api.queries.listProjectTree, { projectId: rootId });

  if (tree === undefined) {
    return <p className="text-sm text-stone-500">Loading tree…</p>;
  }

  const childrenByParent = buildChildrenMap(tree);
  const roots = childrenByParent.get(rootId) ?? [];

  return (
    <ul className="space-y-0.5">
      {roots.map((child) => (
        <FileTreeNode
          key={String(child._id)}
          projectId={projectId}
          node={child}
          childrenByParent={childrenByParent}
        />
      ))}
    </ul>
  );
}