# CURRENT TASK — FormOS Milestone 18: Public Website Redesign + Pricing + Legal Pages

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Forms CRUD works.
* Builder works and has improved UI.
* Public forms work and have improved UI.
* Public form logo and platform branding settings exist.
* QR code feature is already live.
* Google Drive and Dropbox uploads work.
* Storage provider selection works.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Super Admin foundation exists.
* Super Admin settings exist for logo, favicon, meta title, meta description, and site name.
* FlowStep.AI has produced a modern landing page design direction.
* Do not touch CommerceOS.

## Goal

Implement a modern public-facing website for FormOS based on the FlowStep design direction.

This milestone should improve the main public marketing website and add supporting public pages.

The goal is to make FormOS look like a real, polished SaaS product where users can understand the platform and sign up.

## Important Direction

Use the FlowStep design as the visual reference.

Do not redesign dashboard/admin/builder in this milestone unless small branding/header fixes are needed.

Focus on the public website routes:

* /
* /pricing
* /privacy-policy
* /terms-of-service
* /data-security
* /contact

Use Tailwind CSS only.

Do not add a heavy UI library.

Do not change backend workflows.

Do not touch Google Drive, Dropbox, PDF, email, audit, QR, form submission, or subscription logic.

## Page 1 — Landing Page

Update route:

/

Build a polished SaaS landing page with these sections:

### Header / Navigation

Include:

* logo from platform settings if available
* site name fallback if logo is missing
* navigation links:

  * Features
  * Use Cases
  * How It Works
  * Templates
  * Pricing
  * Login
* primary button:

  * Get Started

If user is already logged in, show:

* Dashboard button → /dashboard

Header should be clean, modern, and responsive.

### Hero Section

Headline:

Build forms, agreements, and signed workflows in minutes.

Subheadline:

Create online forms, collect signatures, receive file uploads, complete office-use fields, and send finished PDFs automatically.

Buttons:

* Get Started Free → /signup
* View Demo or Login → /login

Trust note:

No code required. Works with Google Drive and Dropbox.

Hero visual should feel like a modern SaaS product preview.

It can include mock cards such as:

* Agreement.pdf
* Signed & delivered
* dashboard/form preview
* QR/share card
* storage connected badge

Do not use external images unless already available.

Use CSS/Tailwind mockups if needed.

### Features Section

Heading:

Everything you need to collect & sign

Feature cards:

* Visual Form Builder
* eSignatures & Initials
* Drive & Dropbox Uploads
* Office Use Only Fields
* Completed PDF Delivery
* QR Code Sharing
* Activity Timeline
* Templates

Each card should include:

* small icon or simple visual marker
* title
* short description

### Use Cases Section

Heading:

Built for every kind of workflow

Use case cards:

* Vehicle Hire Agreements
* Client Intake Forms
* Consent Forms
* Service Agreements
* Staff Onboarding
* Document Collection

### How It Works Section

Heading:

How it works

Steps:

1. Build your form
2. Share link or QR code
3. Collect signatures & files
4. Complete & send PDF

### Featured Template Section

Highlight:

Vehicle Hire Agreement Template

Include short copy:

A ready-to-use agreement with signature capture, licence uploads, office-use fields, and completed PDF delivery.

Bullets:

* Signature & initials fields included
* Driver licence file upload
* Auto-generated completed PDF

CTA:

Use this template → /signup

### Storage Integration Section

Heading:

Connect your storage

Cards:

* Google Drive
* Dropbox

Explain that uploaded files go to the form owner’s connected storage provider and FormOS does not permanently store uploaded file binaries on its server.

### Pricing Preview Section

Add a small pricing preview on landing page.

Heading:

Simple pricing for growing teams

Show three cards:

* Starter
* Pro
* Business

This is only visual marketing content for now.

Do not implement subscription enforcement in this milestone.

Button:

View Full Pricing → /pricing

### Final CTA

Headline:

Ready to create your first form?

Subheadline:

Build, sign, and deliver professional documents in minutes — no code required.

Button:

Create Free Account → /signup

### Footer

Footer must include:

* logo or site name
* short product description
* product links:

  * Features
  * Use Cases
  * Pricing
  * Login
  * Signup
* legal links:

  * Privacy Policy
  * Terms
  * Data Security
  * Contact

Footer must include:

FormOS is a project of DigiMedia Code LLC.

Also show:

© 2025 FormOS. All rights reserved.

## Page 2 — Pricing Page

Create route:

/pricing

Pricing page should use the same public header/footer as landing page.

### Pricing Hero

Headline:

Simple pricing for forms, agreements, and signed workflows.

Subheadline:

Choose the plan that fits your business. Start small and scale as your workflow grows.

### Pricing Cards

Create three pricing cards.

This is display-only pricing for now.

Do not implement billing.

#### Starter

Price:

$19/month

Description:

Best for individuals and small businesses.

Features:

* Up to 5 forms
* Up to 100 submissions / month
* Public form sharing
* Signatures & initials
* QR code sharing
* Basic templates
* PDF generation

CTA:

Get Started

#### Pro

Price:

$49/month

Description:

