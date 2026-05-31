# CURRENT TASK — FormOS Milestone 11.1: Dropbox Storage Provider

## Project Context

FormOS is a standalone SaaS-style form builder project.

Completed:

* Core form builder workflow
* Public submissions
* Google Drive uploads
* Google Drive folder selection and organized upload folders
* Office Use Only fields
* Super Admin foundation
* Lark email notifications
* Live Hostinger deployment
* Prisma Migrate deployment workflow

Current state:

* FormOS supports Google Drive as upload storage.
* Some real users may use Dropbox instead of Google Drive.
* Do not touch CommerceOS.

## Goal

Add Dropbox as an alternative upload storage provider.

A FormOS user should be able to connect either Google Drive or Dropbox and choose which provider should be used for public form file uploads.

Public submitters should not choose the provider.

The form owner chooses their active upload provider.

## Product Behaviour

A logged-in form owner can:

1. Go to Settings / Integrations.
2. Connect Google Drive.
3. Connect Dropbox.
4. See connected/disconnected status for both.
5. Choose active upload storage provider:

   * Google Drive
   * Dropbox
6. Configure upload location:

   * Google Drive folder ID/URL as already implemented.
   * Dropbox parent folder path, such as /FormOS Uploads or /CabCare Driver Forms.
7. Public form uploads go to the selected active provider.

## Important Rule

Only one active upload provider should be used per user at a time.

If activeProvider = GOOGLE_DRIVE:

* uploads use Google Drive logic.

If activeProvider = DROPBOX:

* uploads use Dropbox logic.

If no provider is active:

* prefer connected provider if exactly one exists.
* if none connected, image uploads are unavailable.
* if both connected but no active provider, show owner warning and block uploads until one is selected.

## Dropbox OAuth

Create one Dropbox app for FormOS.

Each FormOS user connects their own Dropbox account using OAuth.

Add environment variables:

DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=
DROPBOX_REDIRECT_URI=

Do not commit real secrets.

## Dropbox OAuth Routes

Create:

* /api/integrations/dropbox/connect
* /api/integrations/dropbox/callback
* /api/integrations/dropbox/disconnect

Use OAuth state tied to current logged-in user/session, similar to Google Drive.

## Dropbox Integration Storage

Use existing UserIntegration model.

Add IntegrationProvider enum value:

DROPBOX

Store Dropbox tokens in UserIntegration:

* accessToken
* refreshToken if available
* expiresAt
* scope
* metadata

Use centralized token helpers.

Do not expose tokens.

Do not log tokens.

## Active Upload Provider

Add support for active upload provider.

Preferred clean option:

Add Prisma model:

UserUploadSettings {
id
userId
activeProvider
createdAt
updatedAt
}

enum StorageProvider {
GOOGLE_DRIVE
DROPBOX
}

If there is already a user settings model, reuse it.

Create Prisma migration:

npx prisma migrate dev --name add_dropbox_storage_provider

Do not use prisma db push.

## Dropbox Folder Configuration

On /dashboard/settings/integrations, if Dropbox is connected, show:

* Dropbox parent folder path input
* Save Dropbox folder path button
* current configured Dropbox folder path
* Clear Dropbox folder path button

Default Dropbox folder path:

/FormOS Uploads

Store in UserIntegration.metadata:

{
"uploadFolder": {
"path": "/FormOS Uploads",
"configuredAt": "ISO date"
}
}

Validate:

* must start with /
* should not contain dangerous path traversal like ..
* should be reasonable length
* normalize repeated slashes

## Dropbox Upload Folder Structure

When active provider is Dropbox, uploaded files should be stored like:

{configuredDropboxParentPath}/{Form Title}/{Submitter Name - Submission ID}/{fileName}

Example:

/CabCare Driver Forms/Vehicle Hire Agreement/Ali Khan - cm8x123/licence-front.jpg

Fallback submitter folder:

