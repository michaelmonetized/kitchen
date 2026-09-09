import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Kitchen</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Cloud holds truth. Disk is a mirror. Save inserts history. Sync is always on.
            </p>
            <p className="mt-4 text-xs text-muted">
              Kitchen is a codename — not the final product name.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">Product</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/#four-layers" className="hover:text-foreground">
                    Architecture
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Learn</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/vision" className="hover:text-foreground">
                    Vision
                  </Link>
                </li>
                <li>
                  <Link href="/mission" className="hover:text-foreground">
                    Mission
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Account</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/sign-up" className="hover:text-foreground">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-foreground">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Kitchen (codename). All rights reserved.
        </p>
      </div>
    </footer>
  );
}