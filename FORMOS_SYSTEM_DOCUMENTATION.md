# FormOS System Documentation

Last updated: 27 June 2026

## 1. Product Overview

FormOS is a standalone SaaS workflow platform positioned as:

**FormOS - the form builder that finishes the job.**

It is not designed only for simple surveys or generic contact forms. FormOS is built for businesses that need to collect customer information, receive signed agreements, accept file uploads, process internal office fields, generate finalized PDFs, store files in connected cloud storage, and manage completed workflows from one dashboard.

### Main Customer Problem

Many vertical service businesses still rely on disconnected tools:

- Web forms for intake
- Email for files
- Separate signature tools
- Manual staff review
- Spreadsheets for tracking
- PDF templates created by hand
- Google Drive or Dropbox folders organized manually

This creates missed details, inconsistent records, repeated admin work, and unprofessional customer workflows.

### Core Value Proposition

FormOS turns business forms into complete workflows:

1. A customer fills in a form.
2. The customer uploads files or signs where needed.
3. Staff complete internal Office Use Only fields.
4. FormOS finalizes a PDF record.
5. Files and documents are organized in connected storage.
6. The owner can track submissions, clients, contracts, agreements, and follow-up actions.

## 2. User Roles

| Role | Purpose | Main Access |
| --- | --- | --- |
| Super Admin | Platform operator | Admin dashboard, users, plans, settings, CMS, email templates, billing events, support, blog, knowledge base, media |
| Workspace Owner | Business account owner | Forms, clients, contracts, agreements, billing, integrations, branding, API tokens, team settings |
| Workspace Admin | Staff-level manager | Workspace resources allowed by workspace permissions |
| Workspace Staff | Operational staff | Assigned workspace workflows and submission processing where permitted |
| Public Submitter | External customer/respondent | Public form, embedded form, signing link, support contact form |

## 3. Core Modules

### 3.1 Authentication and Account Access

Implemented account features include:

- Email and password signup/login
- Google OAuth login
- Lark OAuth login
- Email verification
- Password reset
- Email-based login OTP/two-step verification
- Login notification email templates
- User profile
- Business/billing profile
- Account suspension support for Super Admin
- Safe auth token model for verification, password reset, and OTP flows

Security notes:

- Passwords are not stored as plain text.
- Auth tokens are stored server-side and expire.
- OAuth account records are separate from core user records.
- Suspended users are blocked from normal dashboard access.

### 3.2 Dashboard Shell

The user dashboard includes:

- Responsive desktop sidebar
- Collapsed mobile navigation drawer
- Quick create form button
- Dashboard analytics summary
- Recent submissions
- Recent forms
- Onboarding checklist popup/sticker
- Trial/payment restore banners and prompts where applicable
- Page loader overlay for navigation feedback

Dashboard navigation currently includes:

- Dashboard
- Forms
- Widget
- Clients
- Contracts
- Agreements
- Integrations
- Billing
- Team
- Branding
- API Tokens
- Support / Help
- Admin Panel link for Super Admin users

### 3.3 Forms

Forms are the central workflow object.

Supported form modes:

- Standard
- Agreement
- Booking

Supported form statuses:

- Draft
- Published
- Archived

Core form functionality:

- Create blank forms
- Create from templates
- Edit form details
- Publish/unpublish
- Archive
- Generate public form link
- Generate QR code
- Configure widget/embed code
- Configure PDF delivery behavior
- Configure custom submission notification recipient where plan allows
- View analytics
- View submissions
- Use drag and drop in the builder on desktop
- Mobile users are prompted to use desktop for builder editing

### 3.4 Form Builder

The builder supports:

- Field palette
- Drag and drop ordering
- Collapsible field cards
- Live preview
- Save fields
- Required field settings
- Office Use Only visibility
- Display-only content fields
- Conditional visibility rules
- Plan-aware field availability
- Plan-aware conditional rule limits
- Desktop-only editing guard

### 3.5 Field Types

Implemented or referenced field types include:

- Text
- Long text / textarea
- Email
- Phone
- Date
- Address
- Number
- Currency
- Dropdown / select
- Checkbox with options
- File upload
- Image upload
- Signature
- Initials
- Section heading
- Static text
- HTML content

Free and Starter plans restrict allowed field types. Pro and Business can allow all field types through `allowedFieldTypes: null`.

### 3.6 Conditional Logic

Conditional logic is available where plan limits allow it.

Supported behavior:

- Show or hide fields based on earlier public answers
- Rule count controlled by plan
- Rules remain server-side protected by effective limits
- Templates can include useful conditional logic paths

Plan keys:

- `allowConditionalLogic`
- `maxConditionalRules`

### 3.7 Public Forms

Public forms are available at:

- `/f/[formSlug]`

Public form behavior:

- Only published forms are available.
- Draft/archived forms show unavailable states.
- Office Use Only fields are hidden from public users.
- File uploads use the owner's configured storage provider.
- Required field validation is enforced.
- Signatures and initials are captured.
- Form data is preserved on validation errors where supported.
- Public submissions create records in the owner dashboard.
- Analytics view and submit events are tracked.

### 3.8 Embedded Forms and Widget

FormOS supports external website embedding through:

- `/embed/forms/[formId]`
- `embed.js`
- iframe embed code
- JavaScript auto-height embed code
- Widget page in the dashboard
- WordPress plugin
- Shopify theme app extension

Embed styling supports safe query parameters:

- `theme`
- `accent`
- `bg`
- `surface`
- `text`
- `border`
- `radius`
- `compact`
- `font`

Embed security:

- Dashboard/admin routes are not intended to be embeddable.
- Embed route contains public form content only.
- Embed route respects plan limit `allowEmbeds`.
- Embed route validates styling parameters.
- Embedded submissions use the same validation and storage rules as public forms.

### 3.9 Widget Builder

The Widget dashboard page lets owners design embed appearance and copy code.

Current widget options include:

- Select form
- Theme
- Background
- Accent color
- Card surface
- Text color
- Border color
- Radius
- Font
- Default height
- Compact spacing
- iframe code
- Auto-height JavaScript code

The widget is separate from the form detail page to keep the form detail workflow cleaner.

### 3.10 Submissions

Submission features include:

- Submission list per form
- Direct one-click submissions access from forms list
- Recent submissions on dashboard
- Submission detail page
- Public answers
- Uploaded file metadata
- Signature/initials display
- Office Use Only fields
- Activity timeline
- Submission status
- PDF/finalization actions
- Source metadata where available
- Analytics submit events

Submission statuses:

- New
- Reviewed
- Approved
- Rejected

### 3.11 Office Use Only Fields

Office Use Only fields let staff complete internal fields after a public submission.

Use cases:

- Vehicle allocation
- Bond or deposit confirmation
- Inspection notes
- Internal approval
- Assigned staff
- Risk notes
- Final status

Plan key:

- `allowOfficeUseFields`

### 3.12 File Uploads

File upload features include:

- Public upload fields
- Storage provider checks
- Upload metadata tracking
- Google Drive uploads
- Dropbox uploads
- Warning when a form collects files but no storage provider is active
- File count indicators in submission lists

File data handling:

- FormOS stores metadata and storage references.
- Owner-selected storage providers hold the actual uploaded files where configured.
- Storage provider tokens are not exposed to public submitters.

### 3.13 Signatures and Initials

Signature functionality includes:

- Signature field
- Initials field
- Touch and mouse support
- Clear button
- Public form capture
- PDF inclusion where applicable
- Contract/agreement signing support

### 3.14 PDF Generation

PDF features include:

- Completed submission PDFs
- Office finalization PDFs
- Auto PDF delivery modes
- Contract PDFs
- Agreement PDFs
- Branded document PDFs
- Download routes
- PDF email delivery where configured

Branding priority for contracts/agreements:

