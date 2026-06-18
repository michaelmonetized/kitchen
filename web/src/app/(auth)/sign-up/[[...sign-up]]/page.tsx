import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex flex-1 items-center justify-center py-16 text-stone-600">
        Configure Clerk keys in .env.local to enable sign-up.
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <SignUp fallbackRedirectUrl="/app/onboarding" signInUrl="/sign-in" />
    </main>
  );
}