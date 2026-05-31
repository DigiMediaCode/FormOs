# CURRENT TASK — FormOS Milestone 11: Lark Email Notifications

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
* Milestone 10: Office Use Only fields

Current state:

* FormOS is deployed live on Hostinger.
* Supabase is connected.
* Prisma Migrate deployment workflow is active.
* Google Drive uploads work.
* Office Use Only fields work.
* Super Admin foundation exists.
* Do not touch CommerceOS.

## Goal

Add Lark-powered email notifications for important FormOS events.

The first email notifications should be:

1. User signup notification
2. User login notification
3. New form submission notification to form owner
4. Form completed notification to public submitter

Use Lark Suite as the email provider.

## Important Direction

Do not use Resend.

Do not remove the existing password login system.

Do not implement email OTP login yet.

Do not implement Lark SSO login yet.

This milestone is only about email notifications through Lark.

## Email Provider

Create an email abstraction so FormOS can use Lark now and optionally support other providers later.

Suggested structure:

lib/email/
send-email.ts
providers/lark.ts
templates/

Environment variables:

EMAIL_PROVIDER=lark
LARK_APP_ID=
LARK_APP_SECRET=
LARK_SENDER_EMAIL=
APP_URL=

Do not commit real secrets.

Do not expose Lark tokens or app secrets.

## Notification 1 — User Signup

When a user signs up successfully, send a welcome/signup email to the new user.

Subject:

Welcome to FormOS

Email should include:

* user name if available
* user email
* dashboard link
* short welcome message

Dashboard link:

{APP_URL}/dashboard

If email fails, signup should still succeed.

## Notification 2 — User Login

When a user logs in successfully, send a login notification email to that user.

Subject:

New login to your FormOS account

Email should include:

* user email
* login date/time
* short security notice:
  "If this was you, no action is needed. If this was not you, please secure your account."

If email fails, login should still succeed.

Do not send login email for failed login attempts.

Do not reveal whether an email exists during failed login.

## Notification 3 — Form Submitted to Owner

When a public form submission succeeds, send an email to the form owner.

Subject:

New submission received: {Form Title}

Email should include:

* form title
* submitted date/time
* submission dashboard link:
  {APP_URL}/dashboard/forms/{formId}/submissions/{submissionId}
* short message:
  "Log in to FormOS to review the submission and complete any office-use fields."

Do not include uploaded file links.

Do not include Google Drive file links.

Do not include OAuth tokens.

Do not include full sensitive answers by default.

If email fails, public submission should still succeed.

## Notification 4 — Form Completed to Submitter

When the form owner marks office use work as completed, send an email to the public submitter.

This should happen only when the submission transitions from incomplete to completed.

Do not send this email every time office fields are saved.

The email should go to the submitter email if FormOS can detect one.

Submitter email detection:

Create helper:

extractSubmitterEmail(fields, data)

Rules:

* Use formSnapshot.fields.
* Use submitted public data.
* Prefer fields of type email.
* If multiple email fields exist, use the first valid email field.
* If no email type exists, fallback to text fields with labels containing:

  * email
  * e-mail
  * your email
  * contact email
* Validate the detected value looks like an email.
* If no submitter email is found, skip the completed email safely and log a safe warning.

Subject:

Your form has been completed: {Form Title}

Email should include:

* form title
* completed date/time
* message that the form owner has completed processing the submission
* optional dashboard/public view link only if a safe public completed-view link already exists

For now, if no public completed-view route exists, do not include a link.

Do not include uploaded file links.

Do not include Google Drive file links.

Do not attach files.

Do not attach PDFs.

## Office Completion Trigger

Use the existing Office Use Only flow.

If there is already a Mark Office Completed button/action, send the completed email there.

If not, add a simple Mark Office Completed action/button.

Rules:

* Only the form owner can mark office work completed.
* Super Admin should not complete forms in this milestone.
* Email should only send when officeCompletedAt was previously empty and is now being set.
* If officeCompletedAt already exists, do not resend automatically.

## App URL

Use the existing APP_URL helper.

Do not generate links using:

* 0.0.0.0
* localhost
* 127.0.0.1
* request host in production

All production email links must use APP_URL.

## Error Handling

Email failure must not break core actions.

If email fails:

* signup still succeeds
* login still succeeds
* submission still succeeds
* office completion still succeeds
* server logs only safe error message
* user does not see raw Lark/provider error

## Security Requirements

Do not log:

* LARK_APP_SECRET
* Lark access tokens
* OAuth tokens
* passwords
* uploaded file contents
* full sensitive submission data

Do not include in emails:

* Google Drive file links
* uploaded file links
* OAuth tokens
* passwords
* full sensitive submission answers by default

## Lark Provider Requirements

Implement Lark email provider safely.

The provider should:

* obtain required Lark app/tenant token if needed
* send email from LARK_SENDER_EMAIL
* support subject
* support recipient
* support text body
* optionally support HTML body
* handle API errors safely
* never expose app secret or tokens

## Out of Scope

Do not build email OTP login yet.
Do not build Lark SSO login yet.
Do not remove password login.
Do not send PDF attachments.
Do not attach uploaded files.
Do not build email template editor.
Do not build notification preferences UI.
Do not build SMS/WhatsApp.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 11 is complete when:

* Lark email provider abstraction exists.
* Lark environment variables are documented in .env.example.
* Signup sends welcome email if Lark is configured.
* Login sends successful-login notification email if Lark is configured.
* Failed login does not send login email.
* New public form submission sends email to form owner.
* Form completed sends email to submitter if submitter email can be detected.
* Form completed email is not resent repeatedly when already completed.
* Email failure does not break signup, login, public submission, or office completion.
* Emails do not include uploaded file links.
* Emails do not include Google Drive links.
* Emails do not expose Lark tokens, OAuth tokens, or secrets.
* Existing auth still works.
* Existing public form submission still works.
* Existing Google Drive upload still works.
* Existing Office Use Only flow still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.