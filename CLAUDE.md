# CLAUDE.md — FormOS

Guidance for Claude Code when working in this repository.

## What this is

**FormOS** — a standalone Next.js SaaS: *"the form builder that finishes the job."* It turns business
forms into end-to-end workflows: collect data → upload files → sign → staff office-review → generate a
finalized PDF → store in cloud storage → track clients/contracts. Verticals: healthcare admin,
trades/services, rental/hire, contracts/agreements, bookings.

The authoritative product spec is [`FORMOS_SYSTEM_DOCUMENTATION.md`](FORMOS_SYSTEM_DOCUMENTATION.md) —
read it for module-level detail. This file is the engineering quick-start.

## Stack

- **Next.js (App Router, latest)** + React + TypeScript, Tailwind (v4 via `@tailwindcss/postcss`)
- **Prisma 7** on **PostgreSQL / Supabase** using the `@prisma/adapter-pg` driver adapter
- **Stripe** — subscriptions, trials, customer portal, webhooks
- **pdf-lib** (PDF generation), **qrcode**, **sanitize-html**, **bcrypt**
- Email via **Lark Mail**; storage via **Google Drive** and **Dropbox** (per-owner OAuth)
- Dev server: `next dev` on `127.0.0.1:3001`. Cloudflare tunnel used for external testing.

## Layout

- `app/` — App Router routes. Route groups: `(auth)`, `dashboard/` (owner app), `admin/` (super admin),
  public marketing pages, `f/[formSlug]` (public forms), `embed/` (iframe forms), `sign/` (contract
  signing), and `api/` (Stripe webhook, OAuth callbacks, integrations, external API).
- `lib/` — server-side business logic, organized by domain (`auth`, `billing`, `forms`, `documents`,
  `clients`, `plans`, `integrations`, `email`, `notifications`, `pdf`, `platform`, `security`,
  `workspaces`, `support`, `blog`, `cms`, `knowledge-base`, `media`). Nearly every file starts with
  `import "server-only"`.
- `components/` — UI split into `admin`, `builder`, `dashboard`, `documents`, `forms`, `public`, `ui`.
- `prisma/schema.prisma` — ~30 models (single source of truth for the data model).
- `plugins/` — a WordPress plugin (PHP) and a Shopify theme app extension (Remix), both standalone.
- `scripts/` — `start.js` (prod entrypoint), `make-super-admin.js`.

## Conventions

- **Server Actions** live in `actions.ts` files (route-local) or `lib/**/actions.ts` and are marked
  `"use server"`. Read/query helpers live in domain `lib/` modules marked `"server-only"`.
- **Auth**: HMAC-signed session cookie `formos_session` (`lib/auth/session.ts`). Use
  `getCurrentUser()` (`lib/auth/current-user.ts`, request-cached) to resolve the logged-in user. Roles:
  `USER` and `SUPER_ADMIN`; workspace roles `OWNER` / `ADMIN` / `STAFF`.
- **Plan limits are enforced server-side and are the security boundary.** `lib/plans/limits.ts` is the
  single source of truth. `getUserEffectiveLimits(userId)` merges Free defaults → plan limits →
  per-user `UserQuotaOverride`. Gate premium actions with the `assertCan*()` helpers (e.g.
  `assertCanCreateForm`, `assertCanReceiveSubmission`, `assertCanGeneratePdf`). Never rely on UI gating
  alone — always assert in the action/route too.
- **Prisma client**: import the shared singleton from `@/lib/prisma`. Path alias `@/*` → repo root.
- **Platform settings**: global key/value config via `lib/platform/settings.ts`
  (`getPlatformSettings()` / `updatePlatformSettings()`), backed by the `PlatformSetting` model. Add new
  global toggles here (extend `PlatformSettings`, `PLATFORM_SETTING_KEYS`, `DEFAULT_PLATFORM_SETTINGS`,
  and the normalize/update logic).
- **Public form submission** funnels through `submitFormInternal` in `lib/forms/public-actions.ts`
  (both `submitPublicForm` and `submitEmbeddedForm`). Field validation, conditional visibility,
  uploads, signatures, notifications, auto-PDF, and analytics all happen here.
- Match surrounding style: explicit helpers, early-return validation with user-safe error messages via
  `errorRedirect(...)`, structured `console.info/warn/error` with a `[formos:*]` prefix.

## Security posture (keep intact)

- Storage-provider and OAuth tokens stay server-side; never exposed to public submitters.
- Public forms only render `PUBLISHED` forms; Office Use Only fields are hidden from the public.
- Stripe webhooks are signature-verified. CMS/blog/KB/email HTML is sanitized.
- `next.config.ts` sets security headers and `X-Frame-Options: SAMEORIGIN` on dashboard/admin/auth
  (public `embed/` route is intentionally framable).
- Existing anti-spam: in-memory rate limit in `lib/security/rate-limit.ts` (per form+IP, 10 / 10 min).
  Note this is per-instance and does not persist across serverless/multi-instance deploys.

## Dev rules (from the product docs)

- **Do not integrate or touch CommerceOS** from this project.
- Schema changes use **Prisma migrations**, not `prisma db push`.
- Stripe plan sync is driven through the existing billing/admin workflows.
- No AdSense on dashboard/admin/auth/checkout pages.
- Keep public form submission, billing, and storage-token handling server-side protected.

## Verify before finishing

```bash
npx prisma validate
npx prisma generate
npm run build
```

`npm run dev` starts the local server on port 3001. `npm run build` runs `prisma generate` +
`prisma migrate deploy` + `next build`.
