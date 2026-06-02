# CURRENT TASK — FormOS Milestone 19: Dynamic Plans, User Quotas, and Usage Limits Foundation

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Forms CRUD works.
* Builder works.
* Public forms work.
* QR code feature is live.
* Google Drive and Dropbox uploads work.
* Storage provider selection works.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Super Admin foundation exists.
* Super Admin platform settings exist.
* Prisma Migrate deployment workflow is active.
* Hostinger deployment is live.
* Supabase database is connected.
* Do not touch CommerceOS.

## Goal

Add dynamic subscription plans, user-specific quota overrides, and server-side usage limits.

This is not billing yet.

Super Admin should be able to:

1. Create subscription plans.
2. Edit subscription plans.
3. Set pricing display for plans.
4. Set feature limits for each plan.
5. Assign a plan to a user.
6. Give user-specific custom quota overrides.
7. Grant a user unlimited access/custom full access outside normal packages.

Normal users should see their current plan and usage.

Server-side enforcement must protect all major limited features.

## Important Direction

Do not implement Stripe.

Do not implement real payments.

Do not implement checkout.

Do not implement invoices.

Do not implement payment webhooks.

Do not build automatic renewal.

Do not build public pricing page logic in this milestone.

This milestone is only:

* dynamic plan management
* manual Super Admin plan assignment
* user-specific quota overrides
* usage display
* server-side enforcement

## Core Concept

Final access should be calculated like this:

Final Limits = Default Free Limits + Assigned Plan Limits + User Quota Overrides

User quota overrides win over plan limits.

If a numeric limit is null, treat it as unlimited.

Example:

Plan allows maxForms = 5
User override maxForms = null
Final maxForms = unlimited

Example:

Plan allows allowDropbox = false
User override allowDropbox = true
Final allowDropbox = true

## Default Free Limits

If a user has no subscription plan assigned, treat them as Free.

Default Free limits:

* maxForms: 1
* maxMonthlySubmissions: 25
* allowGoogleDrive: false
* allowDropbox: false
* allowPdfGeneration: false
* allowOfficeUseFields: false
* allowTemplates: false
* allowQrCode: true
* allowCustomBranding: false

## Default Seed Plans

Create seed/default plans if none exist.

Default plans:

### Free

* name: Free
* slug: free
* priceMonthly: 0
* priceYearly: 0
* currency: USD
* isPublic: true
* isActive: true

Limits:

* maxForms: 1
* maxMonthlySubmissions: 25
* allowGoogleDrive: false
* allowDropbox: false
* allowPdfGeneration: false
* allowOfficeUseFields: false
* allowTemplates: false
* allowQrCode: true
* allowCustomBranding: false

### Starter

* name: Starter
* slug: starter
* priceMonthly: 19
* priceYearly: 190
* currency: USD
* isPublic: true
* isActive: true

Limits:

* maxForms: 5
* maxMonthlySubmissions: 100
* allowGoogleDrive: true
* allowDropbox: false
* allowPdfGeneration: true
* allowOfficeUseFields: false
* allowTemplates: true
* allowQrCode: true
* allowCustomBranding: false

### Pro

* name: Pro
* slug: pro
* priceMonthly: 49
* priceYearly: 490
* currency: USD
* isPublic: true
* isActive: true

Limits:

* maxForms: 25
* maxMonthlySubmissions: 1000
* allowGoogleDrive: true
* allowDropbox: true
* allowPdfGeneration: true
* allowOfficeUseFields: true
* allowTemplates: true
* allowQrCode: true
* allowCustomBranding: false

### Business

* name: Business
* slug: business
* priceMonthly: 99
* priceYearly: 990
* currency: USD
* isPublic: true
* isActive: true

Limits:

* maxForms: null
* maxMonthlySubmissions: 10000
* allowGoogleDrive: true
* allowDropbox: true
* allowPdfGeneration: true
* allowOfficeUseFields: true
* allowTemplates: true
* allowQrCode: true
* allowCustomBranding: true

## Prisma Schema

Add dynamic plan models.

