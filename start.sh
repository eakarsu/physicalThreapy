#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_dir=${RUNTIME_PROJECT_SOURCE:-$project_dir}

[ -f "$project_dir/.env" ] || { printf 'ERROR: ignored .env is required\n' >&2; exit 1; }
set -a
. "$project_dir/.env"
set +a

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail 'Node.js is required'
command -v npm >/dev/null 2>&1 || fail 'npm is required'
command -v curl >/dev/null 2>&1 || fail 'curl is required for readiness checks'
[ -n "${BACKEND_PORT:-}" ] || fail 'BACKEND_PORT is required'
[ -n "${FRONTEND_PORT:-}" ] || fail 'FRONTEND_PORT is required'
[ "$BACKEND_PORT" != "$FRONTEND_PORT" ] || fail 'API and UI ports must be distinct'
app_port=$FRONTEND_PORT
[ -d "$source_dir/node_modules" ] || fail 'Dependencies are missing; run npm ci during setup'
[ -d "$source_dir/.next" ] || fail 'Production build is missing; run npm run build before start'
[ -n "${DATABASE_URL:-}" ] || fail 'DATABASE_URL is required'
[ -n "${NEXTAUTH_SECRET:-}" ] || fail 'NEXTAUTH_SECRET is required'
[ -n "${NEXTAUTH_URL:-}" ] || fail 'NEXTAUTH_URL is required'

case $NEXTAUTH_SECRET in
  ????????????????????????????????*) ;;
  *) fail 'NEXTAUTH_SECRET must contain at least 32 characters' ;;
esac

case $DATABASE_URL in
  postgresql://*|postgres://*) ;;
  *) fail 'DATABASE_URL must use PostgreSQL' ;;
esac

for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "Port $assigned_port is already in use; no process was terminated"
  fi
done

cd "$source_dir"
npx prisma generate >/dev/null
npx prisma migrate deploy
BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin npx tsx scripts/create-admin.ts
NODE_ENV=production npm run start -- --hostname 127.0.0.1 --port "$app_port" &
app_pid=$!
node scripts/api-proxy.mjs &
proxy_pid=$!
cleanup() {
  trap - EXIT INT TERM
  kill "$app_pid" "$proxy_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
  wait "$proxy_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

attempt=0
until curl -fsS "http://127.0.0.1:$app_port/login" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  kill -0 "$app_pid" 2>/dev/null || fail 'Application stopped before becoming ready'
  [ "$attempt" -lt 45 ] || fail 'Application readiness timed out'
  sleep 1
done

printf 'PT Flow ready: API http://127.0.0.1:%s, UI http://127.0.0.1:%s/login\n' "$BACKEND_PORT" "$app_port"
wait "$app_pid"