1. Owner custom branding logo, only when configured and plan allows custom branding.
2. Platform logo if owner branding is unavailable or not allowed.
3. Default FormOS fallback logo.

Plan key:

- `allowPdfGeneration`

### 3.15 Clients

The Clients module supports:

- Client list
- Client detail/edit
- Creating clients manually
- Creating clients from submissions
- Client inference from submission fields
- Client link to submissions
- Client link to contracts and agreements
- Automatic client creation when creating a contract/agreement for a new client

Plan keys:

- `allowClients`
- `allowConvertSubmissionToClient`
- `maxClients`

### 3.16 Contracts and Agreements

Contracts and Agreements are separate from normal form submissions and are designed for business documents.

Features include:

- Contract list
- Agreement list
- Create contract/agreement
- Edit contract/agreement content
- Delete where allowed
- Client selection or automatic client creation
- Owner snapshot
- Client snapshot
- Scope of work
- Terms and conditions
- Payment terms
- Start and end dates
- Amount/currency
- Generate PDF
- Download PDF
- Send for signing
- Public signing link
- Owner/client signature capture
- Final PDF sent after both parties sign
- Editable email templates for signing request and completed signed document

Plan keys:

- `allowContracts`
- `allowAgreements`
- `allowDocumentTemplates`
- `maxDocumentsPerMonth`
- `allowPdfGeneration`
- `allowCustomBranding`

Current legal position:

- Templates are starting points.
- FormOS does not claim to provide legal advice.
- Businesses should review contracts and agreements before use.

### 3.17 Templates

FormOS includes vertical workflow templates designed to show complete workflow value.

Current vertical templates:

1. Vehicle Hire Agreement
2. Equipment Rental Agreement
3. Contractor Job Intake + Waiver
4. Service Booking + Consent Form
5. Photography/Event Booking Agreement

Template categories:

- Rental & Hire
- Trades & Services
- Booking & Events

Templates include combinations of:

- Customer details
- Upload fields
- Signatures/initials
- Conditional logic
- Office Use Only fields
- Agreement text
- Workflow-specific internal processing fields

Plan key:

- `allowTemplates`

### 3.18 Analytics

Basic analytics are implemented.

Tracked events:

- Public form view
- Embed form view
- Successful submission

Stored analytics metadata:

- Form ID
- Owner ID
- Event type
- Source
- Referrer where safe
- User agent where safe
- Hashed IP where used
- Session ID where used
- Created timestamp

Displayed analytics include:

- Views
- Submissions
- Completion rate
- Top performing form
- Source breakdown
- Empty states for no views

Plan key:

- `allowBasicAnalytics`

### 3.19 QR Codes

QR functionality includes:

- Public form QR generation
- QR access from form detail and forms list
- Plan-aware access

Plan key:

- `allowQrCode`

### 3.20 Storage Integrations

Supported storage providers:

- Google Drive
- Dropbox

Google Drive support includes:

- OAuth connection
- Connected account status
- Folder information
- Uploading public form files
- Uploading generated documents where applicable
- Metadata tracking
- Disconnect/reconnect

Dropbox support includes:

- OAuth connection
- Connected account status
- Uploading public form files
- Metadata tracking
- Disconnect/reconnect

Plan keys:

- `allowGoogleDrive`
- `allowDropbox`

### 3.21 Email and Notifications

Email features include:

- Lark email provider
- Editable email templates
- Rich HTML editor
- Media library insertion
- Global email header/footer shortcodes
- Shared variables across templates
- Login notification
- Verification/password flows
- Submission notifications
- Support notifications
- Contract signing request email
- Signed contract/agreement completion email
- Broadcast emails

Email template system supports variables such as:

- `{{userName}}`
- `{{firstName}}`
- `{{userEmail}}`
- `{{loginTime}}`
- `{{emailHeader}}`
- `{{emailFooter}}`

Broadcast features include:

- Send to all users
- Send to selected users
- Send to pasted email addresses, including non-users
- Send by package/plan
- Broadcast history
- Broadcast analytics foundation

