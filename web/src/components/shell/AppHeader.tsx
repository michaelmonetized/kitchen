"use client";

import { UserButton } from "@clerk/nextjs";

export function AppHeader({ title }: { title: string }) {
  const isPlaceholder =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("placeholder");

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
      {!isPlaceholder && <UserButton />}
    </header>
  );
}