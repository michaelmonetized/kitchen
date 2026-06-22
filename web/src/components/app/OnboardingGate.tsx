"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useQuery(api.accounts.getCurrentAccount, {});

  const isOnboarding = pathname === "/app/onboarding";
  const isAccount = pathname === "/app/account";

  useEffect(() => {
    if (account === undefined) return;
    if (!account && !isOnboarding) {
      router.replace("/app/onboarding");
      return;
    }
    if (account && !account.user.onboardingComplete && !isOnboarding) {
      router.replace("/app/onboarding");
      return;
    }
    if (account?.user.onboardingComplete && isOnboarding) {
      router.replace("/app");
    }
  }, [account, isOnboarding, isAccount, router]);

  if (account === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if ((!account || !account.user.onboardingComplete) && !isOnboarding) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Redirecting to onboarding…</p>
      </div>
    );
  }

  return <>{children}</>;
}