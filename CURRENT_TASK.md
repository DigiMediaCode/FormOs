# CURRENT TASK — FormOS Milestone 41: Launch Onboarding Flow

## Current Status

* Conditional Logic / Branching MVP is complete.
* Vertical Workflow Templates v1 is complete.
* Plan-based trials are complete.
* Template landing pages are complete.
* Homepage/pricing positioning alignment is complete.
* Basic analytics is complete.
* Public pages have AdSense support where appropriate.

## Strategic Positioning

FormOS is **the form builder that finishes the job.**

## Goal

Improve onboarding so new users quickly reach their first successful workflow:

choose template → create form → connect storage → publish → submit test response → review submission → finalize/PDF → share/embed.

## Requirements

### 1. Dashboard Welcome Checklist

On `/dashboard`, show onboarding checklist cards for new/early users.

Items:

* Choose a workflow template
* Create your first form
* Connect storage
* Publish your form
* Submit a test response
* Review your first submission
* Generate/finalize PDF where available
* Share your form by link/QR/embed

Each item should show:

* completion status
* short explanation
* CTA button

Use real user data where possible:

* forms count
* published forms count
* submissions count
* storage connection status
* trial/plan status
* analytics counts

### 2. Template Context From Signup

Template landing pages already send logged-out users to signup with template context.

Support query params such as:

`?template=vehicle-hire-agreement`

After signup/login, preserve or use template context where practical.

Preferred:

* show dashboard prompt: `Start with Vehicle Hire Agreement`
* CTA to `/dashboard/forms/new?template=vehicle-hire-agreement`
  or directly start template creation if existing flow supports it safely.

Do not overbuild if auth redirect makes this risky.

### 3. Empty Forms State

On `/dashboard/forms`, if user has no forms:

* show title: `Start with a workflow, not a blank page.`
* show copy explaining templates
* show CTAs:
  * Browse templates
  * Create blank form
* show template cards for the 5 vertical templates

### 4. Form Detail Next Steps

On `/dashboard/forms/[formId]`, show next-step cards based on form state.

If draft:

* Finish builder
* Publish form

If published with no submissions:

* Open public form
* Submit a test response
* Copy link
* Download/share QR
* Embed on website

If published with submissions:

* Review submissions
* Complete office fields
* Generate/finalize PDF if available
* View analytics

### 5. Storage Setup Prompt

If a form contains file upload fields and owner has no active Google Drive/Dropbox storage:

show warning:

`This form collects files. Connect Google Drive or Dropbox before sharing it.`

CTA:

`Connect storage`

Show this on form detail and/or builder where appropriate.

### 6. Trial/Plan Awareness

If user is trialing:

show banner:

`You are on a {PlanName} trial. Trial ends on {date}.`

CTA:

`Manage billing`

If user is Free and a feature is locked:

show subtle upgrade message, not aggressive spam.

### 7. Analytics Empty State

Where analytics summary shows zero views:

show helpful copy:

`No views yet. Share your form link or add it to your website to start collecting responses.`

### 8. AdSense Rule

Do not add AdSense to dashboard/authenticated onboarding pages.

Ads only belong on public marketing/content pages.

### 9. Permissions

Onboarding must respect existing effective limits:

* allowTemplates
* allowGoogleDrive
* allowDropbox
* allowPdfGeneration
* allowQrCode
* allowEmbeds
* allowApiAccess
* allowTeamMembers
* etc.

Do not bypass server-side enforcement.
The UI should guide users but final actions remain protected server-side.

### 10. Design

Use clean modern SaaS dashboard cards.
Keep mobile responsive.
Do not break existing nav.
Do not create huge text walls.

### 11. Existing Flows Must Still Work

* form builder
* template creation
* public forms
* embed route
* WordPress plugin
* Shopify app
* analytics
* billing/trials
* storage integrations
* PDF/finalization

### 12. Commands

Run:

* `npx prisma validate`
* `npx prisma generate`
* `npm run build`

## Return

* files changed
* onboarding checklist logic
* template context support implemented
* empty state updates
* form detail next-step updates
* storage warning logic
* trial banner logic
* confirmation no dashboard AdSense added
* confirmation build passes
