# FormOS — Project Handover & Operations Manual

> **Purpose:** Complete technical handover for FormOS, prepared when moving the project
> from a personal Claude account to a Claude Teams account. It documents the product, the
> codebase, the hosting/infrastructure, the deployment pipeline, every environment variable,
> and step-by-step operational runbooks (including emergency recovery).
>
> **Last updated:** 2026-10-19
> **Repository:** `DigiMediaCode/FormOs` (default branch: `main`)
> **Production domain:** `https://formos.com.au` · **Dev/staging:** `https://dev.formos.com.au`
> **Platform sender email:** `info@formos.com.au`
>
> ⚠️ **This document contains NO secret values.** It lists variable *names* and says *where*
> the real values live (the VPS `.env`, GitHub Actions secrets, and the third-party consoles).
> Never paste real secrets into this file or any committed file.

---

## 1. Executive summary

FormOS is a standalone **Next.js (App Router) SaaS** — "the form builder that finishes the
job." It is hosted on a **Docker-based Hostinger VPS** behind a **containerized Caddy** reverse
proxy. Its database is **Supabase PostgreSQL** (external, not on the VPS), and user file uploads
go to **Google Drive / Dropbox** (per-owner OAuth), so the application container is **stateless**.

Deployment is **push-to-deploy**: pushing/merging to `main` triggers a GitHub Actions workflow
that SSHes into the VPS, pulls, and rebuilds the Docker container.

The project was migrated this cycle from a **Hostinger Cloud (managed)** plan to the VPS. All of
the Docker, Caddy, and CI/CD assets described here were created during that migration and are
committed to the repo.

---

## 2. Product overview

FormOS turns business forms into end-to-end workflows:

**collect data → upload files → sign → staff office-review → generate a finalized PDF → store in
cloud storage → track clients/contracts.**

Target verticals: healthcare admin, trades/services, rental/hire, contracts/agreements, bookings.

Authoritative product specs already in the repo:
- `FORMOS_SYSTEM_DOCUMENTATION.md` — module-level product spec (the source of truth for features).
- `FORMOS_SYSTEM_FUNCTIONALITY.md` — functionality detail.
- `CLAUDE.md` — engineering quick-start / conventions (read this first when coding).
- `DEPLOYMENT.md` — Prisma migration & deploy notes, Stripe portal, AdSense policy.
- `SECURITY_CHECKLIST.md`, `BETA_OUTREACH_PACK.md`, `MARKETING_TEAM_HANDOFF.md`, `LAUNCH_DEMO_SCRIPT.md`.

---

## 3. Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router, `latest`) + React + TypeScript |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| ORM / DB | Prisma 7 on PostgreSQL / Supabase, using the `@prisma/adapter-pg` driver adapter (`pg`) |
| Auth | Custom HMAC-signed session cookie (`formos_session`) + email OTP on login |
| Billing | Stripe (subscriptions, trials, customer portal, signature-verified webhooks) |
| PDF | `pdf-lib`; QR codes via `qrcode`; HTML sanitization via `sanitize-html`; password hashing via `bcrypt` |
| Email | **Lark Mail** (transactional: verification, OTP, notifications) |
| File storage | **Google Drive** and **Dropbox** (per-owner OAuth) |
| Runtime | Node.js 22 LTS in Docker (prod); `next dev` on `127.0.0.1:3001` (local) |

Node version in production: **Node 22** (`node:22-bookworm-slim` base image). Native modules
(`bcrypt`, `pg`) are compiled in the Docker build stage.

---

## 4. Repository, branches & history

- **Repo:** `DigiMediaCode/FormOs`, default branch **`main`**.
- **Deployment branch convention used during migration:** `claude/hostinger-vps-migration-eyj79s`
  (feature branch → PR → merge to `main`).
- **Prisma migrations:** 36 migration folders in `prisma/migrations/` (the schema's single source
  of truth is `prisma/schema.prisma`, ~30 models). Use **Prisma Migrate**, never `prisma db push`.