Plan key for form-specific notification recipient:

- `allowCustomSubmissionNotifications`

### 3.22 Media Library

Media Library supports:

- Admin-managed uploads
- Image previews
- Insert media into email rich editor
- Upload from media modal
- Delete media from modal
- Media route for public retrieval where appropriate
- Usage in platform settings, content pages, and email content

### 3.23 CMS Pages

CMS page features include:

- Super Admin page list
- Page create/edit
- Page builder blocks
- Rich content
- Headings
- Paragraphs
- Sections
- Images
- Buttons
- Dividers
- Safe HTML
- Public CMS rendering
- Footer visibility
- Legal pages

Important public CMS/legal pages:

- `/privacy-policy`
- `/p/terms-of-service`
- `/p/data-security`
- `/contact`

Legal pages use consistent contact email:

- `info@formos.com.au`

### 3.24 Blog

Blog features include:

- Blog categories
- Blog posts
- Draft/published/archived statuses
- Slugs
- Featured image
- Excerpt
- SEO metadata
- Sanitized content rendering
- Public blog listing
- Public post detail
- Super Admin management

Routes:

- `/blog`
- `/blog/[slug]`
- `/admin/blog`

### 3.25 Knowledge Base / Help Center

Knowledge Base features include:

- KB categories
- KB articles
- Draft/published/archived statuses
- Search by query
- Featured/popular articles
- Contact support CTA
- Sanitized content rendering
- Super Admin management

Routes:

- `/help`
- `/help/[categorySlug]`
- `/help/[categorySlug]/[articleSlug]`
- `/admin/knowledge-base`

### 3.26 Support Requests

Support/contact system includes:

- Public contact form
- Optional logged-in user linking
- Category
- Subject
- Message
- Status
- Priority
- Admin notes
- Public/admin message history
- Email notification to support/admin
- Super Admin list/detail management

Statuses:

- Open
- In Progress
- Resolved
- Closed

Priorities:

- Low
- Normal
- High
- Urgent

Routes:

- `/contact`
- `/admin/support`
- `/admin/support/[requestId]`
- `/support/reply/[token]`

### 3.27 API Tokens and External API

API token support includes:

- Owner-created API tokens
- Token hashing
- Token prefix
- Last-used tracking
- Token revocation/deletion
- External forms API for integrations

External API use case:

- WordPress and Shopify admin tools can connect to FormOS and fetch published forms.

Plan key:

- `allowApiAccess`

### 3.28 Billing, Plans, Trials, and Stripe

Billing features include:

- Dynamic subscription plans
- Plan limits JSON
- User quota overrides
- Stripe Checkout
- Stripe Customer Portal
- Stripe webhook handling
- Billing events
- Stripe plan/price mapping
- Public pricing page
- Paid-plan trial flow
- Trial settings in platform settings
- Payment failure handling
- Restore plan prompt after failed payment
- Downgrade to Free limits when payment fails/cancels/ends without recovery

Trial behavior:

- Free plan is free forever.
- Paid plans can start with a configurable trial.
- Trial checkout still goes through Stripe authorization.
- Trialing subscriptions receive selected paid-plan limits.
- Users do not receive unlimited repeated trials.
- If payment fails after trial, existing data is not deleted, but premium actions are locked according to Free limits.

Default public plan positioning:

| Plan | Monthly | Summary |
| --- | ---: | --- |
| Free | AUD 0 | Testing one simple workflow |
| Starter | AUD 19 | Small businesses moving away from paper forms |
| Pro | AUD 45 | Signatures, uploads, office review, completed PDFs, clients, contracts, agreements |
| Business | AUD 89 | Higher-volume workflows and team use |

### 3.29 Workspaces and Teams

Workspace features include:

- Workspace owner
- Workspace admin
- Workspace staff
- Invites
- Invite tokens
- Staff access
- Owner-only billing/integrations/team actions

Plan keys:

- `allowTeamMembers`
- `maxTeamMembers`