Best for growing businesses.

Badge:

Most Popular

Features:

* Up to 25 forms
* Up to 1,000 submissions / month
* Google Drive integration
* Dropbox integration
* Office Use Only fields
* Completed PDF email delivery
* Activity timeline
* Priority support

CTA:

Start Pro

#### Business

Price:

$99/month

Description:

Best for teams and advanced workflows.

Features:

* Unlimited forms
* Up to 10,000 submissions / month
* All Pro features
* Advanced branding
* Team-ready workflows
* Advanced templates
* Better support

CTA:

Start Business or Contact Sales

### Feature Comparison

Add a clean comparison section/table.

Rows:

* Number of forms
* Monthly submissions
* Signature support
* QR code sharing
* PDF generation
* Google Drive integration
* Dropbox integration
* Office Use Only fields
* Branding
* Priority support

### FAQ Section

Add FAQs:

* Can I change plans later?
* Do you offer annual billing?
* Are uploaded files stored on FormOS?
* Can I use Google Drive or Dropbox?
* Do all plans support signed agreements?

### Pricing CTA

Headline:

Start building smarter forms today.

Buttons:

* Get Started Free
* Contact Sales

## Legal Pages

Create these routes:

* /privacy-policy
* /terms-of-service
* /data-security
* /contact

All pages should use the same public header/footer and branding.

Keep legal pages clean and readable.

Use simple but professional placeholder content.

This is not legal advice. Content should be owner-editable later.

### Privacy Policy Page

Include sections about:

* what FormOS is
* account data
* form data and submissions
* uploaded files
* Google Drive and Dropbox storage model
* email notifications
* cookies/session auth
* data retention
* contact

Important message:

Uploaded files may be stored in the form owner’s connected Google Drive or Dropbox. FormOS does not permanently store uploaded file binaries when connected storage is used.

### Terms of Service Page

Include sections about:

* using FormOS
* user responsibilities
* form owner responsibility for form/agreement wording
* no legal advice disclaimer
* uploaded content responsibility
* acceptable use
* account access
* limitation of liability
* changes to service
* contact

### Data Security Page

Include sections about:

* connected storage model
* Google Drive and Dropbox integrations
* file upload handling
* signatures and submissions
* activity timeline
* secure account access
* best practices for form owners
* no public file exposure by default

### Contact Page

Include:

* page title
* support message
* contact email placeholder or text
* small card layout

If there is no real contact email setting yet, use placeholder:

[support@example.com](mailto:support@example.com)

or use platform settings if contact email exists.

Do not create a working contact form unless already simple.

## Shared Public Layout

Create or improve reusable public website components if practical:

* PublicHeader
* PublicFooter
* MarketingSection
* FeatureCard
* PricingCard
* LegalPageLayout

Use platform settings:

* siteName
* logoUrl
* metaTitle
* metaDescription
* faviconUrl where practical

Avoid duplicate code where reasonable.

## Branding Rules

Use Super Admin platform settings where practical:

* logoUrl for header/footer logo
* siteName fallback
* metaTitle/metaDescription for landing metadata where practical

If logo exists, do not show awkward duplicate “FormOS” text beside it unless visually appropriate.

Footer must always include:

FormOS is a project of DigiMedia Code LLC.

## Visual Style

Use the FlowStep design as the visual reference.

Style direction:

* premium modern SaaS
* clean white/off-white background
* blue/indigo accents
* rounded cards
* subtle shadows
* soft borders
* large hero typography
* good spacing
* responsive mobile-first layout
* polished buttons
* implementation-friendly Tailwind

## SEO Metadata

Use platform settings where practical.

Landing page should use:

* metaTitle from settings or fallback
* metaDescription from settings or fallback

Pricing/legal pages should have sensible static metadata if dynamic metadata is not simple.

Do not break build over dynamic metadata.

## Security

Public pages should only read safe platform settings.

Do not expose:

* secrets
* OAuth tokens
* storage credentials
* Super Admin data
* private form/user data

## Out of Scope

Do not build billing.
Do not build subscription enforcement.
Do not build custom domains.
Do not build user-level branding.
Do not build per-form branding.
Do not change dashboard functionality.
Do not change public form submission logic.
Do not change Google Drive/Dropbox logic.
Do not change PDF/email/audit logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 18 is complete when:

* / is redesigned as modern SaaS landing page.
* Landing page has header, hero, features, use cases, how-it-works, featured template, integrations, pricing preview, CTA, and footer.
* /pricing exists and looks modern.
* Pricing page has three pricing cards.
* Pricing page has feature comparison and FAQ.
* /privacy-policy exists.
* /terms-of-service exists.
* /data-security exists.
* /contact exists.
* Public header/footer are consistent.
* Footer includes "FormOS is a project of DigiMedia Code LLC."
* Logo/site name from platform settings is used where practical.
* Landing page and pricing page are mobile responsive.
* Legal pages are clean and readable.
* Existing auth still works.
* Existing dashboard/admin still works.
* Existing public form pages still work.
* Existing QR code feature still works.
* Existing Google Drive/Dropbox upload flow still works.
* Existing PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.