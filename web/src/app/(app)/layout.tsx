import { OnboardingGate } from "@/components/app/OnboardingGate";
import { AppChrome } from "@/components/shell/AppChrome";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <AppChrome>{children}</AppChrome>
    </OnboardingGate>
  );
}