### Migration commit history (this cycle, all merged to `main`)

| PR | Commit | What |
| --- | --- | --- |
| #2 | `96e96e4` | Add Dockerfile, compose, entrypoint for VPS deploy |
| #3 | `2c5e63f` | Pass DB URLs as build args so `next build` can prerender DB-backed routes |
| #4 | `ef4dbc1` | Join shared Caddy network; route by container name (fix 502) |
| #5 | `6aaee0b` | Add push-to-deploy GitHub Actions workflow |
| (branch) | `env_file` array form | Compose-spec/Hostinger-validator compatibility (optional merge) |

Plus `VPS_MIGRATION.md` (the original bare-metal→VPS guide) was added early on.

---

## 5. Codebase architecture

(Condensed from `CLAUDE.md` — read that file for the full version.)

### Layout
- `app/` — App Router routes. Route groups: `(auth)`, `dashboard/` (owner app), `admin/`
  (super admin), public marketing pages, `f/[formSlug]` (public forms), `embed/` (iframe forms),
  `sign/` (contract signing), `api/` (Stripe webhook, OAuth callbacks, integrations, external API).
- `lib/` — server-side business logic by domain: `auth`, `billing`, `forms`, `documents`,
  `clients`, `plans`, `integrations`, `email`, `notifications`, `pdf`, `platform`, `security`,
  `workspaces`, `support`, `blog`, `cms`, `knowledge-base`, `media`. Most files start with
  `import "server-only"`.
- `components/` — `admin`, `builder`, `dashboard`, `documents`, `forms`, `public`, `ui`.
- `prisma/schema.prisma` — ~30 models.
- `plugins/` — standalone WordPress plugin (PHP) and Shopify theme app extension (Remix).
- `scripts/` — `start.js` (prod entrypoint), `make-super-admin.js`.

### Auth model
- Session: **HMAC-signed cookie `formos_session`** (`lib/auth/session.ts`), 7-day expiry.
  Token = `base64url(JSON{userId, expiresAt})` + `.` + `HMAC-SHA256(AUTH_SECRET, payload)`.
- `getCurrentUser()` (`lib/auth/current-user.ts`, request-cached) resolves the logged-in user.
- **Every login requires an email OTP** (`lib/auth/login-verification.ts`) — 6-digit code, stored
  **hashed** in the `AuthToken` table (type `LOGIN_OTP`), 10-minute TTL. There is **no setting to
  disable OTP** (important for recovery — see §10).
- Roles: `USER`, `SUPER_ADMIN` (enum `UserRole`). Workspace roles: `OWNER` / `ADMIN` / `STAFF`.

### Security boundaries (keep intact)
- **Plan limits are the server-side security boundary** — `lib/plans/limits.ts` is the single
  source of truth; gate premium actions with `assertCan*()` helpers (e.g. `assertCanCreateForm`,
  `assertCanReceiveSubmission`, `assertCanGeneratePdf`). Never rely on UI gating alone.
- Storage/OAuth tokens stay server-side; public forms only render `PUBLISHED` forms; Office-Use-Only
  fields hidden from the public; Stripe webhooks signature-verified; CMS/blog/KB/email HTML sanitized.
- Security headers + `X-Frame-Options: SAMEORIGIN` on dashboard/admin/auth (`embed/` is intentionally
  framable) — see `next.config.ts`.
- Anti-spam: **in-memory** rate limit in `lib/security/rate-limit.ts` (per form+IP). Note: per-instance,
  does not persist across multi-instance deploys — fine for the current single-container VPS.

### Key flows
- **Public form submission** funnels through `submitFormInternal` in `lib/forms/public-actions.ts`
  (both `submitPublicForm` and `submitEmbeddedForm`): validation, conditional visibility, uploads,
  signatures, notifications, auto-PDF, analytics.