### 3.30 Super Admin

Super Admin modules include:

- Admin dashboard
- Users
- Forms
- Pages
- Blog
- Knowledge Base
- Media
- Emails
- Support
- Plans
- Billing Events
- Platform Settings

Super Admin user management includes:

- View users
- User detail summary
- Subscription/plan status
- Business profile summary
- Forms/submissions counts
- Workspace/team context
- Suspend/deactivate users
- Safe delete where allowed
- Protection against self-delete/self-suspend and last Super Admin removal

Super Admin form management includes:

- View all forms
- Owner context
- Field structure
- Safe preview
- Archive
- Safe delete rules

Super Admin settings include:

- Branding
- SEO
- Social share image
- Company/footer text
- Contact/support email
- Legal URLs
- Public toggles
- AdSense settings
- Trial settings
- Email header/footer

### 3.31 Ads / AdSense

AdSense integration exists but is frontend-disabled by default after Google rejection for low-value content.

Current behavior:

- Backend settings remain available.
- Defaults should keep ads disabled.
- Public ad components render nothing when ads are disabled.
- No dashboard/admin/auth/checkout ads.
- Ads can later be enabled through Super Admin settings after approval.

Ad-related plan key:

- `allowAdFreeForms`

### 3.32 SEO and Social Sharing

SEO features include:

- Platform meta title
- Platform meta description
- Social share image URL/path
- Open Graph metadata
- Twitter/X summary image metadata
- Public CMS/blog/help metadata where practical
- Template landing page SEO metadata

### 3.33 Public Marketing Pages

Public pages include:

- Homepage
- Pricing
- Templates index
- Vehicle Hire Agreement landing page
- Equipment Rental Agreement landing page
- Contractor Job Intake + Waiver landing page
- Service Booking + Consent Form landing page
- Photography/Event Booking Agreement landing page
- Blog
- Help Center
- Legal/CMS pages
- Contact page

Positioning:

- Forms that collect, sign, file, and finish the job.

### 3.34 WordPress Plugin

WordPress plugin folder:

- `plugins/wordpress/formos-embed`

Features:

- WordPress settings page
- FormOS Base URL
- API token connection
- Fetch FormOS forms
- Shortcode insertion
- Toolbar integration
- iframe embed output
- Optional JavaScript embed
- Theme customization attributes
- Safe sanitization/escaping

Shortcode examples:

- `[formos_form id="FORM_ID"]`
- `[formos_form id="FORM_ID" height="900"]`
- `[formos_form id="FORM_ID" bg="transparent" radius="16" compact="true"]`

### 3.35 Shopify Integration

Shopify plugin folder:

- `plugins/shopify/formos-embed-shopify`

Features:

- Standalone Shopify integration separate from FormOS runtime
- Theme App Extension
- FormOS Form app block
- Manual FormOS Base URL and Form ID settings
- Appearance query params aligned with WordPress
- Embedded admin UI extension for FormOS connection experience
- API token based form fetch where available
- Documentation for Shopify CLI/development store setup

Important limitation:

- Shopify App Store submission, Shopify billing, product/customer/order sync, and full marketplace readiness are not part of the current scope.

## 4. Permission and Limit Keys

