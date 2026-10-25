# FormOS — Handover / Ops Manual

The operational source of truth: infrastructure, deploys, environment, runbooks, gotchas.
Engineering conventions live in [`CLAUDE.md`](CLAUDE.md), migrations in
[`DEPLOYMENT.md`](DEPLOYMENT.md), product spec in
[`FORMOS_SYSTEM_DOCUMENTATION.md`](FORMOS_SYSTEM_DOCUMENTATION.md).

**Rule:** any change to infra, deploy or env updates this file in the same PR.

---

## 1. At a glance

| Thing | Value |
| --- | --- |
| Repo | `DigiMediaCode/FormOs`, default branch `main` |
| Prod | https://formos.com.au |
| Dev | https://dev.formos.com.au |
| Sender email | `info@formos.com.au` (Lark Mail) |
| Host | Hostinger VPS, app at `/opt/FormOs` |
| Runtime | Docker container `formos` (image `formos:latest`), Node **22.23.4** (pinned in `Dockerfile`) |
| Reverse proxy | Containerized **Caddy** on the shared Docker network `evolara-production_backend`, routing to `formos:3001` by container name |
| Database | Supabase PostgreSQL (external). Prisma 7 via `@prisma/adapter-pg` |
| File storage | Google Drive / Dropbox, per-owner OAuth. Nothing stored on the VPS |
| Billing | Stripe (subscriptions, trials, portal, signature-verified webhooks) |

The container is **stateless**: the DB and uploads are both off-box, so the VPS can be rebuilt
without data loss. The only irreplaceable thing on the box is `/opt/FormOs/.env`; keep a copy
somewhere safe.

> **Open question:** the workflow deploys a single container named `formos`, and the Caddy
> example in `docker-compose.yml` routes `dev.formos.com.au`. Document here exactly which
> Caddy site blocks (prod, dev, or both) point at this container.

---

## 2. Deploy

**Deploy = merge to `main`.** `.github/workflows/deploy.yml` then:

1. SSHes to the VPS (secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, optional `VPS_PORT`).
2. `cd /opt/FormOs && git fetch --all --prune && git reset --hard origin/main`
   (untracked files, including `.env`, are left alone).
3. `docker compose build --pull`. `--pull` refreshes the Node base image.
4. `docker compose up -d --wait --wait-timeout 300`. This waits for the healthcheck and dumps
   container logs and fails the run if the app doesn't come up healthy.
5. `docker image prune -f`, `docker compose ps`.

Manual re-run: GitHub → Actions → *Deploy to VPS* → **Run workflow**.

### Never do this

- **Never deploy through the Hostinger Docker Manager UI.** It runs compose without
  `/opt/FormOs/.env`, so the container boots with no secrets and login breaks.
  Deploy only via the GitHub Actions workflow, or by SSH (section 5).
- Never `prisma db push` against prod. Migrations only (see `DEPLOYMENT.md`).

### What happens where

| Stage | Does | Needs |
| --- | --- | --- |
| `docker build` (`Dockerfile`) | `npm ci`, `prisma generate`, `next build` | `DATABASE_URL`, `DIRECT_URL` as **build args** (sitemap and template pages prerender from the DB), `NEXT_PUBLIC_APP_URL` (inlined into the client bundle) |
| Container start (`docker-entrypoint.sh`) | `prisma migrate deploy`, then `npm start` → `next start -p 3001` | Full `.env` via `env_file` |
| Healthcheck | `fetch('http://127.0.0.1:3001/')` must return < 500 | — |

The DB URLs exist only in the throwaway build stage, not the final image.
Changing `NEXT_PUBLIC_APP_URL` requires a **rebuild**, not just a restart.

---

## 3. Environment (`/opt/FormOs/.env`)

Real values live only in the VPS `.env`, GitHub Actions secrets, and vendor consoles. **Never
commit secrets.** `.env.example` lists every key:

