# CURRENT TASK — FormOS Milestone 39: Pricing + Homepage Positioning Alignment

## Strategic Direction

FormOS is now positioned as:

**The form builder that finishes the job.**

FormOS should not be marketed as a generic form builder competing directly with JotForm, Tally, Typeform, or Fillout.

The launch market is businesses that need:

* customer intake
* signed agreements
* file uploads
* internal office processing
* finalization
* completed PDFs
* organized storage
* staff review
* WordPress/Shopify embeds

Completed launch milestones:

* Conditional Logic / Branching MVP
* Vertical Workflow Templates v1
* Plan-based free trials
* Template landing pages
* WordPress plugin
* Shopify app/theme extension

## Goal

Update the public homepage and pricing presentation so FormOS clearly sells workflow value instead of generic form-builder features.

This milestone should align:

* homepage messaging
* public pricing page
* landing page CTAs
* plan names/descriptions
* trial messaging
* template workflow positioning

## Pricing Strategy

Use this pricing direction unless existing plan architecture requires minor adjustment.

### Free — $0/month

Purpose:
Lead magnet and trial entry point.

Include:

* 1 form
* 25 submissions/month
* basic fields
* QR code
* website/embed sharing
* FormOS branding/ads
* no advanced workflow features

### Starter — AUD $19/month

Purpose:
Small businesses starting with simple workflows.

Include:

* 5 forms
* 500 submissions/month
* Google Drive
* PDF generation
* templates
* ad-free forms
* basic workflow features

### Pro — AUD $45/month

Purpose:
Main money plan.

Include:

* unlimited forms
* 2,500 submissions/month
* Google Drive + Dropbox
* Office Use Only fields
* finalization workflow
* all field types
* conditional logic
* API access
* custom branding

### Business — AUD $89/month

Purpose:
Teams and higher-volume businesses.

Include:

* high volume submissions
* 3–5 staff seats
* all integrations
* advanced workflow features
* priority support
* business branding
* higher quotas

### Enterprise — From AUD $199/month

Purpose:
Custom workflows and high-volume clients.

Include:

* custom limits
* white-label/custom branding
* dedicated support
* custom workflow setup
* custom overrides

## Important Pricing Note

Do not silently change Stripe live prices if that is risky.

If Stripe sync already exists, update FormOS plan records and allow the existing Stripe sync system to create/update prices safely.

If the current system requires Super Admin to manually sync plans to Stripe, do not force Stripe sync automatically.

## Trial Messaging

Use dynamic platform trialDays setting.

Examples:

* “Start your 14-day free trial”
* “Try any paid plan free for 14 days”
* “Free plan available forever”

Do not say “free forever” for paid plans.

## Homepage Messaging

Update homepage hero from generic form-builder language to workflow positioning.

Suggested hero:

Title:
Forms that collect, sign, file, and finish the job.

Subtitle:
FormOS helps businesses turn intake forms, agreements, uploads, signatures, and internal office checks into completed PDF workflows.

Primary CTA:
Start free trial

Secondary CTA:
Explore templates

Hero badges:

* Signatures
* File uploads
* Office Use Only fields
* Completed PDFs
* Google Drive & Dropbox
* WordPress & Shopify embeds

## Homepage Sections

Homepage should include:

1. Hero

Clear workflow positioning.

2. Problem Section

Manual forms are messy:

* paper agreements
* email attachments
* missing signatures
* manual filing
* staff notes scattered everywhere
* PDFs created by hand

3. Workflow Section

Show:

Customer fills form
→ uploads files
→ signs agreement
→ staff completes office fields
→ FormOS finalizes PDF
→ files are stored in Drive/Dropbox

4. Template Section

Feature the 5 vertical templates:

* Vehicle Hire Agreement
* Equipment Rental Agreement
* Contractor Job Intake + Waiver
* Service Booking + Consent
* Photography/Event Booking Agreement

CTA:
Explore templates

5. Integrations Section

Mention:

* Google Drive
* Dropbox
* WordPress
* Shopify
* Stripe
* Lark email if useful

6. Pricing Preview

Show pricing cards with dynamic trial days.

7. Final CTA

“Stop rebuilding the same workflow manually.”

Buttons:

* Start free trial
* View templates

## Pricing Page Updates

Pricing page should clearly communicate workflow value.

Each plan card should show:

* price
* dynamic trial CTA
* ideal customer
* included features
* template/workflow capability
* limits

Use plan descriptions:

Free:
“For testing one simple workflow.”

Starter:
“For small businesses moving away from paper forms.”

Pro:
“For businesses that need signatures, uploads, office review, and completed PDFs.”

Business:
“For teams managing higher-volume form workflows.”

Enterprise:
“For custom workflows and white-label requirements.”

## Plan Limits Alignment

Update default plan limits if needed to match the pricing strategy.

Suggested:

Free:

* maxForms: 1
* maxMonthlySubmissions: 25
* allowTemplates: false or limited if current trial covers paid plan access
* allowPdfGeneration: false
* allowOfficeUseFields: false
* allowConditionalLogic: false
* allowGoogleDrive: false
* allowDropbox: false
* allowCustomBranding: false
* allowTeamMembers: false
* allowEmbeds: true
* allowQrCode: true
* allowAdFreeForms: false

Starter:

* maxForms: 5
* maxMonthlySubmissions: 500
* allowTemplates: true
* allowPdfGeneration: true
* allowGoogleDrive: true
* allowDropbox: false
* allowOfficeUseFields: false or limited false
* allowConditionalLogic: false or limited based on current product decision
* allowEmbeds: true
* allowQrCode: true
* allowAdFreeForms: true

Pro:

* maxForms: null/unlimited
* maxMonthlySubmissions: 2500
* allowTemplates: true
* allowPdfGeneration: true
* allowGoogleDrive: true
* allowDropbox: true
* allowOfficeUseFields: true
* allowConditionalLogic: true
* maxConditionalRules: null
* allowApiAccess: true
* allowCustomBranding: true
* allowedFieldTypes: all

Business:

* maxForms: null
* maxMonthlySubmissions: 10000 or higher
* allowTeamMembers: true
* maxTeamMembers: 5
* all major workflow/integration features enabled

Enterprise:

* custom/manual

Do not break existing active users. If changing defaults, make sure existing plan records are handled safely.

## Template Links

Homepage and pricing should link to:

* /templates
* /templates/vehicle-hire-agreement
* /templates/equipment-rental-agreement
* /templates/contractor-job-intake-waiver
* /templates/service-booking-consent-form
* /templates/photography-event-booking-agreement

## SEO

Homepage metadata should reflect new positioning.

Suggested title:
FormOS — Forms, Signatures, Uploads & PDF Workflows

Suggested description:
Create online forms that collect signatures, file uploads, office-only details, and completed PDFs. Built for rental, service, contractor, and booking workflows.

## Out of Scope

Do not build analytics yet.
Do not build new templates.
Do not build public template marketplace.
Do not build conditional logic v2.
Do not rebuild the full design system.
Do not change plugin functionality.
Do not change Shopify app functionality.
Do not break CMS/blog/help pages.

## Acceptance Criteria

Complete when:

* Homepage clearly uses workflow positioning.
* Homepage links to templates.
* Pricing page uses updated plan framing.
* Pricing cards show dynamic trial days.
* Public copy no longer feels like a generic form builder.
* Default plan limits are aligned if safe.
* Existing Stripe sync flow is respected.
* Template landing pages still work.
* Signup/pricing CTA paths still work.
* WordPress/Shopify embeds are not affected.
* npm run build passes.
