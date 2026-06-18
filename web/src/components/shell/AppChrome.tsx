"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/app/onboarding";

  if (isOnboarding) {
    return <div className="flex min-h-screen flex-col bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}