Suggested model:

model SubscriptionPlan {
id           String   @id @default(cuid())
name         String
slug         String   @unique
description  String?
priceMonthly Decimal?
priceYearly  Decimal?
currency     String   @default("USD")
isActive     Boolean  @default(true)
isPublic     Boolean  @default(true)
sortOrder    Int      @default(0)
limits       Json
metadata     Json?
createdAt    DateTime @default(now())
updatedAt    DateTime @updatedAt

subscriptions UserSubscription[]
}

Suggested model:

model UserSubscription {
id          String   @id @default(cuid())
userId      String   @unique
planId      String?
status      String   @default("ACTIVE")
assignedBy  String?
assignedAt  DateTime @default(now())
expiresAt   DateTime?
metadata    Json?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt

user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
plan        SubscriptionPlan? @relation(fields: [planId], references: [id])
}

Suggested model:

model UserQuotaOverride {
id        String   @id @default(cuid())
userId    String   @unique
limits    Json
reason    String?
createdBy String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

Add User relations if needed.

Create migration:

npx prisma migrate dev --name add_dynamic_plans_and_quotas

Do not use prisma db push.

## Limits Shape

Use this JSON structure for plan limits and user overrides:

{
"maxForms": 5,
"maxMonthlySubmissions": 100,
"allowGoogleDrive": true,
"allowDropbox": false,
"allowPdfGeneration": true,
"allowOfficeUseFields": false,
"allowTemplates": true,
"allowQrCode": true,
"allowCustomBranding": false
}

For numeric limits:

* number = limit
* null = unlimited

For boolean limits:

* true = allowed
* false = not allowed

## Unlimited Toggle UI Rule

For numeric limits in Super Admin UI:

* show an Unlimited toggle
* if Unlimited is enabled:

  * save value as null
  * hide or disable the input field
* if Unlimited is disabled:

  * show number input
  * require a valid number

Numeric fields:

* maxForms
* maxMonthlySubmissions

## Super Admin Plan Management

Add routes:

* /admin/plans
* /admin/plans/new
* /admin/plans/[planId]

If dynamic route is too much for one pass, at minimum create:

* /admin/plans

with create/edit actions on same page.

Super Admin should be able to:

* view all plans
* create plan
* edit plan
* set name
* set slug
* set description
* set monthly price
* set yearly price
* set currency
* set active/inactive
* set public/private
* set sort order
* set all limits
* save plan

Do not delete plans in this milestone unless soft-deactivate only.

Add Super Admin navigation link:

Plans → /admin/plans

## Super Admin User Subscription Management

Update Super Admin user area.

Preferred:

* /admin/users/[userId]

or add editable controls inside /admin/users if simpler.

Super Admin should be able to:

* view user’s current plan
* assign plan to user
* change plan
* view user quota override
* edit user quota override
* enable “Unlimited Everything” toggle
* set custom numeric quota overrides
* set custom feature boolean overrides
* clear overrides

## Unlimited Everything Override

Add a simple option:

Grant unlimited/full access

If enabled, save override limits:

{
"maxForms": null,
"maxMonthlySubmissions": null,
"allowGoogleDrive": true,
"allowDropbox": true,
"allowPdfGeneration": true,
"allowOfficeUseFields": true,
"allowTemplates": true,
"allowQrCode": true,
"allowCustomBranding": true
}

If this toggle is enabled:

* hide/disable individual quota inputs if practical
* show clear message:
  "This user has unlimited access outside normal package limits."

If disabled:

* allow individual override editing

## User Dashboard Plan Display

On /dashboard, show:

* current plan name
* forms used / limit
* monthly submissions used / limit
* allowed feature badges

If user has custom quota override:

Show badge:

Custom quota applied

If unlimited:

Show:

Unlimited

Example:

Plan: Starter
Forms: Unlimited
Submissions this month: Unlimited
Custom quota applied

## Usage Calculation

Calculate usage from existing data.

### Forms Usage

Count forms owned by user.

If no deleted state exists, count all forms.

### Monthly Submissions Usage

Count submissions owned by user where createdAt is within current calendar month.

Use ownerId.

## Plan Helpers

Create helpers under:

lib/plans/

Suggested functions:

* getDefaultFreeLimits
* normalizePlanLimits
* mergeLimits
* getPlanLimits
* getUserPlan
* getUserEffectiveLimits
* getUserUsage
* assertCanCreateForm
* assertCanReceiveSubmission
* assertCanUseStorageProvider
* assertCanUseOfficeFields
* assertCanGeneratePdf
* assertCanUseTemplate
* assertCanUseQrCode
* seedDefaultPlansIfMissing

## Enforcement Points

Server-side enforcement is required.

### Create Form

Enforce maxForms.

Apply to:

* blank form creation
* template form creation

If limit exceeded, show friendly error:

Your current plan allows up to X forms. Upgrade your plan to create more forms.

If unlimited, allow.

### Public Submission

Before saving public submission, check owner’s monthly submission limit.

If exceeded, block with public-safe message:

This form is temporarily unavailable because the owner has reached their monthly submission limit.

Do not expose plan details to public submitter.

### Storage Provider Activation

When user sets active upload provider:

* if Google Drive selected, check allowGoogleDrive
* if Dropbox selected, check allowDropbox

If blocked, show:

Your current plan does not include Google Drive uploads.

or

Your current plan does not include Dropbox uploads.

Do not disconnect existing integrations automatically.

### Office Use Only Fields

When saving builder fields:

* if any field has visibility OFFICE
* and allowOfficeUseFields is false
* block save with friendly error:

Office Use Only fields are not included in your current plan.

Existing saved office fields should not crash.

### PDF Generation / Finalize Submission

Before finalized PDF generation/email:

* check allowPdfGeneration
* if false, block with owner-facing error:

Completed PDF generation is not included in your current plan.

### Templates

When creating Vehicle Hire Agreement template:

* check allowTemplates
* if false, block with friendly error:

Templates are not included in your current plan.

### QR Code

Use allowQrCode helper.

For now, default plans allow QR code.

If disabled by custom plan/override later:

* hide or disable QR card
* show upgrade notice

## Security

* Only Super Admin can create/edit plans.
* Only Super Admin can assign plans.
* Only Super Admin can edit user quota overrides.
* Normal users cannot change their own plan.
* All limits must be enforced server-side.
* Do not rely only on UI hiding.
* Public submissions must be checked server-side.
* Do not expose admin plan controls to normal users.

## Out of Scope

Do not build Stripe.
Do not build billing.
Do not build checkout.
Do not build invoices.
Do not build payment webhooks.
Do not build automatic renewal.
Do not build public pricing page integration.
Do not change landing page.
Do not change PDF design.
Do not change Google Drive or Dropbox OAuth logic unless needed for plan enforcement.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 19 is complete when:

* SubscriptionPlan model exists.
* UserSubscription model exists.
* UserQuotaOverride model exists.
* Prisma migration exists.
* Default seed plans can be created if missing.
* Super Admin can create/edit plans dynamically.
* Plans can store monthly and yearly pricing.
* Plans can store numeric and boolean limits.
* Numeric limits support Unlimited toggle saved as null.
* Super Admin can assign plan to user.
* Super Admin can set user quota overrides.
* Super Admin can grant unlimited/full access to a user.
* User-specific overrides win over plan limits.
* Users default to Free if no subscription exists.
* Dashboard shows current plan and usage.
* Form creation limit is enforced server-side.
* Template creation limit is enforced server-side.
* Monthly submission limit is enforced server-side.
* Storage provider activation checks plan/effective limits.
* Office Use Only field saving checks plan/effective limits.
* PDF generation/finalization checks plan/effective limits.
* Friendly errors are shown when limits are reached.
* Normal users cannot change their own plan or quota.
* Existing users/forms/submissions still work.
* Existing Google Drive/Dropbox integrations still work for allowed users.
* Existing PDF/email/audit flow still works for allowed users.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev --name add_dynamic_plans_and_quotas creates migration.
* npm run build passes.