import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Kitchen",
  description: "Kitchen beta pricing — free tier while we build.",
};

const PLANS = [
  {
    name: "Beta",
    price: "Free",
    period: "during early access",
    description: "Full access while Kitchen is in codename beta. Help us shape the product.",
    features: [
      "Unlimited projects",
      "Live sync across devices",
      "Human merge (Pierre)",
      "Editor-agnostic pair sessions",
      "Org admin & role management",
    ],
    cta: "Join the beta",
    highlighted: true,
  },
  {
    name: "Team",
    price: "Coming soon",
    period: "per seat / month",
    description: "For teams that outgrow beta. Pricing will be announced before general availability.",
    features: [
      "Everything in Beta",
      "Priority support",
      "SSO & verified domains",
      "Usage analytics",
      "SLA guarantees",
    ],
    cta: "Notify me",
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <main className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Simple, honest pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Kitchen is free during beta. We will announce team pricing before any paid launch —
          no surprise bills.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 ${
              plan.highlighted
                ? "border-accent bg-accent-muted shadow-sm"
                : "border-border bg-surface"
            }`}
          >
            <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-4">
              <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
              <span className="ml-2 text-sm text-muted">{plan.period}</span>
            </p>
            <p className="mt-4 text-sm text-muted">{plan.description}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent" aria-hidden>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className={`mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-foreground text-surface hover:bg-muted-foreground"
                  : "border border-border-strong text-foreground hover:bg-surface-muted"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-lg text-center text-xs text-muted">
        Kitchen is a codename. Pricing and plan names may change before public launch.
      </p>
    </main>
  );
}