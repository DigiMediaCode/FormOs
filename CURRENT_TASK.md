# CURRENT TASK — FormOS Milestone 17.1: Branding, SEO Settings, and Public Form Logo Fix

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Forms CRUD works.
* Builder works and has improved UI.
* Public forms work and have improved UI.
* Public form logo exists but placement needs fixing.
* Google Drive and Dropbox uploads work.
* Storage provider selection works.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Super Admin foundation exists.
* Do not touch CommerceOS.

## Goal

Add basic platform branding and SEO settings editable from Super Admin.

Also fix the public form logo placement.

## Problem 1 — Public Form Logo Position

The public form logo is currently showing inside the form title/description section.

It should be placed above everything on the public form page.

Desired public form header order:

1. Logo centered at the very top
2. Form title
3. Form description
4. Form fields

The logo should be slightly bigger than the current size.

If the logo exists, do not show the small text "FORMOS" near it.

If no logo exists, fallback to simple FormOS text branding is acceptable.

## Problem 2 — Missing Platform Settings

Super Admin needs basic platform settings.

Add Super Admin settings page where the platform owner can manage:

* website logo
* favicon
* meta title
* meta description
* site name

These settings should affect the public-facing app where practical.

## Required Admin Route

Create:

* /admin/settings

Add link in Super Admin navigation:

* Settings → /admin/settings

Only SUPER_ADMIN can access this page.

Normal users must not access it.

Logged-out users should redirect to login.

## Platform Settings Model

Add a Prisma model for global platform settings.

Suggested model:

model PlatformSetting {
id        String   @id @default(cuid())
key       String   @unique
value     Json?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

Alternative is acceptable if project already has a settings pattern.

Create migration:

npx prisma migrate dev --name add_platform_settings

Do not use prisma db push.

## Settings To Support

Support these keys:

* siteName
* metaTitle
* metaDescription
* logoUrl
* faviconUrl

For this milestone, logoUrl and faviconUrl can be simple URL/path text inputs.

Do not build file upload manager yet unless already simple.

Acceptable values:

logoUrl:

* /pdf-logo.png
* /formos-logo.png
* https://example.com/logo.png

faviconUrl:

* /favicon.ico
* /favicon.png
* https://example.com/favicon.png

## Super Admin Settings UI

/admin/settings should include a simple form with:

* Site Name
* Meta Title
* Meta Description
* Logo URL / Path
* Favicon URL / Path
* Save Settings button

Show current values.

Show success/error messages.

Use existing pending button UX.

Keep UI simple and clean.

## Applying Settings

Use platform settings where practical:

### Public Form Page

Use logoUrl from platform settings.

If logoUrl exists:

* show logo centered at top of public form page
* make it slightly bigger
* suggested max width: 130px to 170px
* height auto
* do not show "FORMOS" text near it

If logoUrl is missing:

* show fallback FormOS branding text if needed

### App Metadata / SEO

Use metaTitle and metaDescription for app metadata where practical.

If Next.js metadata is static and dynamic implementation is too intrusive, apply basic metadata helper where clean.

Do not over-engineer dynamic SEO in this milestone.

At minimum:

* update layout metadata to use sensible defaults
* create helper to read platform settings for future use if dynamic metadata is not practical everywhere

### Favicon

Use faviconUrl if practical.

If dynamic favicon is too awkward in current Next.js setup, document it and keep static fallback.

Do not break build trying to over-engineer dynamic favicon.

## Settings Helpers

Create helpers such as:

* getPlatformSettings
* updatePlatformSettings
* getPlatformSettingValue

Suggested location:

lib/platform/settings.ts

## Default Settings

If no settings exist, use defaults:

siteName: FormOS
metaTitle: FormOS — Online Form Builder
metaDescription: Create online forms, agreements, and submissions with FormOS.
logoUrl: /pdf-logo.png if it exists, otherwise empty
faviconUrl: /favicon.ico if it exists, otherwise empty

## Security

* Only SUPER_ADMIN can edit platform settings.
* Do not allow normal users to edit global settings.
* Sanitize/validate URL/path inputs.
* Do not allow javascript: URLs.
* Do not expose secrets.
* Do not touch user storage provider credentials.

## Out of Scope

Do not build user-level branding.
Do not build per-form branding.
Do not build logo upload manager.
Do not build media library.
Do not build custom domains.
Do not build subscription settings.
Do not build billing.
Do not change Google Drive or Dropbox logic.
Do not change PDF generation except if it already uses platform logo cleanly.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 17.1 is complete when:

* Public form logo appears above everything.
* Public form logo is centered.
* Public form logo is slightly bigger.
* Public form title appears below the logo.
* Public form description appears below the title.
* Small "FORMOS" text is hidden when logo exists.
* /admin/settings exists.
* Only SUPER_ADMIN can access /admin/settings.
* Super Admin can edit site name.
* Super Admin can edit logo URL/path.
* Super Admin can edit favicon URL/path.
* Super Admin can edit meta title.
* Super Admin can edit meta description.
* Platform settings are persisted in database.
* Public form page uses platform logo setting where available.
* SEO metadata uses platform settings where practical.
* Existing public form submission still works.
* Existing dashboard/admin pages still work.
* Existing QR code feature still works if already implemented.
* npx prisma validate passes.
* npx prisma generate passes.
* Prisma migration exists if schema changed.
* npm run build passes.