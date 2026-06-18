import Link from "next/link";

export function AppSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-stone-200 bg-stone-50 p-4">
      <Link href="/app" className="text-lg font-semibold text-stone-900">
        Kitchen
      </Link>
      <nav className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/app" className="rounded-md px-2 py-1.5 text-stone-700 hover:bg-stone-100">
          Projects
        </Link>
        <Link
          href="/app/settings"
          className="rounded-md px-2 py-1.5 text-stone-700 hover:bg-stone-100"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}