| Key | Controls |
| --- | --- |
| `maxForms` | Number of forms a user can create |
| `maxMonthlySubmissions` | Monthly public submission allowance |
| `allowGoogleDrive` | Google Drive storage integration |
| `allowDropbox` | Dropbox storage integration |
| `allowPdfGeneration` | PDF generation and finalization |
| `allowOfficeUseFields` | Office Use Only fields and internal completion workflows |
| `allowTemplates` | Creating forms from templates |
| `allowQrCode` | QR code access |
| `allowCustomBranding` | Owner branding/logo in public documents and branding areas |
| `allowTeamMembers` | Workspace team/staff features |
| `allowAdFreeForms` | Removes public form ads where ads are enabled |
| `allowEmbeds` | Website/widget embedding |
| `allowApiAccess` | API tokens and external forms API |
| `allowConditionalLogic` | Conditional visibility rules |
| `allowBasicAnalytics` | Basic form analytics |
| `allowCustomSubmissionNotifications` | Per-form submission notification recipient |
| `allowClients` | Clients module access |
| `allowConvertSubmissionToClient` | Convert/infer clients from submissions |
| `allowContracts` | Contract creation and contract actions |
| `allowAgreements` | Agreement creation and agreement actions |
| `allowDocumentTemplates` | Document template support for contracts/agreements |
| `maxTeamMembers` | Maximum workspace staff/team members |
| `maxConditionalRules` | Maximum conditional logic rules |
| `maxClients` | Maximum clients |
| `maxDocumentsPerMonth` | Monthly contracts/agreements allowance |
| `allowedFieldTypes` | Which form field types are permitted |

These limits are controlled by:

- Subscription plan defaults
- Super Admin plan editor
- User quota overrides
- Effective limits calculation
- Server-side assertions in important actions

## 5. Permission Matrix

| Feature | Plan Controlled | User Override | Super Admin Only | Owner Only | Staff/Admin Access | Public Access | Server-side Enforcement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create forms | Yes, `maxForms` | Yes | No | Owner/workspace | Where permitted | No | Yes |
| Publish forms | Indirect through form access | Yes | No | Owner/workspace | Where permitted | No | Yes |
| Public form submit | Yes, submission limits | Yes | No | No | No | Yes | Yes |
| File uploads | Yes, field/storage limits | Yes | No | Configure only | Process where permitted | Upload only | Yes |
| Google Drive | Yes | Yes | No | Owner | No | No | Yes |
| Dropbox | Yes | Yes | No | Owner | No | No | Yes |
| Office Use fields | Yes | Yes | No | Owner/workspace | Where permitted | Hidden | Yes |
| PDF generation | Yes | Yes | No | Owner/workspace | Where permitted | No | Yes |
| Templates | Yes | Yes | No | Owner/workspace | Where permitted | No | Yes |
| QR code | Yes | Yes | No | Owner/workspace | Where permitted | Public can scan | Yes |
| Embeds/widgets | Yes | Yes | No | Owner/workspace | Where permitted | Embedded form only | Yes |
| API tokens | Yes | Yes | No | Owner | No | External API only | Yes |
| Clients | Yes | Yes | No | Owner/workspace | Where permitted | No | Yes |
| Contracts | Yes | Yes | No | Owner/workspace | Where permitted | Signing recipient only | Yes |
| Agreements | Yes | Yes | No | Owner/workspace | Where permitted | Signing recipient only | Yes |
| Team members | Yes | Yes | No | Owner | Staff uses access | No | Yes |
| Billing | Plan feature | N/A | No | Owner | No | No | Yes |
| Super Admin settings | No | No | Yes | No | No | No | Yes |
| CMS/blog/help management | No | No | Yes | No | No | Public reads published | Yes |
| Support management | No | No | Yes | No | No | Public can submit/reply by token | Yes |
| Email templates/broadcasts | No | No | Yes | No | No | No | Yes |
| Media library | No | No | Yes | No | No | Public media route where appropriate | Yes |
| AdSense settings | No | No | Yes | No | No | Public pages only if enabled | Yes |

## 6. Data Model Inventory

Key Prisma models include:

