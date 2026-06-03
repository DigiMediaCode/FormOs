# CURRENT TASK — FormOS Milestone 20.1: User Profile + Business/Billing Profile Foundation

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Auth/signup/login works.
* Email verification and password reset are being added or completed.
* Dynamic plans and quota controls exist.
* Super Admin exists.
* FormOS is live on Hostinger.
* Supabase is connected.
* Do not touch CommerceOS.

## Goal

Improve user account data structure by separating personal user information from business/billing profile information.

Signup should stay simple, but FormOS should collect enough business information for future subscriptions, invoices, and customer management.

## Important Direction

Do not make signup too heavy.

Do not ask for full company/billing details during initial signup.

Do not build Stripe yet.

Do not store credit card or payment method data.

Do not build checkout.

This milestone is only:

* first name / last name support
* business profile
* billing profile metadata
* account/profile settings page
* Super Admin visibility of business profile

## Signup Update

Update signup form fields to:

* First Name
* Last Name
* Email
* Password

Remove or replace old single name input if currently used.

User display name can be generated as:

firstName + " " + lastName

If existing User model has `name`, keep it for compatibility and populate it from firstName/lastName.

## Prisma Schema

Add fields to User if not already present:

* firstName String?
* lastName String?
* phone String?

Keep existing email and name fields.

Add model:

BusinessProfile {
id              String   @id @default(cuid())
userId          String   @unique
companyName     String?
taxId           String?
taxIdLabel      String?  // ABN, GST, VAT, EIN, Tax ID, etc.
phone           String?
billingEmail    String?
billingName     String?
addressLine1    String?
addressLine2    String?
city            String?
state           String?
postcode        String?
country         String?
metadata        Json?
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt

user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

Create migration:

npx prisma migrate dev --name add_user_business_profile

Do not use prisma db push.

## Profile Settings Page

Create or update route:

/dashboard/settings/profile

Add navigation link:

Profile / Business Profile

Fields:

### Personal Details

* First Name
* Last Name
* Email readonly or editable only if current system supports it safely
* Phone

### Business Details

* Company / Business Name
* ABN / Tax ID
* Tax ID Label
* Business Phone
* Billing Email
* Billing Name

### Address

* Address Line 1
* Address Line 2
* City
* State
* Postcode
* Country

Add Save Profile button.

Use existing pending button UX.

Show success/error messages.

## Dashboard Prompt

If business profile is incomplete, show a gentle dashboard banner:

Complete your business profile to prepare your account for billing and invoices.

Button:

Complete Profile

Do not block app usage yet.

## Super Admin User View

Update Super Admin users area or user detail if it exists.

Super Admin should be able to view:

* first name
* last name
* phone
* company name
* ABN / tax ID
* country
* current plan

Super Admin should not edit business profile in this milestone unless already simple.

## Billing Preparation

Add safe placeholders only.

Do not implement payment processor.

Do not store card data.

Do not store bank account data.

If needed, add metadata fields for future billing integration, but do not use them yet.

## Validation

Basic validation:

* email format if editable
* phone can be free text
* billing email should be valid email if provided
* postcode optional
* country optional
* tax ID optional

Do not over-validate ABN/tax ID in this milestone.

## Existing Users

Existing users should not break.

For existing users:

* firstName/lastName can be null
* name can remain as fallback
* BusinessProfile can be created on first save
* no hard backfill required unless simple

## Security

* Logged-in user can edit only their own profile.
* Normal users cannot edit another user profile.
* Super Admin can view profile summary.
* Do not expose sensitive billing metadata publicly.
* Do not store payment method data.

## Out of Scope

Do not build Stripe.
Do not build checkout.
Do not build invoices.
Do not build tax validation.
Do not build team/company workspaces.
Do not build user-level branding.
Do not change Google Drive/Dropbox logic.
Do not change PDF/email/audit logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 20.1 is complete when:

* Signup collects first name and last name.
* User model supports firstName and lastName.
* Existing name field still works as fallback if present.
* BusinessProfile model exists.
* Prisma migration exists.
* /dashboard/settings/profile exists.
* Logged-in user can save personal details.
* Logged-in user can save business/billing profile.
* Dashboard shows profile completion prompt if business profile is incomplete.
* Super Admin can view user business profile summary.
* Existing users are not broken.
* Existing signup/login still works.
* Existing email verification/password reset still works.
* No payment/card data is stored.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.