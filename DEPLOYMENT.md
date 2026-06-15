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

Hostinger pulls from GitHub and runs:

```bash
npm run build
```

The build script runs:

```bash
prisma generate && prisma migrate deploy && next build
```

This means production deployment:

1. Generates Prisma Client.
2. Applies pending committed migrations with `prisma migrate deploy`.
3. Builds the Next.js app.

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
