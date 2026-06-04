# FormOS Security Checklist

Use this checklist before deploying security-sensitive changes.

## Access Control

* Confirm a logged-out user cannot access `/dashboard`.
* Confirm a normal user cannot access `/admin`.
* Confirm a workspace STAFF user cannot access `/dashboard/settings/billing`.
* Confirm a workspace STAFF user cannot access `/dashboard/settings/integrations`.
* Confirm a workspace STAFF user cannot access `/dashboard/settings/team`.
* Confirm a workspace STAFF user cannot create, publish, archive, or edit builder fields unless promoted to ADMIN.
* Confirm a workspace STAFF user cannot access another workspace owner's forms or submissions.
* Confirm a workspace ADMIN can access workspace forms and submissions.
* Confirm only the workspace OWNER can invite, remove, or change staff roles.

## Public Forms

* Confirm draft forms show the public unavailable page.
* Confirm archived forms show the public unavailable page.
* Confirm published forms can submit with valid required fields.
* Confirm public submissions ignore office-only fields.
* Confirm public submissions ignore display-only fields.
* Confirm public form HTML does not expose owner private data, OAuth tokens, storage tokens, or billing data.

## Auth And OAuth

* Confirm forgot password always shows the same success message whether or not the email exists.
* Confirm password reset links expire and cannot be reused.
* Confirm email verification links expire and cannot be reused.
* Confirm Google login rejects a callback with missing or invalid OAuth state.
* Confirm Lark login rejects a callback with missing or invalid OAuth state.
* Confirm Google Drive OAuth is separate from Google login OAuth.
* Confirm Lark Mail OAuth is separate from Lark login OAuth.

## Billing

* Confirm Stripe Checkout can only be started by the logged-in workspace owner.
* Confirm Stripe Customer Portal can only be opened by the logged-in workspace owner.
* Confirm cancel/resume subscription only affects the current owner user.
* Confirm Stripe webhook rejects an invalid signature.
* Confirm duplicate Stripe webhook event IDs are treated idempotently.
* Confirm billing events do not expose Stripe secrets, card data, or payment method data.

## Storage And Uploads

* Confirm unsupported upload MIME types are rejected server-side.
* Confirm files larger than 10MB are rejected server-side.
* Confirm uploaded file binaries are not stored permanently in FormOS.
* Confirm public submitters cannot choose storage provider, Google folder, or Dropbox path.
* Confirm Dropbox folder paths reject path traversal.
* Confirm Google Drive folder configuration is owner-only.
* Confirm storage tokens are not visible in page HTML or API responses.

## PDF And Completion

* Confirm completed PDF download requires owner or permitted workspace access.
* Confirm public users cannot download PDFs by guessing IDs.
* Confirm Super Admin cannot access completed PDFs through admin pages.
* Confirm finalized submissions do not resend completed PDFs on repeat clicks.
* Confirm completed PDF does not include storage links or uploaded file metadata.

## Headers And Logs

* Confirm responses include safe baseline security headers:
  * `X-Frame-Options`
  * `X-Content-Type-Options`
  * `Referrer-Policy`
  * `Permissions-Policy`
* Confirm logs do not include passwords, raw auth tokens, OAuth tokens, storage tokens, Stripe secrets, Lark secrets, file contents, or full sensitive submission answers.

## Rate Limiting Notes

FormOS currently uses lightweight in-process rate limiting for:

* login attempts
* forgot password
* resend verification
* public form submission
* staff invite sending

This is intentionally simple for the current deployment. If FormOS moves to multiple app instances, replace this with a shared store such as Redis or a database-backed limiter.
