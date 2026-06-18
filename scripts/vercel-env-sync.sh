#!/usr/bin/env bash
set -euo pipefail

WEB="$(cd "$(dirname "$0")/../web" && pwd)"
export PATH="${HOME}/.bun/bin:${HOME}/.nvm/versions/node/v23.9.0/bin:${PATH}"

cd "$WEB"
set -a
# shellcheck disable=SC1091
source .env.local
set +a

vars=(
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  CLERK_WEBHOOK_SECRET
  CLERK_JWT_ISSUER_DOMAIN
  NEXT_PUBLIC_CONVEX_URL
  NEXT_PUBLIC_CONVEX_SITE_URL
  CONVEX_DEPLOYMENT
)

for key in "${vars[@]}"; do
  val="${!key:-}"
  if [[ -z "$val" ]]; then
    echo "skip $key (empty)"
    continue
  fi
  printf "%s" "$val" | vercel env add "$key" development --yes 2>&1 | tail -1 || true
done

echo "✓ Vercel development env synced"