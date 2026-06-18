"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const orgs = useQuery(api.admin.listOrgsForUser, {});

  const isOnboarding = pathname === "/app/onboarding";

  useEffect(() => {
    if (orgs === undefined) return;
    if (orgs.length === 0 && !isOnboarding) {
      router.replace("/app/onboarding");
    }
    if (orgs.length > 0 && isOnboarding) {
      router.replace("/app");
    }
  }, [orgs, isOnboarding, router]);

  if (orgs === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (orgs.length === 0 && !isOnboarding) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Redirecting to onboarding…</p>
      </div>
    );
  }

  return <>{children}</>;
}