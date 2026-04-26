#!/usr/bin/env sh
# Ensures repo-root `.env` exists so `docker compose` can substitute variables for the Supabase stack.
# Usage: ./scripts/ensure-compose-env.sh [docker compose args…]
# Example: ./scripts/ensure-compose-env.sh up --build
set -e
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

if [ ! -f .env ] || [ ! -s .env ]; then
	echo "RePro: .env is missing or empty — copying .env.example → .env" >&2
	echo "RePro: edit .env before production; demo values are for local dev only." >&2
	cp .env.example .env
fi

exec docker compose "$@"
