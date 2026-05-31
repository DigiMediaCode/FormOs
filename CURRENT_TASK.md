# CURRENT TASK — FormOS Milestone 8.3: Upload UX + Google Drive Notices

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

Current state:

* FormOS is deployed live.
* Supabase is connected.
* Google Drive connection works.
* Uploads to Google Drive work.
* Selected parent folder works.
* Form title and submitter-name folders work.
* Do not touch CommerceOS.

## Goal

Improve the public upload submission experience and add clear Google Drive notices.

Currently, photo/file uploads can take time, and the public user does not clearly know that submission is in progress. This can cause double-clicking and duplicate submissions.

Also, users should be clearly informed that uploaded files go to the form owner’s Google Drive and are not permanently stored on FormOS.

## Public Form Submit UX

When the public user submits a form:

* Disable the submit button immediately.
* Change submit button text to:
  Submitting...
* If the form has image uploads, show:
  Please wait. Your files are uploading.
* Prevent double submission.
* If submission fails, re-enable the submit button.
* If submission succeeds, show the existing success message.

## Image Upload Disclaimer

Under every image_upload field on the public form, show:

Uploaded files are sent to the form owner’s connected Google Drive. FormOS does not permanently store your uploaded files on its server.

Keep the wording clear and user-friendly.

## Google Drive Not Connected Message

If the form has image_upload fields and the form owner has not connected Google Drive:

On the public form, under the image_upload field, show:

File uploads are currently unavailable because the form owner has not connected Google Drive.

If the field is required, public submission should remain blocked with friendly error.

## Dashboard / Builder Warning

If a logged-in form owner has a form with image_upload fields but has not connected Google Drive, show a warning on relevant admin pages.

Show this warning on at least:

* /dashboard/forms/[formId]
* /dashboard/forms/[formId]/builder

Warning text:

This form contains image upload fields, but Google Drive is not connected. Public users will not be able to upload files until Google Drive is set up.

Include link:

Go to Settings / Integrations

## Implementation Notes

The public form likely needs a client component wrapper or client submit state.

Do not break existing server action validation.

Use simple state:

* isSubmitting
* hasUploadFields

Disable button when isSubmitting is true.

## Security / Safety

* Do not expose Google Drive tokens.
* Do not expose private integration data.
* Do not log uploaded file contents.
* Keep all existing upload validation.
* Keep all existing Drive upload logic.
* Do not change where files are stored.

## Out of Scope

Do not build progress percentage.
Do not build resumable uploads.
Do not build Google Picker.
Do not build Super Admin.
Do not build PDF export.
Do not build PDF import.
Do not build templates.
Do not build email notifications.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 8.3 is complete when:

* Submit button disables immediately after click.
* Submit button shows “Submitting...” while submission is in progress.
* Uploading message appears for forms with image_upload fields.
* Double submission is prevented.
* Button re-enables if validation/upload fails.
* Public image_upload fields show the Google Drive storage disclaimer.
* Public image_upload fields show unavailable message when Drive is not connected.
* Required image_upload validation still works.
* Form detail page warns owner if image_upload exists but Drive is not connected.
* Builder page warns owner if image_upload exists but Drive is not connected.
* Existing public submissions still work.
* Existing Google Drive upload still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.