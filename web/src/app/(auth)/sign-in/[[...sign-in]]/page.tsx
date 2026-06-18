import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("placeholder")) {
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