- **Platform settings:** global key/value config via `lib/platform/settings.ts`, backed by the
  `PlatformSetting` model.
- **Server Actions** live in `actions.ts` files marked `"use server"`; read/query helpers in `lib/`
  marked `"server-only"`. Prisma client: shared singleton from `@/lib/prisma` (`@/*` → repo root).

### Dev rules (from product docs)
- **Do not integrate or touch CommerceOS.**
- Schema changes via Prisma migrations, not `db push`.
- Stripe plan sync via existing billing/admin workflows.
- No AdSense on dashboard/admin/auth/checkout pages; ads stay disabled until Google approves.

---

## 6. Infrastructure & hosting topology

```
            Internet (HTTPS)
                  │
          ┌───────▼────────┐
          │  Caddy (Docker) │  terminates TLS, request_body max_size 20MB
          │  auto HTTPS     │  reverse_proxy formos:3001  (by container name)
          └───────┬────────┘
                  │  Docker network: evolara-production_backend  (external, shared)
          ┌───────▼────────┐
          │ formos (Docker) │  Next.js, listens 0.0.0.0:3001, stateless
          │ /opt/FormOs     │  env from .env (env_file)
          └───────┬────────┘
                  │ (outbound)
        ┌─────────┼───────────────┬─────────────┐
        ▼         ▼               ▼             ▼
   Supabase    Stripe       Lark Mail API   Google Drive / Dropbox
  (Postgres)  (billing)    (transactional)   (per-owner file storage)
```

- **VPS:** Hostinger VPS, **Docker-based**. All projects live under `/opt`. FormOS is at
  **`/opt/FormOs`** (note the capitalization — the dir is `FormOs`).
- **Reverse proxy:** **Caddy runs as a container** on the shared Docker network
  **`evolara-production_backend`**. It reaches FormOS by container name: `reverse_proxy formos:3001`.
  Caddy handles TLS automatically (no certbot). `request_body max_size 20MB` is required (see §10).
- **Database:** **Supabase** (external managed Postgres). **Did not move** during the VPS migration.
  - `DATABASE_URL` → Supabase **pooled** connection (PgBouncer, port **6543**) — app runtime.
  - `DIRECT_URL` → Supabase **direct** connection (port **5432**) — Prisma CLI + migrations.
- **File storage:** Google Drive + Dropbox via per-owner OAuth. **No Docker volumes needed** — the
  container holds no user data.
- **Deploy user on VPS:** `evolara` (member of the `docker` group; owns `/opt/FormOs`).

---

## 7. Docker deployment (how the container is built & run)

Files (all in repo root unless noted):

### `Dockerfile` (multi-stage)
- Base: `node:22-bookworm-slim` with `openssl` + `ca-certificates` (Prisma needs OpenSSL).
  Debian slim is used **on purpose** — Prisma/bcrypt/pg are more reliable on glibc than musl/Alpine.
- `deps` stage installs `node_modules` with build tools (`python3 make g++`) for native modules.
- `build` stage runs **`npx prisma generate && npx next build`**.
  - ⚠️ **Build needs real DB access.** `next build` statically prerenders routes that query Prisma
    (`app/sitemap.ts`, and `app/templates/[slug]` which calls `prisma.subscriptionPlan.findMany`),
    and `prisma.config.ts` throws unless `DIRECT_URL` is set. So `DATABASE_URL`, `DIRECT_URL`, and
    `NEXT_PUBLIC_APP_URL` are passed as **build args** (interpolated from `.env` by compose).
  - These build args live only in the throwaway build stage — multi-stage keeps them **out of the
    final runtime image**.
- `runner` stage: non-root user `nextjs`, copies build output, entrypoint = `docker-entrypoint.sh`,
  `CMD ["npm", "start"]` (which runs `scripts/start.js` → `next start -H 0.0.0.0 -p $PORT`).

