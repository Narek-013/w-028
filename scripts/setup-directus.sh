#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DIRECTUS_PORT="${DIRECTUS_PORT:-8056}"
DIRECTUS_URL="${DIRECTUS_PUBLIC_URL:-http://localhost:${DIRECTUS_PORT}}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [ ! -f .migrations/.env ]; then
  cp .migrations/.env.example .migrations/.env
  echo "Created .migrations/.env"
fi

echo "Starting Directus stack..."
docker compose up -d postgres directus

echo "Waiting for Directus at ${DIRECTUS_URL}..."
for _ in $(seq 1 60); do
  if curl -sf "${DIRECTUS_URL}/server/health" > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Installing migration dependencies..."
cd .migrations
npm install
npm run setup:schema
npm run migrate
cd "$ROOT_DIR"

echo "Restarting Directus to register flows..."
docker restart sam-inna-directus

echo ""
echo "Directus is ready:"
echo "  Admin panel: ${DIRECTUS_URL}/admin"
echo "  RSVP API:    ${DIRECTUS_URL}/items/rsvp"
echo "  Totals:      ${DIRECTUS_URL}/items/guest_totals"
echo ""
echo "Next: npm run dev"