| Model | Purpose |
| --- | --- |
| `User` | Core account, role, auth state, trial/payment failure flags, suspension |
| `ApiToken` | Hashed external API tokens |
| `UserOAuthAccount` | Google/Lark OAuth identity links |
| `BusinessProfile` | User company/billing profile |
| `Workspace` | Business workspace |
| `WorkspaceMember` | Owner/admin/staff workspace membership |
| `WorkspaceInvite` | Staff invitation flow |
| `AuthToken` | Email verification, password reset, OTP tokens |
| `UserIntegration` | Google Drive, Dropbox, Lark integration credentials/status |
| `UserUploadSettings` | Active upload provider |
| `Form` | Form definition, fields, settings, status |
| `FormAnalyticsEvent` | View/submit analytics events |
| `FormSubmission` | Public submission, answers, files, office data, PDF data |
| `Client` | Customer/client record |
| `BusinessDocument` | Contract/agreement record and signing/PDF state |
| `SubmissionEvent` | Submission activity/audit timeline |
| `PlatformSetting` | Global settings stored by key/value |
| `CmsPage` | CMS/legal/public pages |
| `EmailTemplate` | Editable system email templates |
| `MediaAsset` | Media library assets |
| `EmailCampaign` | Broadcast campaign tracking |
| `BlogCategory` | Blog categories |
| `BlogPost` | Blog posts |
| `KbCategory` | Knowledge Base categories |
| `KbArticle` | Knowledge Base articles |
| `SubscriptionPlan` | Dynamic plan records |
| `UserSubscription` | User plan/subscription/trial state |
| `UserQuotaOverride` | Per-user plan limit override |
| `UserOnboardingState` | Dashboard onboarding dismiss/completion state |
| `BillingEvent` | Stripe webhook/billing log |
| `SupportRequest` | Contact/support request |
| `SupportRequestMessage` | Support conversation messages |

## 7. Integration Ecosystem

| Integration | Purpose |
| --- | --- |
| Stripe | Checkout, subscriptions, trials, customer portal, webhook updates |
| Google OAuth | Login |
| Lark OAuth | Login |
| Google Drive | File/document storage |
| Dropbox | File storage |
| Lark Mail | Transactional email provider |
| WordPress Plugin | Embed FormOS forms using shortcode/admin connection |
| Shopify Theme Extension | Embed FormOS forms in Shopify themes |
| External API | Lets plugins fetch published FormOS forms using API tokens |
| Google AdSense | Backend-ready ad monetization, currently disabled by default |

## 8. Security and Privacy Features

Implemented security and privacy controls include:

- Centralized auth/permission helpers
- Workspace ownership checks
- Super Admin guards
- Server-side plan enforcement
- Email verification
- Password reset
- Login OTP/two-step email code
- Hashed API tokens
- OAuth token server-side storage
- Storage token non-exposure
- Stripe webhook signature verification
- Safe billing event logging
- Public form draft/archived protection
- Office Use Only fields hidden publicly
- File upload validation and storage rules
- Safe public errors
- Sanitized CMS/blog/help content
- Sanitized email HTML
- Safe media serving route
- Dashboard/admin iframe protection
- Embed route isolated for iframe use
- No dashboard/admin AdSense
- Security checklist documentation
- Privacy Policy with Google Drive data disclosure
- Data Security and Terms pages

## 9. Customer Workflow Examples

### Workflow 1: Create and Publish a Form

1. Owner logs in.
2. Owner opens Forms.
3. Owner creates a blank form or starts from a workflow template.
4. Owner edits fields in the desktop builder.
5. Owner publishes the form.
6. FormOS creates a public link and QR code.
7. Owner shares the link, QR code, or embed widget.

### Workflow 2: Vehicle Hire Agreement

1. Owner creates Vehicle Hire Agreement from template.
2. Customer enters identity/licence details.
3. Customer uploads licence.
4. Customer accepts conditions and signs.
5. Staff complete vehicle, bond, odometer, and inspection fields.
6. FormOS finalizes the submission PDF.
7. Files and PDF are stored/sent according to settings.

### Workflow 3: Uploads to Google Drive or Dropbox

1. Owner connects Google Drive or Dropbox.
2. Owner sets active provider.
3. Form includes file upload fields.
4. Customer submits files.
5. FormOS uploads files to connected storage.
6. Submission detail shows upload metadata and status.

### Workflow 4: Office Processing and PDF

1. Customer submits public form.
2. Staff open submission detail.
3. Staff review public answers.
4. Staff complete Office Use Only fields.
5. Staff finalize the submission.
6. FormOS generates a completed PDF.

