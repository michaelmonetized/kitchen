"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

function FileTreeNode({
  projectId,
  fileId,
  name,
  type,
  forked,
}: {
  projectId: string;
  fileId: string;
  name: string;
  type: string;
  forked?: boolean;
}) {
  const children = useQuery(api.queries.children, {
    parentId: fileId as Id<"files">,
  });

  if (type === "file") {
    return (
      <li>
        <div className="flex items-center gap-1">
          <Link
            href={`/app/projects/${projectId}/files/${fileId}`}
            className="flex flex-1 items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-100"
          >
            <span>{name}</span>
          </Link>
          {forked && (
            <Link
              href={`/app/projects/${projectId}/files/${fileId}/merge`}
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
          {name}/
        </summary>
        {children && children.length > 0 && (
          <ul className="ml-3 border-l border-stone-200 pl-2">
            {(children as Doc<"files">[]).map((child) => (
              <FileTreeNode
                key={String(child._id)}
                projectId={projectId}
                fileId={String(child._id)}
                name={String(child.name)}
                type={String(child.type)}
                forked={Boolean(child.forked)}
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
  rootId: string;
}) {
  const children = useQuery(api.queries.children, {
    parentId: rootId as Id<"files">,
  });

  if (children === undefined) {
    return <p className="text-sm text-stone-500">Loading tree…</p>;
  }

  return (
    <ul className="space-y-0.5">
      {(children as Doc<"files">[]).map((child) => (
        <FileTreeNode
          key={String(child._id)}
          projectId={projectId}
          fileId={String(child._id)}
          name={String(child.name)}
          type={String(child.type)}
          forked={Boolean(child.forked)}
        />
      ))}
    </ul>
  );
}