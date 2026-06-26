# FormOS System Functionality Overview

## Purpose

This document explains the complete FormOS system in one place. It covers the main product concept, user roles, modules, workflows, integrations, plan controls, admin controls, security posture, and current limitations.

FormOS is positioned as:

> The form builder that finishes the job.

It is not only a tool for collecting form answers. FormOS is designed for business workflows where a customer submits information, uploads files, signs agreements, staff complete internal fields, files are organized, and a completed PDF record can be generated.

---

## 1. Product Summary

FormOS is a standalone SaaS-style workflow form builder.

It helps businesses:

- create online forms and agreements
- collect public submissions
- collect signatures and initials
- collect file uploads
- route uploads to Google Drive or Dropbox
- add internal Office Use Only fields
- generate completed PDF records
- share forms by public link, QR code, embed widget, WordPress, or Shopify
- manage submissions from a dashboard
- invite staff to help process forms
- manage plans, limits, trials, billing, and platform settings through Super Admin

The product is aimed at workflow-heavy businesses such as:

- vehicle hire
- equipment rental
- trade contractors
- service booking businesses
- photographers and event businesses
- small businesses replacing paper forms, PDFs, email attachments, and manual file handling

---

## 2. Core Workflow

A typical FormOS workflow is:

1. Owner creates a form from a template or blank form.
2. Owner configures public fields, uploads, signatures, conditional logic, and office-only fields.
3. Owner connects Google Drive or Dropbox if the form collects files.
4. Owner publishes the form.
5. Owner shares the form by link, QR code, embed, WordPress, or Shopify.
6. Public user submits the form.
7. FormOS validates the submission server-side.
8. Uploaded files are routed to the configured storage provider.
9. Owner or staff review the submission in the dashboard.
10. Staff complete Office Use Only fields where required.
11. FormOS can generate and/or email a completed PDF record.
12. Analytics track views, submissions, completion rate, and source.

---

## 3. User Roles

### Public Visitor / Form Submitter

Can:

- view published public forms
- complete public fields
- upload files where fields allow
- draw signatures or initials
- submit forms

Cannot:

- access dashboard
- see office-only fields
- see owner storage settings
- see owner private data
- access uploaded files directly unless explicitly exposed by the form workflow

### Workspace Owner

Can:

- manage their dashboard
- create and manage forms
- use templates where plan allows
- publish/unpublish/archive forms
- view and process submissions
- complete office fields
- generate PDFs where plan allows
- connect storage providers where plan allows
- manage billing
- manage integrations
- manage branding
- manage API tokens where plan allows
- invite team members where plan allows
- configure form-specific notification recipients where plan allows

### Workspace Admin

Can:

- access workspace forms and submissions where intended
- help process form workflows
- use builder/submission areas where permissions allow

Cannot:

- access owner-only billing controls
- access owner-only integrations
- manage team ownership controls unless explicitly allowed
- access Super Admin

### Workspace Staff

Can:

- access allowed workspace forms/submissions
- help review and process submissions

Cannot:

- access billing
- access integrations
- access team management
- access owner private business settings
- access Super Admin

### Super Admin

Can:

- manage platform users
- suspend users
- manage plans and quotas
- manage platform settings
- manage CMS pages
- manage blog posts
- manage knowledge base
- manage support requests
- manage email templates and broadcasts
- inspect form summaries
- manage high-level form actions
- configure AdSense settings
- view billing events

Super Admin should not be marketed as a customer feature. It is the platform operations layer.

---

## 4. Authentication and Account System

FormOS supports:

- email/password signup and login
- password hashing
- email verification
- password reset
- Google OAuth login
- Lark OAuth login
- email login code / two-step login verification
- account suspension handling
- safe login and reset messaging

Important behavior:

- password reset and verification tokens are stored as hashes
- login verification codes are sent by email
- users cannot access dashboard areas without authentication
- suspended accounts are blocked from normal dashboard use

---

## 5. Dashboard

The user dashboard provides:

- analytics summary
- recent submissions
- recent forms
- quick actions
- onboarding/setup checklist
- trial/payment status prompts
- storage/connectivity warnings where relevant
- responsive mobile navigation

