# CURRENT TASK — FormOS Milestone 15: Form Builder UI Polish + Field Settings Cleanup

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Forms CRUD works.
* Form builder works.
* Public forms work.
* Google Drive and Dropbox uploads work.
* Storage provider selection works.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Do not touch CommerceOS.

## Goal

Improve the Form Builder UI and field settings experience.

The current builder works, but now it needs to feel more modern, cleaner, and easier for real users to manage forms.

This milestone is focused on builder usability and UI polish only.

## Important Direction

Do not build drag-and-drop yet.

Do not rebuild the whole app.

Do not change database schema unless absolutely necessary.

Do not change public form submission logic.

Do not change Google Drive or Dropbox logic.

Do not change PDF/email/audit logic.

This milestone is mainly UI cleanup and safer field editing.

## Builder Route

Focus on:

* /dashboard/forms/[formId]/builder

Also update nearby navigation/buttons if needed.

## Builder Layout Goals

Improve the builder page layout.

Suggested direction:

* clean page header with form title, status, and version
* clear Back to Form button
* clear Save Fields button
* left/main column for field list
* right sidebar or top panel for Add Field controls
* modern card-based field editor
* better empty state if no fields exist
* preview area should be clean and readable

## Field Card Improvements

Each field card should clearly show:

* field label
* field type badge
* required status
* office-use status if enabled
* order controls
* delete button
* collapsed/expanded settings if easy

Use clear labels like:

* Required
* Office Use Only
* Display Only
* Upload Field
* Signature Field

## Field Type Labels

Show human-friendly field type names.

Examples:

* text → Text
* textarea → Long Text
* date → Date
* phone → Phone
* email → Email
* address → Address
* number → Number
* currency → Currency
* select → Dropdown
* checkbox → Checkbox
* image_upload → File Upload
* signature → Signature
* initials → Initials
* static_text → Static Text
* section_heading → Section Heading
* html → HTML Content

## Add Field Controls

Improve the Add Field area.

Group field types if practical:

Basic Fields:

* Text
* Long Text
* Email
* Phone
* Address
* Date
* Number
* Currency

Choice Fields:

* Dropdown
* Checkbox

Agreement Fields:

* Signature
* Initials
* Static Text
* Section Heading
* HTML Content

Upload Fields:

* File Upload

Do not add new field types in this milestone.

## Field Settings Cleanup

For each field type, show only relevant settings.

Examples:

Text/email/phone/address:

* label
* placeholder
* required
* office use only

Textarea:

* label
* placeholder
* required
* office use only

Select:

* label
* required
* office use only
* options editor

Checkbox:

* label
* required
* office use only

Image Upload:

* label
* required
* office use only
* helper/warning:
  "Uploads require Google Drive or Dropbox to be connected."

Signature/Initials:

* label
* required
* office use only
* helper:
  "Used for signed agreements."

Section Heading:

* content/label
* office use only

Static Text / HTML:

* content editor
* office use only
* display-only badge

## Office Use Only UI

Make Office Use Only clearer.

When enabled:

* show badge: Office Use Only
* maybe use subtle warning/info style
* helper text:
  "This field will not appear on the public form. It can be completed by the form owner after submission."

## Required Field UI

Make required toggle clearer.

When enabled:

* show badge: Required

For display-only fields:

* required toggle should be hidden or disabled if it does not apply
* display-only fields should not be required

Display-only fields:

* static_text
* section_heading
* html

## Select Options UI

Improve select option editing.

Requirements:

* allow adding option rows
* allow removing option rows
* clearly show label/value if current system supports both
* prevent empty option labels if practical
* keep existing saved schema compatible

Do not overbuild advanced option logic.

## Preview Improvements

Improve preview panel.

Preview should show roughly how fields will appear publicly.

For office-only fields:

* either hide from preview by default OR show with an Office Use Only badge
* if possible, add note:
  "Office-only fields are hidden from public form."

Preview does not need to be perfect.

## Save UX

Keep the pending button behaviour from previous milestone.

Save button should:

* disable while saving
* show "Saving form fields..."
* show success/error message if current pattern supports it

Do not break existing pending state.

## Google Drive / Dropbox Warning

If form has image_upload fields and no active upload provider is configured:

Show warning in builder:

"This form contains file upload fields, but no active storage provider is configured. Public users will not be able to upload files until Google Drive or Dropbox is connected and selected."

Link:

Go to Settings / Integrations

## Styling Direction

Make it modern and clean using Tailwind.

Desired feel:

* light background
* rounded cards
* subtle borders
* good spacing
* clear buttons
* readable labels
* not cramped

Do not introduce a heavy UI library.

## Out of Scope

Do not add drag-and-drop.
Do not add QR codes yet.
Do not build subscription packages yet.
Do not build billing.
Do not add new field types.
Do not change public form logic unless required for preview compatibility.
Do not change PDF/email logic.
Do not change storage provider logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 15 is complete when:

* Builder page looks cleaner and more modern.
* Field cards are easier to understand.
* Field type labels are human-readable.
* Add Field controls are better organized.
* Office Use Only setting is clearer.
* Required setting is clearer.
* Display-only fields are marked clearly.
* Select option editor is improved.
* Preview is cleaner.
* Save pending UX still works.
* Upload provider warning appears when needed.
* Existing forms can still be edited.
* Existing Vehicle Hire Agreement template can still be edited.
* Existing public form rendering still works.
* Existing Office Use Only fields still work.
* Existing Google Drive/Dropbox upload flow still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.