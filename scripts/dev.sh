#!/usr/bin/env bash
#
# Local development: Postgres in Docker + backend and frontend with live reload.
#
#   ./scripts/dev.sh
#
# - Starts (or reuses) the Postgres container from docker-compose.yml.
# - Runs `mvn spring-boot:run` on :8080 and `npm start` on :4200 together.
# - Ctrl+C stops both.
#
# The Docker "full" stack (backend + frontend containers) is opt-in:
#   docker compose --profile full up -d --build
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PID=""
FRONTEND_PID=""

port_in_use() {
  # Pure-bash TCP check: succeeds when something is listening on the port.
  (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

stop_tree() {
  local pid="${1:-}"
  [ -z "$pid" ] && return 0
  pkill -TERM -P "$pid" 2>/dev/null || true
  kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Stopping backend and frontend..."
  stop_tree "$BACKEND_PID"
  stop_tree "$FRONTEND_PID"
  wait 2>/dev/null || true
}

if port_in_use 8080; then
  cat >&2 <<'EOF'
Port 8080 is already in use.

Most likely the Docker "full" stack is running (portfolio-backend). Stop it with:

  docker compose --profile full stop backend frontend

or stop the whole stack with:

  docker compose --profile full down

Then run this script again.
EOF
  exit 1
fi

if port_in_use 4200; then
  echo "Port 4200 is already in use — is 'npm start' already running there?" >&2
  exit 1
fi

if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

echo "Starting PostgreSQL..."
docker compose up -d --wait postgres

# Only install the cleanup trap once background processes exist.
trap cleanup INT TERM EXIT

# `dev` profile seeds sample content into an empty local database.
export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"

echo "Starting backend  → http://localhost:8080"
(cd backend && mvn -q spring-boot:run) &
BACKEND_PID=$!

echo "Starting frontend → http://localhost:4200"
(cd frontend && npm start) &
FRONTEND_PID=$!

echo
echo "Admin studio: http://localhost:4200/admin  (admin / admin123)"
echo "Profile: ${SPRING_PROFILES_ACTIVE} (seeds sample photos into an empty DB)"
echo "Press Ctrl+C to stop both."

# Exit if either process dies so the trap can clean up the other.
wait -n "$BACKEND_PID" "$FRONTEND_PID"
