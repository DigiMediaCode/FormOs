# FormOS Deployment

FormOS uses Prisma Migrate for production database schema changes.

## Existing Database Baseline

The current Supabase database was originally synced with `prisma db push`. The baseline migration at `prisma/migrations/20260531000000_initial_baseline` represents that existing schema.

For an already-synced database, mark this baseline as applied once before relying on automatic deploys:

```bash
npx prisma migrate resolve --applied 20260531000000_initial_baseline
```

After that one-time baseline, future deployments should use `prisma migrate deploy` only.

## Environment Variables

Use `DATABASE_URL` for the application runtime connection. For Supabase, this can be the pooled PgBouncer URL.

Use `DIRECT_URL` for Prisma CLI and migration commands. For Supabase, this must be the direct database connection on port `5432`, not the pooled PgBouncer URL on port `6543`.

## Local Schema Change

1. Update `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name change_name`.
3. Run `npm run build`.
4. Commit `prisma/schema.prisma` and `prisma/migrations`.
5. Push to GitHub.

## Production Deploy

FormOS runs as a Docker container on the Hostinger VPS (`/opt/FormOs`). Merging
to `main` triggers `.github/workflows/deploy.yml`, which SSHes to the VPS,
resets to `origin/main`, and runs `docker compose build --pull` followed by
`docker compose up -d --wait`. See `HANDOVER.md` for the full runbook.

Inside that flow:

1. **Image build** (`Dockerfile`) runs `prisma generate && next build`. It does
   **not** migrate. `next build` still needs `DATABASE_URL`/`DIRECT_URL` (passed
   as build args) because some routes prerender from the database.
2. **Container start** (`docker-entrypoint.sh`) runs `prisma migrate deploy`,
   then starts the server. Pending committed migrations are applied here.
3. The workflow waits for the container healthcheck and fails if it goes
   unhealthy.

`npm run build` (`prisma generate && prisma migrate deploy && next build`) is
for non-Docker/local builds only.

Do not use `prisma db push` for production deployments.

## Stripe Customer Portal Cancellation

FormOS uses the Stripe-hosted Customer Portal for billing management. To let
users cancel from Stripe, enable subscription cancellation in Stripe:

Stripe Dashboard -> Settings -> Billing -> Customer Portal -> Subscriptions ->
Enable cancellation.

The wording may vary slightly in Stripe Dashboard. Keep
`STRIPE_BILLING_PORTAL_RETURN_URL` set to:

```env
STRIPE_BILLING_PORTAL_RETURN_URL=https://formos.com.au/dashboard/settings/billing
```

## Public Marketing Page Checklist

Any new public marketing/content page should include public ad slot support
where appropriate. Use the existing FormOS public ads components/settings,
avoid dashboard/admin pages, avoid public form submit controls, and keep ads
away from primary conversion CTAs.

## AdSense Approval Mode

FormOS has the Google AdSense integration and platform settings implemented,
but ads should remain disabled until Google approves the site. Keep
`adsEnabled`, `showLandingPageAds`, and `showPublicFormAds` off by default.

Before requesting another review, add more unique public content such as
help articles, blog posts, template pages, and product education pages. Google
may reject new SaaS or product sites for low-value content until there is
enough original public content available.
