import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Codename
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Kitchen
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Your projects live in the cloud. Your editor sees them on disk. There
          is no git.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}