# CURRENT TASK — FormOS Milestone 13.4: Global Button Pending States and Action Messages

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Public form submit button disables on click.
* Other buttons/actions do not consistently disable after click.
* Users may double-click actions and cause duplicate requests.
* FormOS is live and already has many server actions.
* Do not touch CommerceOS.

## Problem

Only the public form submit button has proper pending/loading state.

Other buttons can be clicked multiple times, including actions like:

* login
* signup
* create form
* update form
* publish/unpublish
* archive
* save builder
* save integrations
* disconnect integrations
* set active provider
* save office fields
* mark office completed
* download PDF
* template creation

This can cause duplicate records, duplicate notifications, duplicate PDF emails, duplicated folders/files, or confusing UI.

## Goal

Add consistent pending/loading UX for action buttons across FormOS.

When a user clicks an action button:

* button should disable immediately
* button text should change to a meaningful loading message
* related buttons in the same action area should be disabled where needed
* a corresponding status message should appear at the top of the page/section
* double-clicks should be prevented
* if action fails, button should become usable again and error should show
* if action succeeds, user should see clear success or be redirected normally

## Global UX Direction

Use a reusable client component or helper pattern where practical.

Do not copy messy pending-state code everywhere if it can be avoided.

Suggested options:

* reusable SubmitButton component using useFormStatus
* reusable PendingButton component for client actions
* action status banner component
* form-level pending state where needed

Use the simplest reliable approach for the current codebase.

## Top Message Requirement

When an action starts, show a message near the top of the current page or relevant section.

Examples:

Login:

* Signing you in...

Signup:

* Creating your account...

Create form:

* Creating form...

Save form details:

* Saving form details...

Publish:

* Publishing form...

Unpublish:

* Unpublishing form...

Archive:

* Archiving form...

Save builder:

* Saving form fields...

Create template:

* Creating template...

Save integration settings:

* Saving integration settings...

Connect integration:

* Redirecting to provider...

Disconnect integration:

* Disconnecting integration...

Set active provider:

* Updating active storage provider...

Save office fields:

* Saving office fields...

Mark office completed:

* Completing submission and sending PDF...

Download PDF:

* Generating PDF...

## Areas To Update

Update pending/disabled UX for at least these areas:

### Auth

* /login
* /signup
* logout button if practical

### Forms

* /dashboard/forms/new
* /dashboard/forms/[formId]
* /dashboard/forms/[formId]/builder
* template creation button

### Public Form

* keep existing submit pending behaviour
* ensure all public action buttons in the form are handled properly
* signature clear/use-first-signature buttons should not break while submitting

### Integrations

* /dashboard/settings/integrations
* connect Google Drive
* disconnect Google Drive
* save Google Drive folder
* connect Dropbox
* disconnect Dropbox
* save Dropbox folder
* set active provider

### Submissions / Office Use

* save office fields
* mark office completed
* download completed PDF

### Super Admin

If Super Admin has action buttons, add pending states.
If Super Admin is view-only, no action needed.

## Double Submission Prevention

Prevent double-clicks for server actions.

For form submissions:

* use pending state from useFormStatus where possible
* disable submit buttons while pending

For client-triggered actions:

* use local isPending state
* ignore subsequent clicks while pending

For server-side critical actions, keep backend idempotency where practical.

Especially important:

* mark office completed should not resend PDF repeatedly
* create template should not create duplicate forms on double-click
* archive/publish/unpublish should not double-run

## Styling

Use existing Tailwind styling.

Disabled buttons should look visibly disabled:

* opacity reduced
* cursor-not-allowed
* no hover effect if possible

Status message should be simple:

* success/info/error style if already available
* otherwise use basic bordered alert box

## Security / Safety

Do not expose secrets.

Do not log sensitive data.

Do not change business logic unless needed to prevent duplicates.

Do not weaken server-side validation.

## Out of Scope

Do not redesign the whole UI.
Do not add toast library unless absolutely necessary.
Do not build a full notification system.
Do not change database schema unless absolutely necessary.
Do not change email provider.
Do not change Google Drive/Dropbox logic.
Do not integrate CommerceOS.

## Acceptance Criteria

This milestone is complete when:

* Login button disables and shows pending text.
* Signup button disables and shows pending text.
* Create form button disables and shows pending text.
* Save/update form buttons disable and show pending text.
* Publish/unpublish/archive buttons disable and show pending text.
* Builder save button disables and shows pending text.
* Template creation button disables and shows pending text.
* Integration action buttons disable and show pending text.
* Office save/complete buttons disable and show pending text.
* Download PDF button disables and shows pending text if applicable.
* Top/section status messages appear for major actions.
* Double-clicks are prevented for important actions.
* Existing form submission flow still works.
* Existing Google Drive/Dropbox uploads still work.
* Existing PDF email flow still works.
* Existing auth still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.