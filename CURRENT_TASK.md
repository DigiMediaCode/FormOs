# CURRENT TASK — FormOS Milestone 10: Office Use Only Fields

## Project Context

FormOS is a standalone SaaS-style form builder project.

Completed:

* Milestone 0: Project setup
* Milestone 1: Auth + core database models
* Milestone 2: Forms CRUD
* Milestone 3: Basic form builder
* Milestone 3.1: HTML content field
* Milestone 4: Public form renderer + submission
* Milestone 5: Submission viewer
* Milestone 6: Signature canvas + initials canvas
* Milestone 7: Google Drive integration setup
* Milestone 7.1: Dashboard navigation layout
* Milestone 8: Upload files to connected Google Drive
* Milestone 8.1: Google Drive upload debugging/fix
* Milestone 8.2: Google Drive folder selection + organized upload folders
* Milestone 8.3: Upload UX + Google Drive notices
* Milestone 9: Super Admin foundation

Current state:

* FormOS is deployed live on Hostinger.
* Supabase is connected.
* Prisma Migrate deployment workflow is active.
* Super Admin dashboard exists but is mostly view-only.
* Do not touch CommerceOS.

## Goal

Add Office Use Only fields.

A form owner should be able to mark certain fields as internal/office-only in the builder.

Public users should not see or fill office-only fields.

After a submission is received, the form owner should be able to fill office-only fields from the submission detail page.

This is important for agreement and application workflows where the business completes internal details after the customer submits the form.

## Example Use Case

Vehicle Hire Agreement:

Public submitter fills:

* full name
* date of birth
* phone
* driving licence number
* address
* uploaded ID images
* signature

Office fills later:

* vehicle registration
* weekly rent
* bond amount
* pickup date
* pickup time
* fuel level
* vehicle clean/washed
* internal notes
* approval/processing details

## Field Visibility

Add field visibility support.

Each form field should support:

visibility: "PUBLIC" | "OFFICE"

Default:

PUBLIC

If missing on older fields, treat as PUBLIC.

## Builder Update

In the form builder, each field should have an option:

Office use only

This should set:

visibility = "OFFICE"

Rules:

* Office-only fields should still be saved in Form.fields.
* Office-only fields can be moved/reordered like other fields.
* Office-only fields should be visually marked in builder.
* Existing fields without visibility should behave as PUBLIC.

## Public Form Behaviour

Public form should only render fields where:

visibility is missing OR visibility === "PUBLIC"

Public form should not render office-only fields.

Public required validation should ignore office-only fields.

Public submission data should not include office-only fields.

Display-only fields marked as OFFICE should also be hidden from public form.

## Submission Model Update

Add fields to FormSubmission:

* officeData Json?
* officeCompletedAt DateTime?
* officeCompletedById String?

Create Prisma migration:

npx prisma migrate dev --name add_office_use_fields

Do not use prisma db push.

## Submission Detail Update

On /dashboard/forms/[formId]/submissions/[submissionId]:

Add an Office Use Only section.

Show all fields from formSnapshot.fields where:

visibility === "OFFICE"

Allow the form owner to fill/save office-only answers.

Supported office input field types for this milestone:

* text
* textarea
* date
* phone
* email
* address
* number
* currency
* select
* checkbox

For now:

* image_upload office fields can show "Not supported for office use yet"
* signature office fields can show "Not supported for office use yet"
* initials office fields can show "Not supported for office use yet"

Save office answers into:

FormSubmission.officeData

Do not mix office answers into public data.

## Office Completion

Add a button:

Save Office Fields

Optional if simple:

Mark Office Completed

If implemented, Mark Office Completed should set:

* officeCompletedAt = now
* officeCompletedById = current user id

Do not send email yet.

## Security / Ownership

Only the form owner can edit officeData.

Logged-out users cannot access submission detail.

Other users cannot access or edit another owner’s office fields.

Super Admin should not edit office fields in this milestone.

## Answer Rendering

Submission detail page should show:

1. Public submitted answers
2. Uploaded files/signatures
3. Office Use Only fields and saved office answers

Use labels from formSnapshot.fields.

## Out of Scope

Do not build email notifications.
Do not send completed form to submitter yet.
Do not build PDF export.
Do not build PDF import.
Do not build templates.
Do not build office file uploads.
Do not build office signatures.
Do not build Super Admin edit actions.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 10 is complete when:

* Builder supports Office use only checkbox per field.
* Field visibility is saved as PUBLIC or OFFICE.
* Older fields without visibility still work as PUBLIC.
* Public form hides office-only fields.
* Public validation ignores office-only fields.
* Public submission does not save office-only values in public data.
* FormSubmission has officeData, officeCompletedAt, officeCompletedById fields.
* Prisma migration exists for office use fields.
* Submission detail shows Office Use Only section.
* Form owner can fill and save office fields.
* Saved officeData persists after refresh.
* Office fields are separate from public submission data.
* Owner-only security is enforced.
* Super Admin does not get office edit access in this milestone.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.