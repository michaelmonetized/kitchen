import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <OnboardingWizard />
    </main>
  );
}