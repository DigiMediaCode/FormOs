# CURRENT TASK — FormOS Milestone 31.1: Social Share Image / Open Graph Settings

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Super Admin Settings exist.
* Super Admin can edit site name, logo, favicon, meta title, and meta description.
* CMS Pages, Blog, Knowledge Base, Contact/Support, billing, forms, public forms, storage, PDF, email, and audit features exist.
* Do not touch CommerceOS.

## Goal

Add a Social Share Image / Open Graph Image setting in Super Admin SEO settings.

This image should be used when the FormOS website URL is shared on social platforms such as Facebook, LinkedIn, WhatsApp, X/Twitter, and other apps that read Open Graph metadata.

## User Need

In Super Admin Settings, where Meta Title and Meta Description are configured, add a new field:

* Social Share Image URL / Path

This should control the image used in social previews.

Example:

* /social-share.png
* /og-image.png
* https://example.com/social-share.png

## Important Direction

Do not build a full media manager in this milestone.

Do not build image cropper.

Do not build image upload unless it is already simple and safe.

For MVP, use URL/path input.

If upload is already available and simple, it can be added, but URL/path is enough.

## Settings To Add

Add platform setting:

* socialImageUrl

Display label:

Social Share Image URL / Path

Helper text:

Recommended size: 1200 × 630 px. Used for social sharing previews on platforms like Facebook, LinkedIn, WhatsApp, and X.

## Super Admin UI

Update:

* /admin/settings

In the SEO section, show:

* Meta Title
* Meta Description
* Social Share Image URL / Path

If socialImageUrl exists, show small preview image.

Preview should be safe and not break layout.

## Validation

Validate socialImageUrl:

Allow:

* paths starting with /
* https:// URLs
* http:// URLs only in development if current validation already supports it

Reject:

* javascript: URLs
* data: URLs
* script tags
* HTML
* empty is allowed

Return friendly error if invalid.

## Metadata Application

Use socialImageUrl in public metadata where practical.

Apply to:

* landing page /
* pricing page if exists
* CMS pages if no page-specific image exists
* blog pages if no post-specific image exists
* knowledge base pages if no article-specific image exists

At minimum, apply to the landing page/global metadata.

Metadata should include:

Open Graph:

* og:title
* og:description
* og:image

Twitter/X:

* twitter:card = summary_large_image
* twitter:title
* twitter:description
* twitter:image

Use existing metaTitle and metaDescription settings.

Fallback:

If socialImageUrl is missing, do not break metadata.

If logoUrl exists but socialImageUrl is missing, do not automatically use small logo as og:image unless the implementation already does so safely. Social image should ideally be wide 1200x630.

## Page-Level Future Compatibility

Do not overbuild now, but keep helper structure flexible.

Future pages may have their own social image:

* CMS page social image
* Blog post social image
* Knowledge base article social image

For now, global socialImageUrl is enough.

## Public URL Handling

If socialImageUrl is a relative path like:

/social-share.png

Convert it to absolute URL using APP_URL for metadata:

{APP_URL}/social-share.png

Do not generate metadata with:

* localhost in production
* 127.0.0.1 in production
* 0.0.0.0
* internal Hostinger host

Use existing APP_URL helper.

## Security

* Only SUPER_ADMIN can edit socialImageUrl.
* Do not allow script injection.
* Do not expose secrets.
* Do not allow arbitrary HTML in settings.
* Public pages should only read safe settings.

## Out of Scope

Do not build media library.
Do not build image upload/cropper.
Do not build per-page social image.
Do not build dynamic OG image generator.
Do not change billing, forms, storage, PDF, email, or audit logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 31.1 is complete when:

* Super Admin Settings has Social Share Image URL / Path field.
* Social image field appears in SEO section.
* Social image setting persists.
* Social image preview appears if configured.
* Invalid unsafe URLs are rejected.
* Landing page metadata uses socialImageUrl for Open Graph image.
* Landing page metadata uses socialImageUrl for Twitter image.
* Relative social image paths are converted to absolute URLs using APP_URL.
* Metadata does not use localhost/0.0.0.0 in production.
* Existing meta title/description still work.
* Existing favicon/logo settings still work.
* Existing public pages still build.
* Existing dashboard/admin still work.
* Existing forms/billing/storage/PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