Primary dashboard actions:

- create form
- create from template
- view submissions
- open integrations/settings
- access forms list

The dashboard is intentionally operational. It is not a marketing page and does not contain AdSense placements.

---

## 6. Onboarding

FormOS includes launch onboarding to guide new users toward a working workflow.

Checklist items include:

- choose a workflow template
- create first form
- connect storage
- publish form
- submit a test response
- review first submission
- generate/finalize PDF where available
- share form by link, QR, or embed

The checklist uses real user data where practical, including:

- forms count
- published forms count
- submissions count
- storage connection status
- trial/plan status
- analytics counts

On mobile, onboarding is shown as a step-by-step popup rather than a large permanent card.

---

## 7. Forms Module

The forms module allows owners to create and manage workflow forms.

Form actions include:

- create blank form
- create from template
- edit basic form details
- open builder
- publish form
- unpublish form
- archive form
- view public form
- view QR code
- open widget/embed page
- view analytics
- view submissions
- configure PDF delivery behavior
- configure custom submission notification recipient where plan allows

Form status values include:

- draft
- published
- archived

Only published forms are available publicly.

---

## 8. Form Builder

The builder is used to configure form fields and workflow structure.

Core builder functionality:

- drag and drop fields into the form
- reorder fields
- collapse and expand field cards
- edit field label
- edit placeholder
- set required status
- mark fields as Office Use Only
- configure field options for choice fields
- configure conditional visibility where plan allows
- save builder fields
- preview form structure

The builder is desktop-oriented. On mobile, users are shown a message asking them to use desktop for editing.

---

## 9. Field Types

Implemented field types include:

- text
- long text
- email
- phone
- address
- date
- number
- currency
- dropdown/select
- checkbox with options
- file/image upload
- signature
- initials
- static text
- section heading
- HTML/static content

Field type access can be controlled by plan limits.

---

## 10. Conditional Logic

FormOS supports conditional visibility for fields.

Typical use:

- show additional driver fields if user selects additional driver
- show urgent details if request is urgent
- show other-service text field if user selects Other
- show access instructions based on access answer

Conditional logic is controlled by plan limits:

- `allowConditionalLogic`
- `maxConditionalRules`

Conditional logic is intended as an MVP field visibility system, not a full workflow automation engine.

---

## 11. Templates

FormOS includes vertical workflow templates.

Current core templates:

- Vehicle Hire Agreement
- Equipment Rental Agreement
- Contractor Job Intake + Waiver
- Service Booking + Consent Form
- Photography/Event Booking Agreement

Template categories:

- Rental & Hire
- Trades & Services
- Booking & Events

Templates are designed to be practical starting points and may include:

- customer details
- rental or booking details
- agreement text
- acknowledgements
- upload fields
- signature or initials
- conditional logic
- Office Use Only fields

Templates are not legal advice. Businesses should review template wording before using it with customers.

Template access is controlled by:

- `allowTemplates`
- `allowedFieldTypes`
- other relevant feature limits

---

## 12. Public Forms

Public forms are accessible through public URLs for published forms.

Public form behavior:

- only published forms can be submitted
- draft and archived forms are unavailable
- office-only fields are hidden
- display/static fields render safely
- server-side validation is enforced
- upload fields follow server-side file rules
- duplicate/unsafe submission behavior is reduced where practical
- form data is preserved on validation errors where practical

Public forms are mobile-friendly and are intended for customer use.

---

## 13. Submissions

The submissions module stores and displays form responses.

Submission functionality:

- list submissions for a form
- view individual submission detail
- show submitter identity where available
- show submitted answers
- show uploaded file metadata
- show signature/initials data
- show office-only processing section
- show activity timeline
- show PDF/finalization actions where available
- show status

Submission access is protected by workspace ownership and staff permissions.

Public users cannot access dashboard submissions.

---

## 14. Office Use Only Fields

Office Use Only fields allow owners/staff to complete internal data after a public submission.

Examples:

- assigned vehicle
- registration number
- odometer
- bond amount
- inspection notes
- assigned contractor
- quote amount
- booking status
- internal risk notes
- payment/deposit status

These fields are:

