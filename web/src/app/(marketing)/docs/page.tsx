import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn the Kitchen mental model — four layers, three modes, six invariants.",
};

const GUIDES = [
  {
    id: "kitchen-way",
    title: "The Kitchen Way",
    time: "15 min",
    summary:
      "The problem with today's four-system stack, and why cloud-held truth with a live mirror changes the daily loop.",
    sections: [
      "Most developers stack Editor → Files on disk → Git → Remote hosting",
      "Kitchen collapses storage, sync, work, and collaboration into one model",
      "The Sync Store is authoritative; your disk is a live view",
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    time: "10 min",
    summary: "Six invariants to memorize before writing code against the Sync Store.",
    sections: [
      "Files are rows — orgs and projects are dir files",
      "Versions are insert-only — no upsert on content",
      "Mirror is a view — clients talk to the Sync Store directly",
    ],
  },
  {
    id: "three-modes",
    title: "Three Modes of Work",
    time: "10 min",
    summary: "Solo live sync, async concurrent edits, and live collab — when to use each.",
    sections: [
      "Solo: save → version insert → mirror on other devices",
      "Async: two version heads → fork → Pierre Merge by line-pick",
      "Live collab: Collab agent + relay → checkpoint → version",
    ],
  },
  {
    id: "git-comparison",
    title: "Git Comparison",
    time: "10 min",
    summary: "For developers with strong git muscle memory — fair comparison, not a takedown.",
    sections: [
      "Git excels at release trains, semver, and async review at scale",
      "Kitchen optimizes for live sync and editor-agnostic collaboration",
      "Teams can use both — Kitchen is a different default, not a replacement mandate",
    ],
  },
] as const;

const INVARIANTS = [
  "Files are rows — orgs and projects are dir files",
  "Versions are insert-only — no upsert on content",
  "Mirror is a view — web talks to Sync Store directly",
  "Sync is live — Convex reactivity in the web client",
  "Merge is human — Pierre / line-pick UI",
  "Collab → checkpoint — no collab_sessions table",
] as const;

export default function DocsPage() {
  return (
    <main className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Documentation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Learn the Kitchen model
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Kitchen is a different way to store, sync, work on, and collaborate on code. Start here,
          then explore the repository docs for full depth.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/vision"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-accent">Vision</p>
            <p className="mt-2 font-semibold text-foreground">Cloud holds truth. Disk is a mirror.</p>
          </Link>
          <Link
            href="/mission"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-accent">Mission</p>
            <p className="mt-2 font-semibold text-foreground">Make the model obvious.</p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">Core guides</h2>
          <div className="mt-6 space-y-8">
            {GUIDES.map((guide) => (
              <article
                key={guide.id}
                id={guide.id}
                className="scroll-mt-24 rounded-xl border border-border bg-surface p-6"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground">{guide.title}</h3>
                  <span className="shrink-0 text-xs text-muted">{guide.time}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{guide.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {guide.sections.map((section) => (
                    <li key={section} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {section}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-surface-muted p-6">
          <h2 className="text-lg font-semibold text-foreground">Six invariants</h2>
          <p className="mt-2 text-sm text-muted">
            Memorize these before implementing against the Sync Store.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {INVARIANTS.map((inv) => (
              <li key={inv}>{inv}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-xl border border-accent/30 bg-accent-muted p-6 text-center">
          <p className="font-medium text-foreground">Ready to try it?</p>
          <p className="mt-2 text-sm text-muted">
            Create an account and set up your first org in minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-4 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-surface hover:bg-muted-foreground"
          >
            Get started free
          </Link>
        </section>

        <p className="mt-8 text-center text-xs text-muted">
          Visual overview on the{" "}
          <Link href="/#four-layers" className="text-accent hover:underline">
            four layers
          </Link>{" "}
          and{" "}
          <Link href="/#three-modes" className="text-accent hover:underline">
            three modes
          </Link>{" "}
          diagrams.
        </p>
      </div>
    </main>
  );
}