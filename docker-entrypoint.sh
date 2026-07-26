#!/bin/sh
set -e

# Apply any committed Prisma migrations to the (Supabase) database before
# starting the server. This uses DIRECT_URL (see prisma.config.ts), which must
# be the Supabase direct connection on port 5432 — NOT the pooled 6543 URL.
#
# On a database that is already up to date (e.g. shared with the old Hostinger
# deploy) this is a no-op that prints "No pending migrations".
echo "[formos:docker] applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[formos:docker] starting FormOS..."
exec "$@"