### `docker-entrypoint.sh`
Runs **`npx prisma migrate deploy`** (applies committed migrations to Supabase) **then** starts the
server. **Migrations run at container START, not at image build.** On the already-migrated Supabase
DB this is a no-op ("No pending migrations").

### `docker-compose.yml`
- `build.args`: `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `DIRECT_URL` (interpolated from `.env`).
- `container_name: formos`, `restart: unless-stopped`, `env_file: [ .env ]`, `environment: PORT=3001`.
- `expose: ["3001"]` (no host port publish — Caddy reaches it over the shared network by name).
- `healthcheck` hits `http://127.0.0.1:3001/` inside the container.
- Joins the external network:
  ```yaml
  networks:
    default:
      name: evolara-production_backend
      external: true
  ```

### `.dockerignore`
Excludes `.git`, `node_modules`, `.next`, `.env`, logs, markdown, etc. from the build context.

### `Caddyfile` entry (lives on the VPS in the Caddy config, NOT in this repo)
```caddy
dev.formos.com.au {          # (and/or formos.com.au)
    request_body {
        max_size 20MB
    }
    reverse_proxy formos:3001
}
```

---

## 8. CI/CD — push-to-deploy

### Workflow: `.github/workflows/deploy.yml`
- Triggers on **push to `main`** and manual **`workflow_dispatch`**.
- `concurrency: vps-deploy` with `cancel-in-progress` (no overlapping deploys).
- Uses `appleboy/ssh-action` to SSH into the VPS and run:
  ```bash
  cd /opt/FormOs
  git fetch --all --prune
  git reset --hard origin/main        # does NOT touch untracked .env
  docker compose up -d --build
  docker image prune -f
  docker compose ps
  ```
- A failed build keeps the **old container running** (compose only swaps after a successful build),
  so a bad push won't take the site down — the Actions run just shows red.
- Typical deploy time ~3–4 minutes (mostly `next build`); ~few-second blip during container recreate.

### Required GitHub repository secrets
(Settings → Secrets and variables → Actions)

| Secret | Purpose |
| --- | --- |
| `VPS_HOST` | VPS IP / hostname |
| `VPS_USER` | `evolara` |
| `VPS_SSH_KEY` | **private** SSH key authorized on the VPS for `evolara` |
| `VPS_PORT` | SSH port (`22` unless customized) |

### SSH keys involved
1. **Actions → VPS deploy key:** generated on the VPS (`~/.ssh/gha_deploy`), public half in
   `~/.ssh/authorized_keys`, private half in GitHub secret `VPS_SSH_KEY`.
2. **VPS → GitHub read key** (optional, for clean `git pull`): a read-only **deploy key** on the repo.
   HTTPS clone/pull also works.

