import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex flex-1 items-center justify-center py-16 text-stone-600">
        Configure Clerk keys in .env.local to enable sign-in.
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <SignIn fallbackRedirectUrl="/app" signUpUrl="/sign-up" />
    </main>
  );
}