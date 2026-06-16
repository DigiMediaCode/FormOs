# FormOS Launch Demo Script

## Demo Goal

Show FormOS as the form builder that finishes the job: a business starts from a workflow template, collects customer details, uploads, signatures, staff-only processing, finalized PDFs, analytics, and website embeds.

Recommended demo length: 12 to 18 minutes.

## Pre-Demo Setup

- Use a demo owner account with access to templates, uploads, office fields, PDF generation, embeds, and analytics.
- Have Google Drive or Dropbox connected if you want to demonstrate real file routing.
- Keep one published Vehicle Hire Agreement form ready as a fallback.
- Keep one completed submission ready as a fallback for office fields and PDF finalization.
- Keep the WordPress and Shopify embed examples ready if live plugin testing is not available.

## 1. Homepage Positioning

Route: `/`

Talk track:

FormOS is not trying to be another generic form builder. It is built for businesses where the form is only the first step. The real job is collecting the right details, signatures, files, internal staff checks, and producing a finished PDF record.

Show:

- Hero headline and workflow positioning.
- Badges for signatures, file uploads, Office Use Only fields, completed PDFs, Google Drive, Dropbox, WordPress, and Shopify embeds.
- Workflow section: customer fills form, uploads files, signs agreement, staff completes office fields, FormOS finalizes PDF, files are stored.

## 2. Template Index

Route: `/templates`

Talk track:

Instead of starting from a blank form, FormOS gives workflow businesses strong starting points.

Show:

- Rental & Hire templates.
- Trades & Services templates.
- Booking & Events templates.
- Cards for the five launch workflows.

## 3. Vehicle Hire Landing Page

Route: `/templates/vehicle-hire-agreement`

Talk track:

This is an example of a complete vertical workflow. It is not just name, email, and message. It covers customer identity, licence upload, agreement acknowledgement, signatures, and internal office processing.

Show:

- Hero section.
- What the template includes.
- Workflow steps.
- FAQ and legal-safe disclaimer.
- CTA to start trial or use template.

## 4. Signup and Trial

Routes:

- `/signup?template=vehicle-hire-agreement`
- `/pricing`

Talk track:

Users can start from a template or choose a plan. Paid plans can use the configured trial period, and trial users receive the selected paid plan limits during the trial.

Show:

- Signup flow from template context.
- Pricing card trial CTA.
- Dashboard trial banner if the account is trialing.

## 5. Dashboard Onboarding

Route: `/dashboard`

Talk track:

After signup, FormOS guides the user toward the first successful workflow instead of leaving them with an empty dashboard.

Show:

- Setup checklist.
- Template prompt if template context exists.
- Connect storage, create form, publish, submit test response, finalize PDF, share/embed.

## 6. Create Template Form

Route: `/dashboard/forms/new?template=vehicle-hire-agreement`

Talk track:

The user starts from a real workflow template. The template respects the user's effective plan permissions, so locked features stay protected server-side.

Show:

- Template selection or direct template creation.
- Created form in dashboard.

## 7. Builder and Conditional Logic

Route: `/dashboard/forms/[formId]/builder`

Talk track:

The builder is compact and workflow-oriented. It supports drag and drop, collapsible field cards, conditional logic, uploads, signatures, and office-only fields.

Show:

- Field list and builder area.
- Example conditional logic, such as additional driver or offence details.
- Licence upload field.
- Signature or initials field.
- Office Use Only fields for vehicle, odometer, bond, inspection, approval.

## 8. Publish and Share

Route: `/dashboard/forms/[formId]`

Talk track:

Once published, the form can be shared by public link, QR code, iframe embed, WordPress, or Shopify.

Show:

- Publish action.
- Public link.
- QR code.
- Embed section.
- Storage warning if the form has file uploads and no active storage provider.

## 9. Public Mobile Form

Route: `/f/[formSlug]`

Talk track:

The customer experience is mobile-friendly and focused on completion. Public users only see public fields, not office-only fields.

Show:

- Public form layout.
- Required fields.
- File upload field.
- Signature canvas.
- Submit button.

## 10. Submit Response

Talk track:

When the customer submits, FormOS validates server-side, preserves user-entered data on errors where possible, and routes files through the owner-configured storage provider.

Show:

- Simple submission path.
- Confirmation page.

## 11. Submission Detail and Office Fields

Route: `/dashboard/forms/[formId]/submissions/[submissionId]`

Talk track:

This is where FormOS becomes different from ordinary form builders. Staff can complete internal fields after the customer submits.

Show:

- Submitted customer answers.
- Office Use Only fields.
- Activity/audit timeline.
- File metadata and upload status if relevant.

## 12. Finalize PDF

Talk track:

FormOS can turn the completed workflow into a PDF record. This is the finished job: customer input, uploads, signatures, and office processing in one record.

Show:

- Finalize or generate PDF action.
- Completed PDF status.
- Email or delivery behavior if configured.

## 13. Analytics

Routes:

- `/dashboard`
- `/dashboard/forms/[formId]`

Talk track:

Owners can see basic workflow performance without needing a separate analytics product.

Show:

- Views.
- Submissions.
- Completion rate.
- Source breakdown for public, embed, WordPress, Shopify, or unknown.
- Empty-state guidance if there are no views yet.

## 14. Embeds

Routes:

- `/embed/forms/[formId]`
- WordPress plugin settings.
- Shopify theme app extension block.

Talk track:

FormOS can live on the customer's existing website. The WordPress plugin and Shopify extension reuse the same secure embed route.

Show:

- iframe embed code.
- JavaScript embed code if enabled.
- WordPress shortcode or form selector.
- Shopify app block settings.
- Theme customization query options.

## 15. Pricing Close

Route: `/pricing`

Talk track:

Pricing is organized around workflow maturity: one simple workflow, small business paper replacement, Pro workflows with signatures/uploads/office review/PDFs, team workflows, and enterprise/white-label needs.

Show:

- Free plan.
- Starter, Pro, Business plans with trial CTA.
- Enterprise contact CTA.

## Suggested Screenshots

- Homepage hero.
- Workflow section.
- Template index.
- Vehicle Hire landing page.
- Signup with template context.
- Dashboard onboarding checklist.
- Builder with collapsed field cards and preview.
- Public mobile form.
- Submission detail with office fields.
- Analytics cards.
- Embed card.
- Pricing page.

## Fallbacks

- If Stripe is not configured in the demo environment, describe trial checkout from the pricing card and avoid entering real payment details.
- If storage is not connected, show the storage warning and explain Google Drive/Dropbox setup.
- If email delivery is disabled, show the email notification settings and explain the Lark provider flow.
- If WordPress or Shopify is not available live, show the plugin docs and generated embed code.

## Closing Line

FormOS helps workflow businesses stop stitching together forms, email attachments, signatures, staff notes, storage folders, and PDFs by hand. It collects, signs, files, and finishes the job.
