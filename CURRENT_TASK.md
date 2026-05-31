# CURRENT TASK — FormOS Milestone 8.2: Google Drive Folder Selection + Organized Upload Folders

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

Current state:

* FormOS is deployed live.
* Supabase is connected.
* Google Drive connection works.
* File upload path has been debugged/fixed.
* Do not touch CommerceOS.

## Goal

Allow the FormOS user/form owner to choose a Google Drive parent folder for uploads.

When public users upload files through forms, FormOS should organize uploaded files inside the selected folder using this structure:

Selected Google Drive Folder/
Form Title/
Submitter Name - Submission ID/
uploaded files

If no submitter name is found, use:

Selected Google Drive Folder/
Form Title/
submission-{submissionId}/
uploaded files

## Product Behaviour

A logged-in FormOS user should be able to:

1. Go to Dashboard → Settings / Integrations.
2. See Google Drive connected status.
3. Add a Google Drive folder URL or folder ID.
4. Save it as the upload parent folder.
5. See the selected folder name after saving.
6. Clear/reset the selected folder.

When a public form is submitted with file uploads:

1. FormOS uploads files into the selected Google Drive parent folder.
2. Inside that parent folder, FormOS creates or reuses a folder named after the form title.
3. Inside the form title folder, FormOS creates a folder named after the submitter if a name field exists.
4. If no name field exists or value is empty, FormOS creates a folder using submission ID.
5. Files are uploaded into that final submission folder.
6. FormOS stores only safe Google Drive metadata in FormSubmission.files.

## Drive Folder Structure

Example:

Selected folder:
CabCare Driver Forms

Form title:
Vehicle Hire Agreement

Submitter name:
Ali Khan

Submission ID:
cm8x123abc

Final structure:

CabCare Driver Forms/
Vehicle Hire Agreement/
Ali Khan - cm8x123/
licence-front.jpg
licence-back.jpg

Fallback:

CabCare Driver Forms/
Vehicle Hire Agreement/
submission-cm8x123/
licence-front.jpg

## Google Drive Folder Input

On /dashboard/settings/integrations, add:

* Google Drive Folder URL or Folder ID input
* Save Upload Folder button
* Clear Upload Folder button
* Current selected folder display:

  * folder name
  * folder ID, partially shown if preferred

Accept either:

* Raw folder ID
* Folder URL like:
  https://drive.google.com/drive/folders/{folderId}

## Folder Validation

When saving folder:

1. Extract folderId safely.
2. Use connected Google Drive token.
3. Call Drive API to check the folder exists.
4. Confirm mimeType is:
   application/vnd.google-apps.folder
5. Save folder ID and name in UserIntegration.metadata.

Suggested metadata shape:

{
"uploadFolder": {
"id": "folderId",
"name": "Folder Name",
"configuredAt": "ISO date"
}
}

Reject invalid/inaccessible/non-folder IDs with friendly error.

## Upload Folder Logic

Update Google Drive upload helpers to support:

* getConfiguredUploadFolderForUser
* ensureDriveFolder
* ensureFormFolder
* ensureSubmissionFolder
* sanitizeDriveFolderName
* extractSubmitterName

Folder logic:

1. Parent folder:

   * use configured uploadFolder.id if present
   * otherwise create/use default "FormOS Uploads" folder

2. Form folder:

   * create/reuse folder using sanitized form title

3. Submission folder:

   * try to extract submitter name from submitted data
   * use first public text-like field where label includes:

     * name
     * full name
     * driver name
     * customer name
     * client name
     * applicant name
     * your name
   * sanitize folder name
   * use "{submitterName} - {shortSubmissionId}"
   * fallback to "submission-{shortSubmissionId}"

4. Upload files into the submission folder.

## Submitter Name Detection

Create helper:

extractSubmitterName(fields, data)

Rules:

* Only use submitted public answer fields.
* Prefer text-like fields:

  * text
  * textarea
* Look for field labels containing name-related words.
* Ignore display-only fields.
* Ignore office/internal fields if such visibility exists later.
* Trim whitespace.
* Sanitize unsafe characters.
* Limit folder name length.

Fallback:

submission-{shortSubmissionId}

## File Metadata

Update FormSubmission.files metadata to include:

* provider
* driveFileId
* fileName
* mimeType
* size
* webViewLink
* webContentLink
* uploadedAt
* parentFolderId
* parentFolderName
* formFolderId
* formFolderName
* submissionFolderId
* submissionFolderName

Do not store file binary in database.

## Security Requirements

* Do not expose OAuth tokens.
* Do not log OAuth tokens.
* Do not log file contents.
* Only logged-in owner can configure their upload folder.
* Public submitter cannot choose target Drive folder.
* Validate folder server-side.
* Store safe metadata only.
* Friendly errors only.

## Out of Scope

Do not implement Google Picker yet.
Do not build Super Admin yet.
Do not build PDF export.
Do not build PDF import.
Do not build templates.
Do not build email notifications.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 8.2 is complete when:

* Connected user can save a Google Drive folder URL or folder ID.
* Invalid folder IDs are rejected.
* Selected folder name/status appears on integrations page.
* User can clear/reset selected folder.
* Public uploads go into selected parent folder.
* FormOS creates/reuses a form-title folder inside selected parent folder.
* FormOS creates a submitter-name folder inside form folder when name field exists.
* FormOS falls back to submission ID when name field is missing.
* Uploaded files are saved inside the correct final submission folder.
* FormSubmission.files stores folder metadata.
* Existing Google Drive upload still works.
* Existing public submissions still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.