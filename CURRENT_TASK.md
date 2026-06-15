# CURRENT TASK — FormOS Milestone 38: Template Landing Pages

## Strategic Direction

FormOS is positioned as:

**The form builder that finishes the job.**

FormOS is not being marketed as a generic form builder. The launch focus is vertical workflow businesses that need:

* customer intake
* signed agreements
* file uploads
* internal office processing
* finalization
* completed PDFs
* organized storage
* staff review
* WordPress/Shopify embeds

Current completed milestones include:

* Conditional Logic / Branching MVP
* Vertical Workflow Templates v1
* Plan-based free trials
* Stripe billing
* WordPress plugin
* Shopify app/theme extension

## Goal

Create public SEO/marketing landing pages for the new vertical workflow templates.

Each landing page should explain the workflow, show the template value, and push users to start a trial or create the template.

## Pages To Create

Create landing pages for:

1. Vehicle Hire Agreement
2. Equipment Rental Agreement
3. Contractor Job Intake + Waiver
4. Service Booking + Consent Form
5. Photography/Event Booking Agreement

Suggested routes:

* /templates/vehicle-hire-agreement
* /templates/equipment-rental-agreement
* /templates/contractor-job-intake-waiver
* /templates/service-booking-consent-form
* /templates/photography-event-booking-agreement

If /templates route conflicts with existing code, use another clean route, but prefer /templates/[slug].

## Template Listing Page

Create a public template index page:

/templates

This page should show all available workflow templates with:

* category
* template name
* short description
* feature badges
* CTA to view template landing page

Categories:

* Rental & Hire
* Trades & Services
* Booking & Events

## Page Structure

Each template landing page should include:

1. Hero Section

Example:
"Vehicle Hire Agreements Customers Can Complete on Their Phone"

Subheading:
"Collect driver details, licence uploads, signatures, office checks, and completed PDFs in one workflow."

CTA:

* Start free trial
* Use this template
* View demo form if available

2. Problem Section

Explain the manual pain:

* paper forms
* email attachments
* missing signatures
* messy file storage
* no internal processing
* manual PDF creation

3. Workflow Section

Show steps:

Customer completes form
→ uploads files
→ signs agreement
→ staff completes office fields
→ FormOS finalizes PDF
→ files are organized in Drive/Dropbox

4. What This Template Includes

List real fields/features:

* Customer details
* File uploads
* Agreement text
* Signature/initials
* Conditional fields
* Office Use Only fields
* PDF workflow
* Google Drive/Dropbox storage
* QR/embed support

5. Who It Is For

Examples:

* vehicle hire companies
* equipment rental shops
* trade contractors
* service providers
* photographers/event businesses

Use page-specific wording.

6. Feature Badges

Show badges like:

* Signature
* File Uploads
* Conditional Logic
* Office Fields
* PDF Workflow
* Google Drive
* Dropbox
* QR Code
* WordPress Embed
* Shopify Embed

7. Pricing/Trial CTA

Mention:

"Start with a 14-day free trial. No need to build from scratch."

Use dynamic trialDays from platform settings if available.

8. FAQ Section

Add 4–6 FAQs per page.

Examples:

* Can I edit this template?
* Can customers sign on mobile?
* Can uploaded files go to Google Drive?
* Can staff complete internal fields later?
* Can I embed this on WordPress or Shopify?
* Is this legal advice?

Legal safety:
Say the template is a starting point and should be reviewed for each business/jurisdiction.

9. Final CTA

Example:
"Turn your agreement into a complete online workflow today."

Buttons:

* Start free trial
* Create account
* View pricing

## SEO Requirements

Each page should have:

* SEO title
* meta description
* Open Graph title/description
* canonical URL if existing SEO helper supports it
* clean H1
* good internal links to pricing, signup, templates index, relevant pages

Suggested SEO titles:

Vehicle Hire:
"Vehicle Hire Agreement Template Online | FormOS"

Equipment Rental:
"Equipment Rental Agreement Form with Signature | FormOS"

Contractor:
"Contractor Job Intake Form with Waiver | FormOS"

Service Booking:
"Service Booking and Consent Form Template | FormOS"

Photography/Event:
"Photography Booking Agreement Template | FormOS"

## Data Source

Use the existing workflow template catalog from Milestone 37 where practical.

Avoid duplicating template metadata in many places.

Suggested:

* template slug
* title
* category
* description
* feature badges
* landing page copy
* SEO metadata
* CTA labels

If easier, create a separate templateLandingPages config file that references template IDs.

## CTA Behaviour

If user is logged out:

* CTA should go to signup or pricing with template context if available.

If user is logged in:

* CTA should create/use template or go to dashboard/forms/new with template highlighted if simple.

Do not overbuild deep tracking yet.

## Design Requirements

Use modern SaaS styling consistent with FormOS:

* clean hero
* gradient or soft background
* rounded cards
* feature badges
* workflow steps
* strong CTAs
* mobile responsive
* not plain CMS page styling

Do not make these pages look like legal/CMS pages.

## Ads

If public ads are enabled, do not place ads in a way that breaks conversion.

For launch, template landing pages should prioritize conversion over ads.

If ad components are already global, keep them subtle.

## Out of Scope

Do not build template marketplace.
Do not build paid template purchases.
Do not build advanced template preview editor.
Do not build analytics yet.
Do not change Stripe billing flow except CTA links.
Do not rewrite the homepage yet unless necessary.
Do not build more templates in this milestone.

## Acceptance Criteria

Milestone 38 is complete when:

* /templates page exists.
* 5 public template landing pages exist.
* Each page has strong vertical workflow copy.
* Each page has SEO title/meta description.
* Each page links to signup/pricing or template creation flow.
* Pages use modern responsive SaaS styling.
* Pages explain FormOS workflow clearly.
* Pages mention trial dynamically if available.
* Pages include legal-safe template disclaimer.
* Existing dashboard template creation still works.
* Existing public forms still work.
* Existing WordPress/Shopify embeds still work.
* npm run build passes.