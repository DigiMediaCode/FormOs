# CURRENT TASK — FormOS Milestone 8: Upload Files to Connected Google Drive

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

Current state:

* FormOS has its own .env
* FormOS uses its own PostgreSQL database
* FormOS runs on port 3001
* Form owners can connect Google Drive
* image_upload field exists in builder but is not functional yet
* Do not touch CommerceOS

## Goal

Make image/file upload fields functional by uploading submitted files to the form owner’s connected Google Drive.

FormOS should not permanently store uploaded files on its own server.

This is important because uploaded files may include sensitive ID documents, driving licences, or other private documents.

## Product Behaviour

When a public user submits a form with image_upload fields:

1. FormOS checks whether the form owner has connected Google Drive.
2. If Drive is connected, FormOS uploads the submitted file to the owner’s Google Drive.
3. FormOS stores only metadata/link information in FormSubmission.files.
4. FormOS does not permanently store the file on FormOS server.
5. Submission viewer shows file metadata and a Drive link if available.

If Drive is not connected:

* image_upload fields should show a clear unavailable message.
* required image_upload fields should prevent submission.
* non-required image_upload fields can be skipped.

## Field Type To Implement

Implement public input support for:

* image_upload

## Public Form Behaviour

For image_upload fields:

* Render a file input.
* Accept images by default.
* Support required validation.
* Show helper text explaining files will be uploaded to the form owner’s Google Drive.
* If owner has no Google Drive integration, show upload unavailable message.

## Upload Rules

Allowed MIME types for MVP:

* image/jpeg
* image/png
* image/webp
* application/pdf

Maximum file size for MVP:

* 10MB

Reject unsupported files with friendly error.

Do not allow executable files.

## Google Drive Upload

Use the form owner’s saved Google Drive integration.

Use the narrow Google Drive scope already configured:

https://www.googleapis.com/auth/drive.file

Upload files into a folder structure like:

FormOS Uploads/
{Form Title}/
submission-{submissionId}/
{originalFileName}

If folder creation is too much for this milestone, use a simpler FormOS Uploads folder first, but keep helper functions structured so nested folders can be added later.

## Important Submission Flow

Current submission logic creates FormSubmission after validation.

For file uploads, we need a safe order.

Recommended:

1. Validate form and fields.
2. Validate files.
3. Create FormSubmission record with normal data/signatures first.
4. Upload files to Google Drive using submissionId in folder name.
5. Update FormSubmission.files with uploaded file metadata.
6. If file upload fails for a required image field, return friendly error and avoid leaving bad/partial submission if possible.

If atomic rollback is difficult, mark the submission clearly or delete failed submission.

## Storage Rules

Save uploaded file metadata in:

FormSubmission.files

Suggested shape:

{
"fieldId": [
{
"provider": "google_drive",
"driveFileId": "abc123",
"fileName": "licence-front.jpg",
"mimeType": "image/jpeg",
"size": 123456,
"webViewLink": "https://drive.google.com/...",
"webContentLink": "https://drive.google.com/...",
"uploadedAt": "2026-05-30T..."
}
]
}

Do not store file binary in database.

Do not store files permanently on FormOS server.

## Google Drive Helpers

Create or update helpers under:

lib/integrations/google-drive/

Suggested helpers:

* getGoogleDriveClientForUser
* ensureFormOSRootFolder
* ensureDriveFolder
* uploadFileToDrive

These helpers should:

* load owner’s Google Drive integration
* decrypt tokens through centralized token helpers
* refresh token if needed, if already supported by current OAuth client
* upload file stream/buffer to Drive
* return safe metadata only

## Public Submit Update

Update submitPublicForm to handle FormData with files.

It should:

* process normal fields
* process signature/initials
* process image_upload files
* validate required image_upload fields
* upload files to owner’s Google Drive if connected
* save file metadata in FormSubmission.files
* continue saving formSnapshot
* continue saving metadata

## Submission Viewer Update

Update submission detail page to display uploaded files.

For image_upload fields:

* use labels from formSnapshot.fields
* show file name
* show MIME type
* show size
* show link to Google Drive file if webViewLink exists
* do not attempt to proxy/download file through FormOS

## Security Requirements

* Only use owner’s connected Google Drive tokens server-side.
* Do not expose OAuth tokens.
* Do not log tokens.
* Do not log uploaded file contents.
* Validate file type and size server-side.
* Do not permanently store uploaded files on FormOS.
* Do not expose files publicly through FormOS.
* Store only safe metadata.
* Friendly errors only.

## Out of Scope

Do not build local/S3/R2 file storage.
Do not build PDF export.
Do not build PDF import.
Do not build templates.
Do not build email notifications.
Do not build file previews inside FormOS.
Do not build virus scanning yet.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 8 is complete when:

* image_upload fields render as functional file inputs on public forms.
* Supported image/PDF files can be uploaded.
* Unsupported file types are rejected.
* Files over 10MB are rejected.
* Required image_upload validation works.
* If owner has no Google Drive connected, uploads are unavailable and required upload fields block submission.
* If owner has Google Drive connected, files upload to their Drive.
* FormSubmission.files stores safe Google Drive metadata only.
* File binaries are not stored in the database.
* Submission detail page displays uploaded file metadata and Drive links.
* Existing text/select/checkbox/signature/initials submissions still work.
* Tokens are not exposed or logged.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.