- hidden from public form submitters
- visible in dashboard processing areas
- useful for finalized PDF records

Controlled by:

- `allowOfficeUseFields`

---

## 15. Signature and Initials

FormOS supports:

- signature fields
- initials fields
- mobile finger drawing
- desktop mouse drawing
- clear/reset behavior

These are useful for:

- agreements
- waivers
- consent forms
- acknowledgements

Legal note:

FormOS provides signature capture as a workflow feature. It should not be described as guaranteeing legal enforceability in every jurisdiction.

---

## 16. File Uploads

File upload functionality includes:

- public file upload fields
- server-side MIME validation
- file size validation
- upload status tracking
- metadata storage
- routing to connected storage provider

Common upload use cases:

- driver licence
- ID documents
- job photos
- reference images
- event mood boards
- signed supporting files

FormOS does not use file upload fields as permanent local binary storage for customer submission files. Files are intended to be routed to connected storage integrations.

---

## 17. Google Drive Integration

Google Drive integration allows form owners to store uploaded files and generated documents in their own Google Drive.

Functionality:

- connect Google Drive
- store OAuth connection securely server-side
- route uploaded files to Drive
- store limited metadata in FormOS
- disconnect integration

Privacy behavior:

- OAuth tokens are not exposed to public users
- public submitters cannot choose or access owner Drive destinations
- files already stored in Google Drive remain under the Drive owner's control

Controlled by:

- `allowGoogleDrive`

---

## 18. Dropbox Integration

Dropbox integration allows form owners to store uploaded files in Dropbox.

Functionality:

- connect Dropbox
- select or use controlled storage path
- upload files to Dropbox
- prevent path traversal
- store limited file metadata
- disconnect integration

Controlled by:

- `allowDropbox`

---

## 19. PDF Generation and Finalization

PDF functionality allows workflows to become completed records.

Functionality includes:

- generate completed PDF records
- include public answers
- include office-only data where relevant
- include signature/initials where relevant
- support download/completed PDF actions
- support email delivery behavior where configured

Controlled by:

- `allowPdfGeneration`

PDF generation is part of the "finishes the job" positioning.

---

## 20. Email Notifications

FormOS includes email notification infrastructure.

Functionality:

- Lark email provider support
- email templates
- rich HTML editor
- media library support
- template variables
- login/security notification emails
- support request notification emails
- billing/payment failure notification emails
- broadcast email system
- broadcast analytics/details

Broadcast targeting supports:

- all active users
- selected users
- package/plan groups
- manually entered email addresses

Email template variables are intended to be broadly available across templates where relevant.

---

## 21. Media Library

FormOS includes a media library for admin-created content and email/page assets.

Functionality:

- upload media
- insert media into rich HTML content
- use media in email templates
- use media in CMS/page content where supported
- delete media
- serve media through controlled media routes

This media library is separate from customer form upload storage.

Customer form uploads are intended to go to owner-connected storage providers.

---

## 22. Activity and Audit Timeline

FormOS records key operational events around forms and submissions.

Useful events include:

- submission received
- files uploaded
- signature captured
- office fields saved
- submission finalized
- PDF generated
- PDF emailed

The activity timeline helps owners understand what happened in a workflow.

---

## 23. QR Codes

QR functionality allows owners to share public forms offline.

Use cases:

- front desk check-in
- vehicle pickup counter
- printed flyer
- signage
- service van
- workshop

Controlled by:

- `allowQrCode`

---

## 24. Embed and Widget System

FormOS supports embedding forms into external websites.

Functionality:

- dedicated embed route
- iframe embed
- JavaScript embed
- auto-height support
- widget appearance settings
- theme options
- accent color
- background options
- border radius
- compact mode
- font style
- copyable embed code

Embedded forms:

- follow the same server-side validation as public forms
- respect plan limits
- hide office-only fields
- can submit normally
- can track source as embed where relevant

Controlled by:

- `allowEmbeds`

---

## 25. WordPress Plugin

FormOS includes a separate WordPress plugin project.

Functionality:

- WordPress settings page
- FormOS base URL setting
- shortcode support
- form ID support
- height and appearance options
- auto-height script option
- API connection/form selection support where implemented

