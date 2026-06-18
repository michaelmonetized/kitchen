"use client";

import { UserButton } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
      {isClerkConfigured() && <UserButton />}
    </header>
  );
}