import Link from "next/link";
import { FourLayersDiagram } from "@/components/marketing/FourLayersDiagram";
import { ThreeModesDiagram } from "@/components/marketing/ThreeModesDiagram";

const FEATURES = [
  {
    title: "Live sync",
    description:
      "Every save inserts a version row and pushes over WebSockets. Your laptop, desktop, and teammates see changes in seconds — not after a push.",
    icon: "⚡",
  },
  {
    title: "Human merge",
    description:
      "When edits diverge, both versions exist. Pierre Merge lets you pick lines — no conflict markers, no automatic three-way guesswork.",
    icon: "✋",
  },
  {
    title: "Editor-agnostic pair",
    description:
      "Pair in nvim and VS Code simultaneously. Collab agents bridge each mirror to the relay. Voice stays on Discord; Kitchen syncs bytes only.",
    icon: "🤝",
  },
] as const;

const COMPARISONS = [
  { tool: "Git / GitHub", overlap: "History, sharing", diff: "Live sync default — no branches, commits, or PRs required" },
  { tool: "Dropbox / Drive", overlap: "Mirror to disk", diff: "Every save is a version row; merge UX when forks happen" },
  { tool: "VS Code Live Share", overlap: "Pair editing", diff: "Editor-agnostic via Collab agent — no shared terminal" },
] as const;

const TESTIMONIALS = [
  {
    quote: "I saved in Zed and my teammate's VS Code updated before I finished my coffee.",
    author: "Early beta user",
    role: "Full-stack developer",
  },
  {
    quote: "Finally — version history without the ceremony. The insert is the event.",
    author: "Design partner",
    role: "Platform engineer",
  },
] as const;

export default function MarketingPage() {
  return (
    <main>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent-muted)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Codename</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Your projects live in the cloud.
            <br />
            <span className="text-muted-foreground">Your editor sees them on disk.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Kitchen is a novel stack for storage, sync, work, and collaboration — four layers,
            one model. Save in your editor; history is automatic. Pair across editors without
            a browser.
          </p>
          <p className="mt-3 text-xs text-muted">
            Kitchen is a working codename — not the final product name.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-full bg-foreground px-8 py-3 text-sm font-medium text-surface transition-colors hover:bg-muted-foreground"
            >
              Get started free
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-border-strong px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      <section id="four-layers" className="scroll-mt-20 border-t border-border bg-surface px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              One stack, four layers
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Kitchen collapses what developers usually stitch together — database, sync service,
              local files, and collab tooling — into a single coherent model.
            </p>
          </div>
          <div className="mt-10">
            <FourLayersDiagram />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { layer: "Storage", idea: "Files are rows; versions are append-only history" },
              { layer: "Sync", idea: "WebSocket push to every device in seconds" },
              { layer: "Work", idea: "Mirror at $HOME/Projects — any editor, any terminal" },
              { layer: "Collaboration", idea: "Live collab + Pierre Merge for forks" },
            ].map((item) => (
              <div key={item.layer} className="rounded-xl border border-border bg-surface-muted p-5">
                <p className="text-sm font-semibold text-accent">{item.layer}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.idea}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="three-modes" className="scroll-mt-20 border-t border-border px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Three modes of work
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Not one workflow — three, depending on what you are doing. Solo sync, async
              concurrent edits, or live pair programming.
            </p>
          </div>
          <div className="mt-10">
            <ThreeModesDiagram />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Built different
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border p-6">
                <span className="text-2xl" aria-hidden>
                  {feature.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-surface-muted p-8 sm:p-12">
            <h2 className="text-2xl font-semibold text-foreground">
              A different default — not an anti-git manifesto
            </h2>
            <p className="mt-4 max-w-3xl text-muted leading-relaxed">
              Git is excellent for open-source release trains, semver workflows, and async review
              at scale. Kitchen optimizes for a different default: cloud-held truth, live sync,
              and editor-agnostic collaboration. Teams that need git can still use it alongside
              Kitchen — we are not here to replace what already works well.
            </p>
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
              No <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">git add</code>
              , no <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">git push</code>
              , no branch checkout in the daily loop — because the Sync Store is authoritative and
              your mirror rebuilds from subscriptions.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 pr-4 font-medium">Tool</th>
                  <th className="pb-3 pr-4 font-medium">Overlap</th>
                  <th className="pb-3 font-medium">Kitchen difference</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row) => (
                  <tr key={row.tool} className="border-b border-border">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.tool}</td>
                    <td className="py-3 pr-4 text-muted">{row.overlap}</td>
                    <td className="py-3 text-muted-foreground">{row.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            What early users are saying
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.author}
                className="rounded-xl border border-border bg-surface-muted p-6"
              >
                <p className="text-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm text-muted">
                  <span className="font-medium text-foreground">{t.author}</span>
                  <span className="mx-2">·</span>
                  {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Ready to cook?
          </h2>
          <p className="mt-4 text-muted">
            Join the beta. Create an org, invite your team, and start syncing.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-full bg-accent px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              View pricing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}