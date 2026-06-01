# CURRENT TASK — FormOS Milestone 18: Landing Page + Global Branding Application

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Forms CRUD works.
* Builder works.
* Public forms work.
* Public form logo and branding settings exist.
* Super Admin settings exist for logo, favicon, meta title, meta description, and site name.
* QR code feature is already live.
* Google Drive and Dropbox uploads work.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Do not touch CommerceOS.

## Problem

The platform branding settings exist, but the logo/favicon/site branding are not consistently visible across the public site, dashboard, admin, auth pages, and landing page.

The current website landing page is too basic and does not make FormOS look like a modern SaaS product.

Before subscriptions/packages, FormOS needs a professional landing page where visitors can understand the product and register/sign up.

## Goal

Create a modern, attractive landing page for FormOS and apply global branding settings consistently across the app.

The landing page should help users understand FormOS quickly and encourage them to sign up.

## Main Route

Update:

* /

This should become the public marketing landing page.

## Landing Page Requirements

Create a modern SaaS landing page with these sections:

### 1. Header / Navigation

Show:

* platform logo from Super Admin settings if available
* site name if logo is missing
* navigation links:

  * Features
  * Use Cases
  * How It Works
  * Login
  * Get Started

Buttons:

* Login → /login
* Get Started → /signup

If user is already logged in, show:

* Dashboard → /dashboard

### 2. Hero Section

Create a strong hero section.

Suggested headline:

Build forms, agreements, and signed workflows in minutes.

Suggested subheadline:

FormOS helps businesses create online forms, collect signatures, receive file uploads, complete office-use fields, and send finished PDFs automatically.

Primary button:

Get Started Free → /signup

Secondary button:

Login → /login

Optional small trust text:

No code required. Works with Google Drive and Dropbox.

### 3. Feature Cards

Show key features:

* Form Builder
* eSignatures and Initials
* File Uploads to Google Drive or Dropbox
* Office Use Only Fields
* Completed PDF Delivery
* QR Code Form Sharing
* Activity Timeline
* Templates

Keep text short and clean.

### 4. Use Cases

Show use cases:

* Vehicle hire agreements
* Client intake forms
* Consent forms
* Service agreements
* Onboarding forms
* Document collection forms

### 5. How It Works

Show 3 or 4 steps:

1. Create your form
2. Share link or QR code
3. Collect signatures and documents
4. Complete office fields and send PDF

### 6. Call To Action

Final CTA section:

Ready to create your first form?

Button:

Create Free Account → /signup

### 7. Footer

Footer should show:

* logo or site name
* short description
* copyright
* links:

  * Login
  * Signup

## Visual Style

Use a modern SaaS look.

Direction:

* clean white/light background
* soft gradient or subtle background accents
* large hero typography
* rounded cards
* subtle shadows
* good spacing
* modern buttons
* responsive design
* mobile-friendly layout

Do not use a heavy UI library.

Use Tailwind only.

## Global Branding Application

Use platform settings from Super Admin:

* siteName
* logoUrl
* faviconUrl
* metaTitle
* metaDescription

Apply branding where practical:

### Landing Page

* logo in header
* siteName fallback
* meta title/description

### Auth Pages

* login page should show logo/site name
* signup page should show logo/site name
* favicon should apply globally if practical

### Dashboard

* dashboard header/sidebar should use logo/site name where practical
* if logo exists, show it instead of hardcoded FormOS text where appropriate
* avoid duplicate logo + "FORMOS" text if logo exists

### Admin

* admin layout/header should use logo/site name where practical
* do not confuse admin branding with public form owner branding

### Public Forms

* logo should appear above everything
* title should appear below logo
* if logo exists, do not show small "FORMOS" text next to it

## Favicon

Use faviconUrl from platform settings if practical.

If dynamic favicon is difficult in the current Next.js setup:

* keep static favicon fallback
* document limitation
* do not break build

## SEO Metadata

Use metaTitle and metaDescription from platform settings where practical.

At minimum:

* landing page should use configured metadata
* fallback to sensible defaults if settings are missing

Defaults:

siteName: FormOS
metaTitle: FormOS — Online Form Builder
metaDescription: Create online forms, agreements, signatures, file uploads, and completed PDFs with FormOS.

## Technical Notes

Suggested helpers:

* getPlatformSettings
* getPlatformBranding
* getPlatformMetadata

Reuse existing platform settings helpers if already created.

Do not duplicate settings logic.

## Security

* Public landing page can read safe platform settings only.
* Do not expose secrets.
* Do not expose OAuth tokens.
* Do not expose storage credentials.
* Do not expose Super Admin-only data.

## Out of Scope

Do not build pricing/packages yet.
Do not build billing.
Do not build subscription limits.
Do not build custom domain support.
Do not build user-level branding.
Do not build per-form branding settings.
Do not change Google Drive or Dropbox logic.
Do not change PDF generation.
Do not change Office Use Only logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 18 is complete when:

* / is a modern landing page.
* Landing page has header, hero, features, use cases, how-it-works, CTA, and footer.
* Landing page has Login and Get Started buttons.
* Logged-in users can access Dashboard from landing page.
* Platform logo appears on landing page if configured.
* Site name appears if logo is missing.
* Auth pages show platform logo/site name.
* Dashboard/admin branding uses platform logo/site name where practical.
* Public forms show logo above everything.
* Small "FORMOS" text is hidden when logo exists.
* Meta title and meta description use platform settings where practical.
* Favicon uses platform setting where practical or gracefully falls back.
* Page is responsive/mobile-friendly.
* Existing auth still works.
* Existing forms/dashboard/admin still work.
* Existing public form submission still works.
* Existing QR code feature still works.
* Existing Google Drive/Dropbox upload flow still works.
* Existing PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.