- **DB:** `DATABASE_URL` (Supabase pooled, port 6543, runtime), `DIRECT_URL` (Supabase direct,
  port 5432, Prisma CLI/migrations; `prisma.config.ts` throws without it).
- **Auth:** `AUTH_SECRET`. **Never change it in place.** It signs the `formos_session` cookie,
  so changing it logs every user out. Rotate it only deliberately, and expect the logouts.
- **Email:** `EMAIL_PROVIDER`, `LARK_APP_ID`, `LARK_APP_SECRET`, `LARK_SENDER_EMAIL`,
  `LARK_REDIRECT_URI`. **Keep `LARK_USER_ACCESS_TOKEN` EMPTY.** If it's set, it shadows the
  auto-refreshing token stored in the DB, and email stops when that static token expires.
- **OAuth sign-in:** `GOOGLE_AUTH_*`, `MICROSOFT_AUTH_*`, `FACEBOOK_AUTH_*`, `APPLE_AUTH_*`.
- **Storage:** `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_DRIVE_REDIRECT_URI`, `DROPBOX_APP_KEY/SECRET`,
  `DROPBOX_REDIRECT_URI`.
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BILLING_PORTAL_RETURN_URL`.
- **URLs:** `NEXT_PUBLIC_APP_URL`, `APP_URL`.

After editing `.env`, run `docker compose up -d --force-recreate` on the VPS. A plain restart
does not re-read `env_file`. If you changed `NEXT_PUBLIC_APP_URL` or the DB URLs, also add
`--build`.

---

## 4. Node.js version policy

- Node is pinned to an exact version in `Dockerfile` (`FROM node:X.Y.Z-bookworm-slim`), in
  `.nvmrc`, and as a floor in `package.json` `engines`. Keep all three in sync.
- **Why exact:** a floating tag (`node:22-…`) stays cached on the VPS, so rebuilds silently keep
  an old Node. That is how prod sat on a vulnerable Node 22 until Oct 2026.
- **On every Node security release** (https://nodejs.org/en/blog/vulnerability): bump the three
  pins, merge, and confirm the deploy is green.
- Node 22 maintenance ends **April 2027**. Plan the move to Node 24 LTS before then.

---

## 5. Runbooks

### Rotate Stripe keys (e.g. after a suspected exposure)
1. Stripe Dashboard → Developers → API keys → **Roll** the secret key. Use the expiry option so
   the old key keeps working a few minutes while you swap it.
2. Developers → Webhooks → the FormOS endpoint → **Roll signing secret**.
3. On the VPS, update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `/opt/FormOs/.env`, then
   run `docker compose up -d --force-recreate`.
4. Verify: send a test webhook from Stripe (expect 200), and open the billing portal from
   `/dashboard/settings/billing`.
5. Check Developers → Logs for API calls you don't recognise.

### Look at the running app (SSH)
```bash
cd /opt/FormOs
docker compose ps                      # health status
docker compose logs -f --tail=200 formos   # [formos:*] structured logs
docker exec formos node -v             # confirm the Node version actually running
```

### Manual deploy / rollback (SSH)
```bash
cd /opt/FormOs
git fetch --all --prune
git reset --hard origin/main           # or a known-good commit SHA to roll back
docker compose build --pull
docker compose up -d --wait --wait-timeout 300
```
A rollback does **not** undo DB migrations. Migrations must stay backward compatible, or be
reverted with a new forward migration.

---

## 6. Gotchas

- `.dockerignore` excludes `*.md`, `plugins/`, `.env*`, so none of these end up in the image.
- The rate limiter (`lib/security/rate-limit.ts`) is in-memory. That's fine with one container,
  but it is per-instance if you ever scale out.
- Caddy needs `request_body { max_size 20MB }`. Server actions accept up to 15 MB of uploads and
  signatures.
- `VPS_MIGRATION.md` is historical (PM2/Nginx plan). Don't follow its runtime steps.
- No CI runs on pull requests yet. The first build of a change happens on the prod VPS.
