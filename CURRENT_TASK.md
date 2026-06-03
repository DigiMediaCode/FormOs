# CURRENT TASK — FormOS Milestone 19.2: Delete / Deactivate Subscription Plans

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Dynamic subscription plans exist.
* Super Admin can create/edit plans.
* Plan limits and allowed field types work.
* User quota overrides work.
* Super Admin can assign plans to users.
* Do not touch CommerceOS.

## Problem

Super Admin currently has no option to delete a subscription plan.

This makes plan management incomplete.

## Goal

Add safe plan delete/deactivate controls for Super Admin.

## Important Rule

Do not blindly delete plans that are assigned to users.

If a plan has active or historical user subscriptions, hard delete should be blocked.

Super Admin should be able to deactivate the plan instead.

## Required Behaviour

On `/admin/plans`, each plan should have:

* Edit
* Deactivate / Activate
* Delete

## Delete Rules

### If plan has no UserSubscription records

Allow hard delete.

Show confirmation before delete:

"Are you sure you want to delete this plan? This cannot be undone."

After delete, show success message.

### If plan has UserSubscription records

Block hard delete.

Show friendly error:

"This plan is assigned to users and cannot be deleted. Deactivate it instead."

Do not delete related subscriptions.

## Deactivate / Activate Rules

Super Admin can toggle `isActive`.

If deactivated:

* plan remains in database
* existing assigned users can keep the plan
* plan should not be shown as assignable to new users unless specifically allowed by current UI
* show badge: Inactive

If activated:

* plan becomes available again

## UI Requirements

On `/admin/plans`:

* show plan status badge:

  * Active
  * Inactive
* add Deactivate / Activate button
* add Delete button
* disable or visually warn delete if users are assigned if count is available
* show assigned users count if practical

## Server Action Requirements

Create or update server actions:

* deleteSubscriptionPlan(planId)
* toggleSubscriptionPlanStatus(planId)

Security:

* require SUPER_ADMIN
* normal users cannot delete/deactivate plans
* validate plan exists
* do not delete if subscriptions exist

## Safety

Do not delete default plans automatically.

Do not seed duplicate default plans.

Do not break existing user subscriptions.

Do not change billing/payment logic.

## Out of Scope

Do not build Stripe.
Do not build checkout.
Do not build invoices.
Do not build plan archive history.
Do not build bulk reassignment.
Do not integrate CommerceOS.

## Acceptance Criteria

This task is complete when:

* Super Admin can delete a plan with zero user subscriptions.
* Super Admin cannot delete a plan assigned to users.
* Super Admin sees friendly error when delete is blocked.
* Super Admin can deactivate a plan.
* Super Admin can reactivate a plan.
* Inactive plans show an Inactive badge.
* Assigned users are not broken when a plan is deactivated.
* Normal users cannot access delete/deactivate actions.
* Existing plan creation/editing still works.
* Existing user plan assignment still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.