/CabCare Driver Forms/Vehicle Hire Agreement/submission-cm8x123/licence-front.jpg

Use existing form title and submitter name extraction logic where possible.

## Dropbox Upload Helper

Create helpers under:

lib/integrations/dropbox/

Suggested helpers:

* getDropboxOAuthUrl
* exchangeDropboxCode
* getDropboxClientForUser
* saveDropboxIntegration
* disconnectDropbox
* saveDropboxUploadFolder
* uploadFileToDropbox
* normalizeDropboxPath
* ensureDropboxFolderPath if needed

Upload should use Dropbox API.

For MVP, folder creation can be done by calling create_folder_v2 for each needed path if not existing.

File upload should upload the file bytes to the final path.

Return safe metadata only.

## Uploaded File Metadata

When Dropbox is used, FormSubmission.files should store metadata like:

{
"provider": "dropbox",
"dropboxFileId": "id:...",
"fileName": "licence-front.jpg",
"mimeType": "image/jpeg",
"size": 123456,
"path": "/CabCare Driver Forms/Vehicle Hire Agreement/Ali Khan - cm8x123/licence-front.jpg",
"parentPath": "/CabCare Driver Forms",
"formFolderPath": "/CabCare Driver Forms/Vehicle Hire Agreement",
"submissionFolderPath": "/CabCare Driver Forms/Vehicle Hire Agreement/Ali Khan - cm8x123",
"uploadedAt": "ISO date"
}

Do not store file binary in database.

Do not store file permanently on FormOS server.

## Settings UI

Update /dashboard/settings/integrations to show:

Google Drive card:

* connected/disconnected
* folder config
* active provider status
* set as active button

Dropbox card:

* connected/disconnected
* connect/disconnect
* folder path config
* active provider status
* set as active button

If both providers are connected but none active, show warning:

Choose an active upload storage provider before using image upload fields.

## Public Form Upload Logic

Update upload logic to route based on active provider.

* Google Drive active → existing Google Drive upload
* Dropbox active → Dropbox upload
* none active → upload unavailable

Existing public image upload warnings should reflect active provider status.

Public submitter should see:

Uploaded files are sent to the form owner's connected storage provider. FormOS does not permanently store your uploaded files on its server.

If Dropbox active, optionally say Dropbox.

If Google active, optionally say Google Drive.

## Submission Viewer

Update submission detail page to show uploaded file metadata for both providers.

For Google Drive:

* existing Drive link if available

For Dropbox:

* show file name, MIME type, size, Dropbox path
* Do not expose token
* If a share/view link is not created, do not show link
* Do not make Dropbox file public automatically in this milestone

## Security Requirements

* Do not expose Dropbox tokens.
* Do not expose Google tokens.
* Do not log tokens.
* Do not log file contents.
* Public submitter cannot choose provider/path.
* Only logged-in owner can connect/disconnect/configure provider.
* Only owner can set active provider.
* Store only safe metadata.
* Friendly errors only.

## Out of Scope

Do not build Dropbox folder picker.
Do not create public Dropbox share links.
Do not make Dropbox files public.
Do not build PDF export.
Do not build PDF import.
Do not build template marketplace.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 11.1 is complete when:

* DROPBOX exists in IntegrationProvider enum.
* Dropbox OAuth connect/callback/disconnect routes exist.
* User can connect Dropbox.
* User can disconnect Dropbox.
* User can configure Dropbox parent folder path.
* User can set active upload provider to Google Drive or Dropbox.
* Public image uploads use active provider.
* Dropbox uploads store files in organized folder path:
  parent/form-title/submitter-or-submission-id/file
* FormSubmission.files stores safe Dropbox metadata only.
* Google Drive upload still works.
* Public form upload warnings handle both providers.
* Submission detail displays Google or Dropbox metadata correctly.
* Tokens are not exposed.
* npx prisma validate passes.
* npx prisma generate passes.
* Prisma migration exists if schema changed.
* npm run build passes.