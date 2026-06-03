# CURRENT TASK — FormOS Milestone 23: Stripe Billing Testing, Webhook Logs, and Subscription Sync Safety

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Stripe billing foundation has been implemented.
* Super Admin can sync FormOS plans to Stripe.
* Stripe products/prices can be created from FormOS plans.
* User billing page exists or is being completed.
* Stripe Checkout exists or is being completed.
* Stripe Customer Portal exists or is being completed.
* Stripe webhook endpoint exists or is being completed.
* Dynamic plans and user quota overrides exist.
* User quota overrides must always win over Stripe subscription state.
* Do not touch CommerceOS.

## Goal

Add billing diagnostics and safety tools so Stripe billing can be tested reliably.

This milestone should make it easy for Super Admin to inspect:

* Stripe sync status
* checkout session creation
* webhook events received
* webhook processing success/failure
* subscription state
* plan mapping
* billing errors

## Why This Matters

Stripe billing can silently fail if:

* webhook secret is wrong
* webhook route is not reachable
* Stripe price ID does not match a FormOS plan
* Checkout succeeds but webhook does not update subscription
* subscription status changes but FormOS does not sync
* plan override logic breaks access

We need visibility before relying on billing.

## Prisma Model

Add model:

```prisma
model BillingEvent {
  id             String   @id @default(cuid())
  provider       String   @default("stripe")
  eventId        String?  @unique
  eventType      String
  userId         String?
  subscriptionId String?
  customerId     String?
  status         String   @default("RECEIVED")
  message        String?
  metadata       Json?
  createdAt      DateTime @default(now())
  processedAt    DateTime?

  @@index([provider])
  @@index([eventType])
  @@index([userId])
  @@index([subscriptionId])
  @@index([customerId])
  @@index([status])
}
```

Create migration:

```bash
npx prisma migrate dev --name add_billing_events
```

Do not use prisma db push.

## Billing Event Logging

Log safe billing events for:

* checkout session created
* checkout.session.completed
* customer.subscription.created
* customer.subscription.updated
* customer.subscription.deleted
* invoice.payment_succeeded
* invoice.payment_failed
* webhook signature failed
* webhook processing failed
* plan sync to Stripe succeeded
* plan sync to Stripe failed
* customer portal session created

Do not log:

* Stripe secret key
* webhook secret
* payment method details
* card details
* full raw webhook payload if too large/sensitive

Metadata should be safe and minimal.

## Webhook Idempotency

Webhook processing should avoid duplicate processing.

If Stripe event ID already exists:

* do not process again
* log or mark as duplicate safely
* return success to Stripe if already processed

Webhook route should still verify Stripe signature first.

## Super Admin Billing Events Page

Create route:

```text
/admin/billing/events
```

Add Super Admin navigation link:

```text
Billing Events
```

Page should show:

* event type
* status
* related user if available
* customer ID shortened
* subscription ID shortened
* message
* created date
* processed date

Add simple filters if easy:

* status
* event type

No need for advanced search.

## Super Admin User Billing Detail

Update user detail or admin users table if practical.

Show:

* current plan
* subscription status
* billing provider
* Stripe customer ID shortened
* Stripe subscription ID shortened
* current period end
* custom quota badge
* unlimited override badge

## Billing Health Panel

Add to `/admin` or `/admin/billing/events`:

```text
Billing Health
```

Show checklist:

* Stripe secret key configured: Yes/No
* Stripe webhook secret configured: Yes/No
* Stripe webhook endpoint path: /api/stripe/webhook
* Number of failed billing events
* Number of recent successful webhook events
* Number of plans synced to Stripe

Do not expose actual secret values.

## Checkout Safety

When user starts checkout:

* log billing event: checkout_session_created
* include safe metadata:
  * planId
  * interval
  * priceId
  * userId
  * customerId

If checkout fails:

* log billing event: checkout_session_failed
* show friendly error

## Plan Sync Safety

When Super Admin syncs plan to Stripe:

* log billing event: stripe_plan_sync_succeeded
* or stripe_plan_sync_failed

Show sync errors in admin UI.

## Webhook Processing Safety

For every webhook:

1. Verify signature.
2. Store event record.
3. Process event.
4. Mark status PROCESSED or FAILED.
5. Save safe message.
6. Do not throw raw errors to public.

## Manual Override Safety

Confirm final effective limits remain:

```text
Default Free Limits + Stripe/Assigned Plan Limits + User Quota Overrides
```

User quota override must win.

Add a small display on billing page/admin user view showing:

```text
Effective access is using custom override
```

when override exists.

## Out of Scope

Do not build new billing provider.
Do not build refunds.
Do not build coupons.
Do not build taxes.
Do not build invoices.
Do not build usage-based billing.
Do not change checkout UI deeply.
Do not change plan limit logic unless fixing bugs.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 23 is complete when:

* BillingEvent model exists.
* Prisma migration exists.
* Stripe webhook events are logged safely.
* Duplicate Stripe webhook events are handled idempotently.
* Checkout session creation is logged.
* Customer portal session creation is logged.
* Stripe plan sync success/failure is logged.
* Webhook failures are visible to Super Admin.
* /admin/billing/events exists.
* Super Admin can view billing events.
* Billing Health panel exists.
* Stripe secrets are never exposed.
* Card/payment method data is never stored.
* Existing checkout still works.
* Existing customer portal still works.
* Existing webhooks still update subscriptions.
* User quota overrides still win.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev --name add_billing_events creates migration.
* npm run build passes.