### Workflow 5: Website Embed

1. Owner opens Widget page.
2. Owner selects a form.
3. Owner customizes appearance.
4. Owner copies iframe or JavaScript embed code.
5. Owner pastes it into WordPress, Shopify, or a generic site.
6. Visitors submit the embedded form.
7. Submissions appear in FormOS dashboard.

### Workflow 6: Contract Signing

1. Owner creates a contract.
2. Owner selects or creates a client.
3. Owner enters scope, terms, payment details, and dates.
4. Owner generates a branded PDF preview.
5. Owner sends signing request.
6. Client signs through secure public signing link.
7. Owner signs where required.
8. Final PDF is sent to both parties.

### Workflow 7: Trial Signup

1. Visitor clicks paid plan trial.
2. Visitor authorizes payment through Stripe trial checkout.
3. Visitor completes account setup.
4. User receives paid plan limits during the trial.
5. If payment succeeds after trial, plan continues.
6. If payment fails, user is moved to Free limits and prompted to restore billing.

## 10. Current Limitations and Roadmap

The following are not fully built or are intentionally deferred:

- Shopify App Store submission and production app listing
- Shopify billing
- Deep Shopify form picker inside theme app block without manual setup in all scenarios
- Advanced analytics dashboards and charts
- Advanced conditional branching/multi-step forms
- Full custom PDF template designer
- Full document versioning and legal review workflow
- Per-form granular staff permissions
- Multiple independent workspaces per user
- Domain allowlist for embeds
- Custom CSS editor for embedded forms
- Full support ticket portal with threaded customer account access
- Live chat
- AI assistant
- AdSense approval and frontend ad activation
- Advanced media manager/cropper/CDN workflow
- Template marketplace
- Payment/deposit collection inside public forms

## 11. Operational Notes

### Development Rules

- Do not integrate or touch CommerceOS from this project.
- Schema changes should use Prisma migrations, not `prisma db push`.
- Stripe plan sync is controlled through existing billing/admin workflows.
- Dashboard/admin/auth pages should not receive AdSense placements.
- Public form submission logic, billing logic, and storage token handling should remain server-side protected.

### Common Verification Commands

```bash
npx prisma validate
npx prisma generate
npm run build
```

### Important Public URLs

- `/`
- `/pricing`
- `/templates`
- `/blog`
- `/help`
- `/contact`
- `/privacy-policy`
- `/p/terms-of-service`
- `/p/data-security`
- `/f/[formSlug]`
- `/embed/forms/[formId]`
- `/sign/[token]`

### Important Dashboard URLs

- `/dashboard`
- `/dashboard/forms`
- `/dashboard/widget`
- `/dashboard/clients`
- `/dashboard/contracts`
- `/dashboard/agreements`
- `/dashboard/settings/integrations`
- `/dashboard/settings/billing`
- `/dashboard/settings/branding`
- `/dashboard/api-tokens`

### Important Admin URLs

- `/admin`
- `/admin/users`
- `/admin/forms`
- `/admin/pages`
- `/admin/blog`
- `/admin/knowledge-base`
- `/admin/media`
- `/admin/email-notifications`
- `/admin/support`
- `/admin/plans`
- `/admin/billing/events`
- `/admin/settings`

## 12. Summary for Non-Technical Teams

FormOS helps workflow-heavy businesses replace paper forms, email attachments, manual signatures, and admin follow-up with one connected system.

The strongest product pillars are:

1. Form builder for real business workflows
2. Signatures and initials
3. File uploads to Google Drive or Dropbox
4. Office Use Only internal processing
5. Completed PDF generation
6. Client records
7. Contracts and agreements
8. Website embeds, WordPress, and Shopify integration
9. Plan-based SaaS billing and trials
10. Super Admin control over plans, content, settings, emails, support, and users

The best market positioning is:

**FormOS is for businesses where a form is only the start. It collects the details, captures the signature, stores the files, supports staff review, and produces the finished document.**