> ⚠️ When moving to the Teams account, **re-add these secrets** on the repo in the new org context,
> and confirm the GitHub App / Actions are enabled for the Team. The SSH keypairs themselves don't
> change (they're on the VPS), but the repo secrets must exist wherever Actions runs.

---

## 9. Environment variables (complete)

All live in **`/opt/FormOs/.env`** on the VPS (chmod 600, gitignored). `.env.example` in the repo is
the template. **Never commit real values.** Grouped by purpose:

### Core / database / auth
| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase **pooled** (port 6543). App runtime + build arg. |
| `DIRECT_URL` | Supabase **direct** (port 5432). Prisma CLI/migrations + build arg. Required or `prisma.config.ts` throws. |
| `AUTH_SECRET` | HMAC secret for `formos_session`. **Must stay identical** or all sessions invalidate + login breaks in prod. |
| `NODE_ENV` | `production` in the container. |
| `PORT` | `3001` (matches Caddy upstream). |
| `NEXT_PUBLIC_APP_URL` | Public HTTPS URL; inlined into client bundle at build → passed as build arg. |
| `APP_URL` | Server-side app URL. |
| `SUPPORT_EMAIL` | Support contact address. |

### Email (Lark Mail) — transactional email provider
| Variable | Notes |
| --- | --- |
| `EMAIL_PROVIDER` | `lark` |
| `LARK_APP_ID`, `LARK_APP_SECRET` | Lark app OAuth credentials |
| `LARK_SENDER_EMAIL` | `info@formos.com.au` |
| `LARK_REDIRECT_URI` | `https://formos.com.au/api/integrations/lark-mail/callback` |
| `LARK_USER_ACCESS_TOKEN` | **Leave EMPTY.** Static override that *shadows* the auto-refreshing DB token (see §10 & §11). |

### Billing (Stripe)
| Variable | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (per endpoint) |
| `STRIPE_BILLING_PORTAL_RETURN_URL` | e.g. `https://formos.com.au/dashboard/settings/billing` |

### File storage (per-owner OAuth)
| Variable | Notes |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_REDIRECT_URI` | Google Drive storage |
| `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REDIRECT_URI` | Dropbox storage |

### Social login (buttons appear only when all of a provider's keys are set)
| Provider | Variables |
| --- | --- |
| Google | `GOOGLE_AUTH_CLIENT_ID`, `GOOGLE_AUTH_CLIENT_SECRET`, `GOOGLE_AUTH_REDIRECT_URI` |
| Microsoft | `MICROSOFT_AUTH_CLIENT_ID`, `MICROSOFT_AUTH_CLIENT_SECRET`, `MICROSOFT_AUTH_REDIRECT_URI` |
| Facebook | `FACEBOOK_AUTH_CLIENT_ID`, `FACEBOOK_AUTH_CLIENT_SECRET`, `FACEBOOK_AUTH_REDIRECT_URI` |
| Apple | `APPLE_AUTH_CLIENT_ID`, `APPLE_AUTH_TEAM_ID`, `APPLE_AUTH_KEY_ID`, `APPLE_AUTH_PRIVATE_KEY`, `APPLE_AUTH_REDIRECT_URI` |

Redirect URI pattern: `https://formos.com.au/api/auth/<provider>/callback`. If the domain ever
changes, **every** `*_REDIRECT_URI`, the Stripe webhook endpoint, `NEXT_PUBLIC_APP_URL`, `APP_URL`,
and `STRIPE_BILLING_PORTAL_RETURN_URL` must be updated (and re-registered in each provider console).

> **Dead code note:** `db.js` at the repo root is an unused scaffold referencing `SUPABASE_URL` /
> `SUPABASE_ANON_KEY`. **FormOS does not use the Supabase JS SDK** — it talks to Postgres via Prisma
> only. Those two variables are **not needed**. (Safe cleanup: delete `db.js` + drop the unused
> `@supabase/supabase-js` dependency.)

---

## 10. Operational runbooks

### 10.1 Deploy a change
Push/merge to `main` → GitHub Actions auto-deploys. Or trigger manually from the Actions tab
("Run workflow"). New Prisma migrations apply automatically at container start.

### 10.2 Manual deploy / restart (SSH)
```bash
cd /opt/FormOs
git pull origin main
docker compose up -d --build
docker compose logs -f formos
```

### 10.3 Verify env actually loaded into the running container
```bash
docker compose exec formos printenv | grep -E 'DATABASE_URL|AUTH_SECRET'
```
Both must be populated. If empty, the container isn't reading `.env` → login/DB break. (This is the
single most useful diagnostic — an empty result is almost always the root cause of "login broke.")

### 10.4 Emergency super-admin login (OTP bypass) — breaks the "can't receive OTP" deadlock
Every login requires an emailed OTP. If email is down you can't log in to fix email — a deadlock.
Because `AUTH_SECRET` is on the server, mint a valid session cookie directly:

```bash
cd /opt/FormOs
docker compose exec formos node -e '
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createHmac } = require("crypto");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });
prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true, email: true } }).then(function (u) {
  if (!u) { console.error("No SUPER_ADMIN user found"); process.exit(1); }
  const payload = JSON.stringify({ userId: u.id, expiresAt: Date.now() + 7*24*60*60*1000 });
  const enc = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", process.env.AUTH_SECRET).update(enc).digest("base64url");
  console.log("SUPER_ADMIN email:", u.email);
  console.log("COOKIE VALUE:", enc + "." + sig);
  return prisma.$disconnect();
}).catch(function (e) { console.error(e); process.exit(1); });
'
```
Then in the browser, on the exact host you use (e.g. `https://formos.com.au`):
**DevTools → Application → Cookies →** add cookie `formos_session` = the printed `COOKIE VALUE`
(Path `/`, Secure ✓, SameSite Lax). Reload → go to `/admin`. You're in, no OTP needed.

### 10.5 Fix / reconnect transactional email (Lark Mail)
Symptoms in logs: `[formos:lark-email] Lark Mail sender is not connected` and/or
`invalid_grant: The refresh token has expired`.
1. Ensure `LARK_USER_ACCESS_TOKEN` is **empty** in `.env` (it shadows the auto-refreshing DB token):
   ```bash
   nano /opt/FormOs/.env      # blank/remove the LARK_USER_ACCESS_TOKEN line
   docker compose up -d       # recreate so the removed var is gone
   ```
