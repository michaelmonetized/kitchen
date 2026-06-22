"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function PublicProjectPage() {
  const params = useParams<{ username: string; project: string }>();
  const username = params.username;
  const projectName = params.project;

  const data = useQuery(api.social.getPublicProjectByPath, {
    username,
    projectName,
  });

  const tree = useQuery(
    api.social.listPublicProjectTree,
    data?.project?._id ? { projectId: data.project._id } : "skip",
  );

  if (data === undefined) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-muted">This project is private or does not exist.</p>
        <Link href="/discover" className="mt-6 inline-block text-accent hover:underline">
          Browse public projects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-muted">
        <Link href="/discover" className="hover:text-foreground">
          Discover
        </Link>{" "}
        / {username}
      </p>
      <h1 className="mt-2 font-mono text-3xl font-semibold text-foreground">
        {username}/{projectName}
      </h1>
      <p className="mt-3 text-muted">
        FOSS project by {data.owner.displayName ?? data.owner.username}. Per-file ACL may hide
        paths like <span className="font-mono">.env</span> from this tree.
      </p>

      {data.isOwner && (
        <Link
          href={`/app/projects/${data.project._id}`}
          className="mt-6 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
        >
          Open in app
        </Link>
      )}

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-muted">Tree</h2>
      <ul className="mt-4 space-y-1 font-mono text-sm">
        {(tree ?? []).map((node) => (
          <li key={node._id} className="text-foreground">
            {node.type === "dir" ? "📁" : "📄"} {node.name}
            {node.forked ? " (forked)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}