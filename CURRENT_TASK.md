CURRENT TASK — FormOS Milestone 27.1: Super Admin Form View + Assisted Edit

Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Super Admin exists.
* Super Admin settings have been expanded successfully.
* Super Admin can view users/forms at a high level.
* Forms, builder, public forms, submissions, storage, PDF, audit, billing, plans, workspace, and staff access all work.
* Do not touch CommerceOS.

Problem

On the Super Admin Forms page, clicking View currently shows only form name and description.

This is not useful enough.

Super Admin should be able to inspect the actual form structure and help customers if they need support.

Goal

Improve Super Admin form view so Super Admin can:

* view complete form details
* inspect actual fields
* preview how the form looks publicly
* access owner/customer context
* optionally edit the form if needed for customer support

Important Direction

Super Admin support access must be controlled and safe.

Do not expose uploaded files or private submission answers in this milestone.

Do not give Super Admin direct PDF/download access unless intentionally built later.

Do not break owner/staff permissions.

Do not integrate CommerceOS.

Required Route

Create or improve:

/admin/forms/[formId]

This page should show a complete Super Admin form detail view.

Form Detail Page Should Show

Form Summary

* form title
* description
* owner name/email
* owner plan
* status: Draft / Published / Archived
* mode
* created date
* updated date
* version
* submissions count
* fields count
* public form link if published
* QR/public link card if already available and safe

Field Structure

Show the actual form fields in order.

For each field show:

* order
* label
* type
* required status
* visibility: Public / Office Use Only
* display-only status if applicable
* options count for dropdown/select
* short content preview for static/html/section fields

Do not show uploaded user files here.

Do not show private submission answers here.

Public Preview

Add a preview section that shows approximately how the form appears publicly.

This can reuse existing field rendering style if safe.

Preview should:

* show public fields
* hide office-only fields or show them with Office Use Only badge in admin preview
* show signatures/file upload placeholders only
* not submit anything
* not upload files
* not create submissions

Owner Context

Show owner summary:

* owner name
* owner email
* current plan
* business profile/company if available
* storage provider status if available

No secrets/tokens.

Assisted Edit

Add safe edit options for Super Admin.

Preferred:

Add button:

Open Builder as Support

or:

Edit Form as Super Admin

This should open the existing builder route for that form in support mode, or a Super Admin edit route.

Important rules:

* Only SUPER_ADMIN can use it.
* Normal users/staff cannot access another owner’s builder.
* Existing owner access must still work.
* Super Admin edits should still pass existing validation.
* Super Admin edits should not bypass plan restrictions unless deliberately allowed.

Recommended behaviour:

Super Admin can edit form fields as support, but action should be logged.

If existing builder is tightly owner-scoped, create a Super Admin route/page that loads the builder component with admin permission.

Activity Logging

If a form/admin event helper exists, log:

* super_admin_viewed_form
* super_admin_opened_form_builder
* super_admin_updated_form_fields

If no such event helper exists, skip complex logging but leave TODO.

Do not log sensitive field values unnecessarily.

Archive/Delete Actions

If archive/delete form actions were added earlier, keep them available here.

Rules:

* archive is allowed
* delete only if safe
* if form has submissions, block delete and suggest archive

Security Requirements

* Only SUPER_ADMIN can access /admin/forms/[formId].
* Super Admin should not see storage tokens.
* Super Admin should not see OAuth tokens.
* Super Admin should not see uploaded file contents.
* Super Admin should not see full submission answers in this milestone.
* Super Admin edit/support mode must not break owner permissions.
* All actions must be server-side protected.

Out of Scope

Do not build full submission viewer for Super Admin.
Do not expose uploaded files.
Do not expose completed PDFs.
Do not build impersonation.
Do not build per-field edit history.
Do not build CMS/blog/knowledge base in this milestone.
Do not integrate CommerceOS.

Acceptance Criteria

Milestone 27.1 is complete when:

* /admin/forms/[formId] shows full form summary.
* Super Admin can see owner context.
* Super Admin can see field structure in order.
* Super Admin can see required/visibility/type for each field.
* Super Admin can preview the form structure safely.
* Office-only fields are clearly marked or hidden in preview.
* Super Admin can open/edit form as support if implemented.
* Normal users cannot access admin form detail.
* Staff cannot access admin form detail.
* No storage tokens/secrets/uploaded file contents are exposed.
* Existing owner form builder still works.
* Existing public forms still work.
* Existing billing/plans/workspace/security still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
