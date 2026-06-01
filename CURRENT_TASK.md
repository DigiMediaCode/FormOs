# CURRENT TASK — FormOS Milestone 14: Submission Activity Timeline / Audit Trail

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS is deployed live on Hostinger.
* Supabase is connected.
* Prisma Migrate deployment workflow is active.
* Forms CRUD works.
* Builder works.
* Public submissions work.
* Google Drive uploads work.
* Dropbox uploads work.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation works.
* Completed PDF is emailed to owner and submitter.
* Super Admin foundation exists.
* Do not touch CommerceOS.

## Goal

Add a submission activity timeline / audit trail.

Form owners should be able to see a clear timeline of important events for each submission.

This is especially important for agreement-style forms where signatures, files, office completion, and PDF delivery matter.

## Required Events To Track

Track these events where applicable:

* submission_created
* file_uploaded
* signature_captured
* office_fields_saved
* submission_finalized
* pdf_generated
* pdf_emailed_to_owner
* pdf_emailed_to_submitter
* pdf_email_failed
* owner_viewed_submission

Do not overbuild. These can be simple event records.

## Prisma Model

Add a model such as:

SubmissionEvent {
id           String   @id @default(cuid())
submissionId String
formId       String
ownerId      String
type         String
message      String?
metadata     Json?
createdAt    DateTime @default(now())

submission   FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

@@index([submissionId])
@@index([formId])
@@index([ownerId])
@@index([type])
}

If enum is cleaner, use an enum for event type, but string is acceptable for MVP flexibility.

Create migration:

npx prisma migrate dev --name add_submission_events

Do not use prisma db push.

## Event Helper

Create helper such as:

createSubmissionEvent

Suggested location:

lib/forms/submission-events.ts

It should:

* create event record safely
* not throw in a way that breaks main business flow unless absolutely critical
* accept submissionId, formId, ownerId, type, message, metadata
* avoid logging sensitive data
* not store OAuth tokens
* not store uploaded file contents
* not store full submission answers

## Where To Add Events

Add event creation to existing flows:

### Public Submission

When submission is created:

* type: submission_created
* message: Submission received

If signatures exist:

* type: signature_captured
* message: Signature fields captured
* metadata can include count only

If files uploaded:

* type: file_uploaded
* message: Files uploaded
* metadata can include provider and count only

Do not store file links or full paths in event metadata unless already safe and necessary.

### Submission Detail View

When owner opens submission detail:

* type: owner_viewed_submission
* message: Owner viewed submission

Avoid creating excessive duplicate events if page is refreshed repeatedly.

If simple, only log first view or throttle by checking recent event.

If not simple, skip this event for now.

### Office Use

When office fields are saved:

* type: office_fields_saved
* message: Office fields saved

When submission is finalized:

* type: submission_finalized
* message: Submission finalized

When PDF is generated:

* type: pdf_generated
* message: Completed PDF generated

When PDF email is sent to owner:

* type: pdf_emailed_to_owner
* message: Completed PDF emailed to owner

When PDF email is sent to submitter:

* type: pdf_emailed_to_submitter
* message: Completed PDF emailed to submitter

When PDF email fails:

* type: pdf_email_failed
* message: Completed PDF email failed
* metadata may include recipientType only, not full provider error if sensitive

## UI Update

Update submission detail page:

/dashboard/forms/[formId]/submissions/[submissionId]

Add a section:

Activity Timeline

Show events in reverse chronological order or chronological order.

Each timeline item should show:

* event message
* event type label if useful
* date/time
* small safe metadata summary if useful

Keep UI simple.

## Security

Only the form owner can view submission events.

Super Admin should not view detailed submission events in this milestone.

Do not expose:

* uploaded file links
* Google Drive links
* Dropbox links
* OAuth tokens
* Lark tokens
* full sensitive answers
* file contents

## Out of Scope

Do not build Super Admin audit logs.
Do not build export audit log.
Do not build legal-grade immutable audit trail.
Do not build IP/device fingerprinting beyond existing metadata.
Do not add public completed view.
Do not change PDF layout.
Do not change email provider.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 14 is complete when:

* SubmissionEvent model exists.
* Prisma migration exists.
* Submission creation creates an event.
* File upload creates a safe event when files exist.
* Signature capture creates a safe event when signatures exist.
* Office fields saved creates an event.
* Finalize Submission creates events for finalization, PDF generation, and email delivery.
* Email failure creates a safe failure event without breaking completion.
* Submission detail page shows Activity Timeline.
* Only form owner can view timeline.
* No file links/tokens/secrets are exposed in events.
* Existing public submission flow still works.
* Existing Google Drive and Dropbox uploads still work.
* Existing Finalize Submission/PDF email flow still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.