# CURRENT TASK — FormOS Milestone 23.1: Billing UX Fixes — Cancel Subscription + Current Plan Buttons

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Stripe billing foundation works.
* Plans sync to Stripe.
* Checkout works.
* Stripe webhook works.
* Billing events work.
* UserSubscription updates correctly after payment.
* User quota overrides still work.
* Billing page shows active plan.
* Do not touch CommerceOS.

## Problems

### Problem 1 — No Cancel Subscription Option

The user can see a Manage Billing button, but on Stripe Customer Portal there is no visible option to cancel/stop the subscription.

This may require Stripe Customer Portal cancellation settings to be enabled in Stripe Dashboard.

FormOS should also show clearer billing instructions and/or provide a direct cancellation action if appropriate.

### Problem 2 — Active Plan Still Shows Subscribe Button

After subscribing to a plan, the billing page correctly shows active plan at the top.

But in the plan list, the same active plan still shows a Subscribe/Upgrade button.

That is wrong.

The active subscribed plan should show:

Currently Subscribed

The button should be disabled.

## Goal

Improve billing UX so users clearly understand their current plan and cannot subscribe again to the same active plan.

Also add a safe way to handle subscription cancellation.

## Required Behaviour — Current Plan Button State

On /dashboard/settings/billing:

For each plan card:

If the plan is the user’s current active subscribed plan:

* show badge: Current Plan
* button text: Currently Subscribed
* button disabled
* do not allow checkout for the same active plan

If the plan is different from current plan:

* show Subscribe / Upgrade / Change Plan button as appropriate

If current subscription status is CANCELED:

* allow subscribing again

If current subscription status is ACTIVE or TRIALING:

* disable checkout for same plan

If user has MANUAL plan assignment:

* show badge: Manually Assigned
* avoid showing misleading Stripe checkout actions for the same plan
* if needed, show message:
  This plan was assigned by an administrator.

If user has custom quota override:

* show badge: Custom quota applied

If user has unlimited override:

* show badge: Unlimited access granted by admin

## Required Behaviour — Server-Side Checkout Guard

Do not rely only on disabled UI.

Update checkout creation route/action.

Before creating a Stripe Checkout Session:

* check current UserSubscription
* if user already has ACTIVE/TRIALING subscription for the same plan and same interval if interval is tracked:

  * block checkout
  * return friendly error:
    You are already subscribed to this plan.
* do not create duplicate checkout session for the same active plan

If interval is not tracked yet, compare by planId only for now.

## Required Behaviour — Cancel Subscription

Add cancellation support in one of these ways.

### Option A — Preferred MVP: Stripe Customer Portal

Use Stripe Customer Portal for cancellation.

On billing page, near Manage Billing button, show helper text:

To cancel or update your subscription, open the Stripe billing portal.

Also add warning if portal cancellation may not be enabled:

If you do not see a cancel option in Stripe, enable subscription cancellation in your Stripe Customer Portal settings.

No card/payment details should be stored in FormOS.

### Option B — Direct Cancel Button

If simple and safe, add button:

Cancel Subscription

Behaviour:

* requires logged-in user
* requires active Stripe subscription
* calls Stripe API to set cancel_at_period_end = true
* updates local UserSubscription.cancelAtPeriodEnd = true
* keeps plan access until currentPeriodEnd
* shows message:
  Your subscription will cancel at the end of the current billing period.

Also add optional button:

Resume Subscription

If cancelAtPeriodEnd is true:

* call Stripe API to set cancel_at_period_end = false
* update local record
* show message:
  Your subscription cancellation has been removed.

Do not immediately delete/cancel subscription unless explicitly implemented and safe.

Prefer cancel at period end.

## Stripe Portal Configuration Note

Add a note in DEPLOYMENT.md or BILLING.md:

Stripe Customer Portal cancellation must be enabled in Stripe Dashboard.

Instruction:

Stripe Dashboard → Settings → Billing → Customer Portal → Subscriptions → Enable cancellation

Wording may vary in Stripe Dashboard.

## Billing Page UI

Update /dashboard/settings/billing:

Top current plan card should show:

* current plan
* status
* billing provider
* current period end
* cancel at period end status if true
* Manage Billing button
* Cancel Subscription button if active Stripe subscription exists
* Resume Subscription button if cancelAtPeriodEnd is true

Plan cards should show correct button states.

## Webhook Handling

Ensure customer.subscription.updated updates:

* cancelAtPeriodEnd
* currentPeriodEnd
* status

If customer.subscription.deleted occurs:

* mark subscription CANCELED
* fallback access logic remains as previously implemented

## Security

* only logged-in user can manage their own billing
* user cannot cancel another user’s subscription
* do not expose Stripe secret key
* do not store card/payment method data
* verify webhook signature as already implemented
* Super Admin manual overrides must remain unaffected

## Out of Scope

Do not build refunds.
Do not build coupons.
Do not build taxes.
Do not build invoices.
Do not build custom card forms.
Do not change plan limit logic except for current plan button/check guards.
Do not integrate CommerceOS.

## Acceptance Criteria

This task is complete when:

* Current active plan card shows Current Plan badge.
* Current active plan button says Currently Subscribed.
* Current active plan button is disabled.
* Checkout route blocks duplicate checkout for same active plan.
* Different plans can still be selected for upgrade/change.
* Manage Billing helper text explains cancellation through Stripe Portal.
* Stripe portal cancellation setup note is documented.
* If direct cancel button is implemented:

  * user can cancel at period end
  * user can resume cancellation if cancelAtPeriodEnd is true
  * local subscription updates safely
* Webhook updates cancelAtPeriodEnd correctly.
* User quota overrides still win.
* Manual assignments still work.
* No card/payment method data is stored.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
