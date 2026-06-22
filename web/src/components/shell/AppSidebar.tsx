import Link from "next/link";

export function AppSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-border bg-surface-muted p-4">
      <Link href="/app" className="text-lg font-semibold text-foreground">
        Kitchen
      </Link>
      <nav className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/app" className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface hover:text-foreground">
          Projects
        </Link>
        <Link
          href="/app/account"
          className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          Account
        </Link>
        <Link
          href="/app/settings"
          className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          Settings
        </Link>
        <Link
          href="/discover"
          className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          Discover
        </Link>
      </nav>
    </aside>
  );
}