2. Log in (use §10.4 if you can't receive OTP), then **Dashboard → Settings → Integrations →
   Lark Mail → Disconnect → Connect**, completing OAuth as the account that can send from
   `info@formos.com.au`. This writes a fresh access **+ refresh** token to the DB.
3. The sender token is whichever `LARK_MAIL` integration was **updated most recently** across all
   users (`getLarkMailUserAccessToken()` in `lib/integrations/lark-mail/client.ts`), so the latest
   reconnect wins. The app auto-refreshes it ~60s before expiry; it only lapses if email goes idle
   longer than Lark's refresh-token TTL (then reconnect once).

### 10.6 Grant super-admin to a user
```bash
cd /opt/FormOs
docker compose exec formos node scripts/make-super-admin.js user@example.com
```

### 10.7 Disk space (VPS allowance)
Writable disk is a fixed allowance. On "no space left on device", delete large unused files
(old images, caches): `docker image prune -f`, `docker builder prune`. The deploy workflow already
prunes images each run.

---

## 11. Known issues, gotchas & hard-won lessons

1. **`next build` needs a live database.** Static prerender of `sitemap.ts` + `templates/[slug]`
   queries Prisma, and `prisma.config.ts` requires `DIRECT_URL`. → DB URLs passed as **build args**.
2. **Migrations run at container start, not build** (`docker-entrypoint.sh`). Never add
   `migrate deploy` to the image build.
3. **Caddy is containerized** → it must reach the app by **container name** (`formos:3001`) over the
   shared network, **not `127.0.0.1`** (that resolves inside the Caddy container → **502**).
4. **One deployment method only.** Deploying FormOS through the **Hostinger Docker Manager UI breaks
   it** — that UI deploys without `/opt/FormOs/.env`, so the container boots with no `DATABASE_URL`/
   `AUTH_SECRET` and login fails. **Standard: SSH + GitHub Actions only.** Treat the Hostinger Docker
   Manager as view-only for this app.
5. **`env_file` array form** (`env_file: [.env]`) satisfies the Hostinger Docker Manager YAML
   validator; both the string and array forms are valid Docker Compose and behave identically. The
   array form is **not** what broke anything — the missing `.env` (see #4) was.
6. **`LARK_USER_ACCESS_TOKEN` shadows the auto-refreshing DB token** (`lib/email/providers/lark.ts`:
   `config.userAccessToken || getLarkMailUserAccessToken()`). Keep it empty; reconnect via Settings.
7. **OTP login cannot be disabled** and the OTP is stored **hashed** (not readable from the DB). The
   only email-free entry is the minted-cookie recovery in §10.4.
8. **`AUTH_SECRET` must never change** in place, or every `formos_session` is invalidated.
9. **Rate limiter is in-memory / per-instance** — correct on a single container; would need shared
   storage (e.g. Redis) before scaling to multiple instances.
10. **Server Actions accept 15 MB** (`next.config.ts` `bodySizeLimit: "15mb"`) → the proxy must allow
    ≥15 MB (`request_body max_size 20MB` in Caddy). Too-small a limit rejects uploads/signatures.
11. **`/opt/FormOs` is owned by `evolara`.** If you ever re-clone as root, `chown -R evolara:evolara`
    (recursively — a non-recursive chown leaves `.git` root-owned → git "dubious ownership" errors).
12. The red `oauth/authorize` **CORS errors** seen in the login page's network panel were **browser-
    extension noise**, not a FormOS bug.

---

## 12. Third-party accounts & where credentials live

| Service | Used for | Where the secret lives |
| --- | --- | --- |
| **Supabase** | PostgreSQL database | `DATABASE_URL` / `DIRECT_URL` in `.env`; project in Supabase console |
| **Stripe** | Billing, webhooks | `STRIPE_*` in `.env`; Stripe dashboard (webhook endpoint = `/api/...` on the domain) |
| **Lark** | Transactional email (Lark Mail) | `LARK_APP_*` in `.env`; Lark developer console (redirect URI must be registered); live token stored in DB `UserIntegration` |
| **Google** | Drive storage + social login | `GOOGLE_*` in `.env`; Google Cloud console (OAuth consent + redirect URIs) |
| **Microsoft / Facebook / Apple** | Social login | `*_AUTH_*` in `.env`; respective developer consoles |
| **Dropbox** | File storage | `DROPBOX_*` in `.env`; Dropbox app console |
| **Hostinger** | VPS host + (old) Docker Manager | Hostinger panel; VPS SSH as `evolara` |
| **GitHub** | Source + CI/CD | `DigiMediaCode/FormOs`; Actions secrets `VPS_*`; deploy keys |
| **Cloudflare** (if used) | DNS / proxy | `cloudflare-tunnel.*` logs in repo are dev-only leftovers; prod TLS is Caddy/Let's Encrypt |

**On moving to Claude Teams:** none of the above credentials are stored in Claude — they live in the
`.env` on the VPS, in GitHub secrets, and in each vendor console. The move is primarily about repo
access + GitHub Actions context. Re-verify: (a) the Team can access `DigiMediaCode/FormOs`, (b) the
four `VPS_*` Actions secrets exist in the repo, (c) Actions is enabled for the org.

---

## 13. Verify-before-finishing (local/dev)

```bash
npx prisma validate
npx prisma generate
npm run build      # = prisma generate && prisma migrate deploy && next build
```
`npm run dev` → local server on `127.0.0.1:3001`.

---

## 14. Recommended follow-ups (optional, not blocking)

- Delete dead `db.js` + drop unused `@supabase/supabase-js` dependency (see §9).
- Add deploy **failure notifications** (Slack/email) to `deploy.yml`.
- Consider a **staging** flow on `dev.formos.com.au` separate from prod.
- If you ever scale beyond one container, replace the in-memory rate limiter with shared storage and
  add a zero-downtime rollout (two replicas behind Caddy).
- Add a lightweight **Lark Mail keep-alive** (periodic send) if email traffic is bursty, to avoid
  refresh-token expiry during long idle periods.

---

*End of handover. For product/feature depth, continue in `FORMOS_SYSTEM_DOCUMENTATION.md`; for coding
conventions, `CLAUDE.md`; for Prisma/deploy specifics, `DEPLOYMENT.md` and `VPS_MIGRATION.md`.*
