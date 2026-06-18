#!/usr/bin/env bash
# Pull authorized credentials into web/.env.local using local CLIs.
# Run from repo root in zsh (CLIs already authenticated).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="${ROOT}/web"

export PATH="${HOME}/.bun/bin:${HOME}/.nvm/versions/node/v23.9.0/bin:${HOME}/.local/bin:${PATH}"

cd "$WEB"

echo "→ Clerk env pull"
clerk env pull --app "${CLERK_APP_ID:-app_3FKGf5FjU0xo2auiacRVidD84r0}" --file .env.local

if ! grep -q '^CONVEX_DEPLOYMENT=dev:' .env.local 2>/dev/null; then
  echo "→ Convex configure (team hustle-testing, project kitchen)"
  npx convex dev --once --configure new --team hustle-testing --project kitchen
fi

if grep -q '^CLERK_JWT_ISSUER_DOMAIN=' .env.local; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  echo "→ Convex env: CLERK_JWT_ISSUER_DOMAIN"
  npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"
fi

echo "→ Convex push + codegen"
npx convex dev --once

if command -v vercel >/dev/null && [[ -f .vercel/project.json ]]; then
  echo "→ Vercel env sync (development)"
  vercel env pull .env.vercel --yes
fi

echo "✓ Environment ready in web/.env.local"