Typical shortcode:

```text
[formos_form id="FORM_ID"]
```

The plugin is separate from the FormOS web app runtime.

---

## 26. Shopify Integration

FormOS includes a separate Shopify integration/theme extension project.

Functionality:

- theme app extension block
- FormOS Form app block
- merchant enters FormOS base URL and form ID
- iframe render to FormOS embed route
- appearance query parameters
- Shopify admin UI work exists for FormOS connection experience

Current scope:

- embed forms into Shopify storefronts
- no Shopify billing
- no product/customer/order sync
- no FormOS submissions stored in Shopify

This should be treated as an embed integration, not a full Shopify app marketplace product yet.

---

## 27. API Tokens and External API

FormOS supports API tokens for external access where plan allows.

Functionality:

- create API tokens
- external forms endpoint
- use API token to list forms for integrations such as WordPress/Shopify

Controlled by:

- `allowApiAccess`

Security behavior:

- API tokens should not be exposed publicly
- integrations should use tokens server-side or in trusted admin contexts where possible

---

## 28. Basic Analytics

Analytics functionality includes:

- form views
- submissions
- completion rate
- source breakdown
- top performing form
- dashboard analytics summary
- form detail analytics summary

Sources may include:

- public form
- embed
- WordPress
- Shopify
- unknown

Privacy behavior:

- analytics do not store submitted answers
- raw IP should not be stored directly
- users can only access their own analytics

Controlled by:

- `allowBasicAnalytics`

---

## 29. Billing, Plans, Trials, and Quotas

FormOS includes dynamic plan and billing infrastructure.

Billing provider:

- Stripe

Billing functionality:

- Stripe Checkout
- Stripe Customer Portal
- subscription creation
- subscription cancellation/resume handling
- webhook processing
- billing event logs
- trial support
- failed payment handling
- restore plan modal after payment failure

Plan functionality:

- Free, Starter, Pro, Business defaults
- Super Admin plan management
- create/edit/deactivate plans
- Stripe price/product IDs
- plan limits
- quota overrides per user
- trial settings

Plan-based trials:

- paid plans can have trial days
- trialing users receive selected paid plan limits
- trial usage is tracked to avoid unlimited repeat trials
- failed/cancelled/unpaid subscriptions fall back to Free limits where appropriate

Important:

Existing forms/submissions are not automatically deleted when a user downgrades. Premium actions become locked based on effective limits.

---

## 30. Plan Limits

Implemented plan/limit keys include:

| Limit Key | Purpose |
| --- | --- |
| `maxForms` | Maximum number of forms/workflows. |
| `maxMonthlySubmissions` | Monthly submission allowance. |
| `allowGoogleDrive` | Enables Google Drive storage. |
| `allowDropbox` | Enables Dropbox storage. |
| `allowPdfGeneration` | Enables PDF generation/finalization. |
| `allowOfficeUseFields` | Enables internal office-only fields. |
| `allowTemplates` | Enables workflow templates. |
| `allowQrCode` | Enables QR code sharing. |
| `allowCustomBranding` | Enables owner/workspace branding. |
| `allowTeamMembers` | Enables staff/team invitations. |
| `allowAdFreeForms` | Removes ads from public forms when ads are enabled. |
| `allowEmbeds` | Enables iframe/JS/embed widget. |
| `allowApiAccess` | Enables API tokens/external API access. |
| `allowConditionalLogic` | Enables conditional field visibility. |
| `allowBasicAnalytics` | Enables basic analytics. |
| `allowCustomSubmissionNotifications` | Enables custom submission notification recipients. |
| `maxTeamMembers` | Maximum team members. |
| `maxConditionalRules` | Maximum conditional logic rules. |
| `allowedFieldTypes` | Controls available form field types. |

Plan permissions are enforced through effective limits and should not be treated as UI-only marketing labels.

---

## 31. Workspace and Staff Access

Workspace functionality includes:

- workspace owner
- workspace admin/staff roles
- staff invite flow
- staff access to forms/submissions where allowed
- owner-only billing/integrations/team controls

Security behavior:

- staff cannot access another workspace
- staff cannot access billing/integration/team management
- workspace ownership is checked server-side
- forms remain owner-based and are not migrated to workspace ID

---

## 32. Super Admin

Super Admin is the platform operations interface.

Modules include:

- dashboard overview
- users
- forms
- plans
- billing events
- platform settings
- CMS pages
- blog
- knowledge base
- support requests
- email notifications
- broadcasts
- media

Super Admin can:

- view user summaries
- suspend users
- safely manage users
- view form summaries
- archive/delete forms where safe
- manage plans and quotas
- manage platform SEO/branding/settings
- configure AdSense
- manage support tickets
- manage public content
- manage email content

Super Admin must not expose private submission answers or uploaded file contents unless intentionally implemented for support in the future.

---

## 33. CMS Pages

FormOS includes CMS page management.

Functionality:

- create/edit CMS pages
- page builder blocks
- publish/archive pages
- menu/footer visibility
- safe HTML rendering
- legal pages

Important public pages:

- Privacy Policy
- Terms of Service
- Data Security
- Contact

CMS pages are rendered with legal/public content styling where relevant.

---

## 34. Blog

FormOS includes a blog system.

Functionality:

- blog post model
- blog categories
- admin blog list
- create/edit/publish/archive posts
- public blog listing
- public blog detail pages
- SEO metadata
- safe content rendering

Public routes:

- `/blog`
- `/blog/[slug]`

Use cases:

- SEO content
- product education
- tutorials
- announcements
- workflow guides

---

## 35. Knowledge Base / Help Center

FormOS includes a knowledge base system.

Functionality:

- help center home
- categories
- articles
- search
- featured/popular articles
- public article pages
- Super Admin article/category management
- Contact Us CTA

Public routes:

- `/help`
- `/help/[categorySlug]`
- `/help/[categorySlug]/[articleSlug]`

Use cases:

- support documentation
- FAQ answers
- setup guides
- troubleshooting
- billing/account help

---

## 36. Support / Contact Requests

FormOS includes a support request system.

Public functionality:

- `/contact` page
- support request form
- categories such as billing, technical issue, account/login, form builder help, storage, other
- validation
- email notification to support/admin

Admin functionality:

- list support requests
- view request detail
- update status
- update priority
- add admin notes
- reply to user where reply flow is available

Status values:

- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

---

## 37. Public Website and SEO

Public website modules include:

- homepage
- pricing page
- template index
- template landing pages
- blog
- help center
- legal pages
- contact page

SEO/platform settings include:

- site name
- meta title
- meta description
- social share image
- logo
- favicon
- legal URLs
- company/footer settings

Open Graph and Twitter metadata can use the configured social image.

---

## 38. AdSense and Public Ads

FormOS includes AdSense integration but ads should remain disabled until approval.

AdSense settings include:

- ads enabled
- show landing page ads
- show public form ads
- AdSense client ID
- landing ad slots
- public form ad slot
- public form ad frequency
- ad label

Current policy:

- ads are backend-ready
- ads default to disabled
- no ads in dashboard/admin/auth/checkout
- no ads near public form submit controls
- no blank gaps when disabled

Documentation note:

Google may reject low-value SaaS/product sites until enough unique public content exists. Add more useful blog/help/template content before requesting review again.

---

## 39. Security Features

Security-related functionality includes:

- centralized auth/permission helpers
- authenticated dashboard access
- Super Admin role protection
- workspace/staff access checks
- owner-only billing/integration/team controls
- server-side form permission checks
- server-side submission validation
- password hashing
- hashed reset/verification tokens
- one-time/expiring verification and reset flows
- OAuth state validation
- Google/Lark OAuth handling
- Stripe webhook signature verification
- Stripe webhook idempotency protections
- file type and size validation
- storage token protection
- API token controls
- safe error handling
- sensitive logging review
- security headers
- legal/privacy/data security pages

Important:

Security should be described honestly. Do not claim SOC 2, ISO 27001, HIPAA, or GDPR certification unless formally achieved.

---

## 40. Legal and Privacy

Public legal/privacy support includes:

- Privacy Policy
- Terms of Service
- Data Security page
- Google user data and Google Drive integration disclosure
- Dropbox/storage disclosure
- website/WordPress/Shopify integration disclosure
- contact email normalization

