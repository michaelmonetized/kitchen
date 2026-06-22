"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function DiscoverPage() {
  const projects = useQuery(api.social.listPublicProjects, { limit: 100 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Discover FOSS</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Public projects are FOSS-shaped — browse trees and history at{" "}
        <span className="font-mono text-foreground">username/project</span>. Fork copies to your{" "}
        <span className="font-mono">~/Projects</span>; no PR path.
      </p>

      {projects === undefined ? (
        <p className="mt-10 text-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="mt-10 text-muted">No public projects yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface">
          {projects.map((row) => (
            <li key={row.projectId}>
              <Link
                href={`/${row.username}/${row.projectName}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-muted"
              >
                <span className="font-mono text-foreground">
                  {row.username}/{row.projectName}
                </span>
                <span className="text-sm text-muted">public</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}