Privacy Policy includes:

- what data FormOS collects
- how Google Drive data is accessed and used
- what FormOS does not do with Google user data
- storage and retention
- user control and revocation
- data protection explanation

---

## 41. Current Public Routes

Important public routes include:

- `/`
- `/pricing`
- `/templates`
- `/templates/[slug]`
- `/blog`
- `/blog/[slug]`
- `/help`
- `/help/[categorySlug]`
- `/help/[categorySlug]/[articleSlug]`
- `/contact`
- `/privacy-policy`
- `/terms-of-service`
- `/data-security`
- `/p/[slug]`
- `/f/[formSlug]`
- `/embed/forms/[formId]`
- `/embed.js`
- `/media/[assetId]`
- `/ads.txt`
- `/robots.txt`
- `/sitemap.xml`

---

## 42. Important Dashboard Routes

Important authenticated routes include:

- `/dashboard`
- `/dashboard/forms`
- `/dashboard/forms/new`
- `/dashboard/forms/[formId]`
- `/dashboard/forms/[formId]/builder`
- `/dashboard/forms/[formId]/submissions`
- `/dashboard/forms/[formId]/submissions/[submissionId]`
- `/dashboard/forms/[formId]/submissions/[submissionId]/completed-pdf`
- `/dashboard/widgets`
- `/dashboard/settings/profile`
- `/dashboard/settings/billing`
- `/dashboard/settings/integrations`
- `/dashboard/settings/team`
- `/dashboard/settings/branding`
- `/dashboard/settings/api-tokens`

---

## 43. Important Admin Routes

Important Super Admin routes include:

- `/admin`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/forms`
- `/admin/forms/[formId]`
- `/admin/forms/[formId]/builder`
- `/admin/plans`
- `/admin/plans/new`
- `/admin/plans/[planId]`
- `/admin/settings`
- `/admin/billing/events`
- `/admin/pages`
- `/admin/pages/new`
- `/admin/pages/[pageId]`
- `/admin/blog`
- `/admin/blog/new`
- `/admin/blog/[postId]`
- `/admin/knowledge-base`
- `/admin/knowledge-base/categories`
- `/admin/knowledge-base/categories/new`
- `/admin/knowledge-base/categories/[categoryId]`
- `/admin/knowledge-base/articles/new`
- `/admin/knowledge-base/articles/[articleId]`
- `/admin/support`
- `/admin/support/[requestId]`
- `/admin/email-notifications`
- `/admin/email-notifications/new`
- `/admin/email-notifications/[templateId]`
- `/admin/email-notifications/broadcast`
- `/admin/email-notifications/broadcast/[campaignId]`
- `/admin/media`

---

## 44. Current Limitations

Known limitations or areas not yet positioned as complete:

- Shopify integration is not full Shopify App Store-ready.
- Shopify does not sync products, customers, orders, or payments.
- Advanced analytics is not yet a full reporting suite.
- Conditional logic is field visibility logic, not full workflow automation.
- PDF layout customization is not a full template designer.
- Media library exists, but is not positioned as a full DAM/media manager.
- No full customer-facing ticket portal.
- No live chat.
- No support attachments.
- No per-form custom permissions beyond current owner/workspace/staff model.
- No guarantee of legal enforceability for templates or signatures.
- AdSense should stay disabled until site approval.

---

## 45. System Summary

FormOS is a workflow form system for businesses that need more than data collection.

The system includes:

- form builder
- workflow templates
- public forms
- signatures
- file uploads
- Google Drive/Dropbox storage
- Office Use Only fields
- PDF generation
- email notifications
- QR sharing
- embeds
- WordPress plugin
- Shopify extension
- analytics
- billing/plans/trials
- workspace/staff access
- Super Admin
- CMS/blog/help/support
- security and legal controls

The simplest way to explain FormOS is:

> FormOS helps businesses collect customer details, uploads, and signatures, complete internal office checks, and produce a finished PDF workflow record.

The product is strongest when shown through a real workflow:

> template -> form builder -> public form -> submission -> office review -> final PDF -> storage/share/embed.

