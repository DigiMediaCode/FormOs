# CURRENT TASK — FormOS Milestone 25: Full System Security Hardening

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Google + Lark OAuth login works.
* Email verification/password reset works.
* User Profile + Business/Billing Profile exists.
* Dynamic plans, quota overrides, and field type controls exist.
* Stripe billing works.
* Stripe plan sync works.
* Stripe Checkout and Customer Portal work.
* Stripe webhook logs/billing events work.
* Business workspace and staff access work.
* Staff invite flow works.
* Super Admin exists.
* Forms, builder, public submissions, QR, storage integrations, office fields, PDF generation, email, and audit timeline work.
* Google Drive and Dropbox uploads work.
* Lark email notifications work.
* Do not touch CommerceOS.

## Goal

Perform a full system security hardening pass across FormOS.

This milestone should reduce risk across authentication, authorization, billing, integrations, uploads, public forms, staff access, Super Admin, and server actions.

Do not add flashy new features.

This is a security and reliability milestone.

## Main Security Goals

* Make authorization consistent.
* Protect owner-only and Super Admin-only areas.
* Prevent staff/workspace data leaks.
* Prevent duplicate/unsafe actions where possible.
* Harden OAuth and token flows.
* Harden password reset and verification flows.
* Harden public submission routes.
* Harden file uploads.
* Harden Stripe webhook handling.
* Improve security headers.
* Improve safe error handling.
* Avoid logging secrets/sensitive data.

## 1. Centralize Authorization Helpers

Create or improve centralized permission helpers.

Suggested locations:

* lib/auth/permissions.ts
* lib/workspaces/permissions.ts
* lib/security/guards.ts

Helpers should cover:

* requireAuth
* requireSuperAdmin
* requireWorkspaceOwner
* requireWorkspaceAdminOrOwner
* requireWorkspaceMember
* requireOwnerOrWorkspaceMemberForForm
* requireOwnerOrWorkspaceMemberForSubmission
* requireBillingOwner
* requireIntegrationOwner
* requireTeamOwner

Use these helpers in pages, routes, and server actions.

Do not rely only on hiding buttons in UI.

## 2. Workspace / Staff Access Hardening

Review all workspace/staff routes and actions.

Owner-only:

* /dashboard/settings/billing
* /dashboard/settings/integrations
* /dashboard/settings/team
* billing API routes/actions
* integration connect/disconnect/config routes/actions
* team invite/remove/role actions

OWNER should access all.

ADMIN may access forms/submissions and builder only if already intended.

STAFF should not access billing, integrations, team management, subscription controls, Super Admin, or owner private business settings.

Use existing ownerId strategy:

* Form.ownerId is still source owner.
* Staff access is allowed only if staff belongs to workspace where workspace.ownerId === form.ownerId.

Do not migrate forms to workspaceId in this milestone.

## 3. Super Admin Hardening

Review all /admin routes and admin actions.

Only SUPER_ADMIN can access:

* /admin
* /admin/users
* /admin/forms
* /admin/plans
* /admin/settings
* /admin/billing/events
* plan create/edit/delete/deactivate/sync
* user quota override actions
* user plan assignment actions
* platform settings actions

Workspace OWNER/ADMIN/STAFF must never access Super Admin routes unless their User.role is SUPER_ADMIN.

## 4. Billing Security Hardening

Review Stripe billing routes/actions:

* checkout route/action
* portal route/action
* webhook route
* plan sync action
* cancel/resume subscription action
* billing events page

Requirements:

* checkout requires logged-in user
* checkout only creates session for current user
* portal only opens current user’s customer portal
* cancel/resume only affects current user’s subscription
* plan sync is Super Admin-only
* webhook verifies Stripe signature before processing
* webhook is idempotent using Stripe event ID
* webhook never stores card/payment method data
* Stripe secrets are never exposed
* billing events never expose secrets

## 5. OAuth Security Hardening

Review Google and Lark OAuth flows.

Requirements:

* OAuth state is generated securely
* OAuth state is validated on callback
* missing/invalid state is rejected
* no open redirects
* user email is required
* users are matched by OAuth account first, then email
* duplicate users are not created for same email
* existing password is not overwritten
* OAuth tokens are not logged
* provider secrets are not exposed
* Google auth scopes are only openid/email/profile
* Google Drive OAuth remains separate from Google login OAuth
* Lark login remains separate from Lark email provider

## 6. Auth Token Hardening

Review email verification and password reset flows.

Requirements:

* raw tokens are never stored
* token hash only stored
* tokens expire
* tokens are one-time use
* password reset does not reveal whether email exists
* passwords are hashed using existing password helper
* login remains safe for existing users
* Super Admin is not accidentally locked out
* resend verification is not spammable if simple rate limit exists

## 7. Public Form Submission Hardening

Review public form route:

* /f/[formSlug]

Requirements:

* only published forms can be submitted
* draft/archived/missing forms show friendly unavailable page
* monthly submission limits are checked server-side
* plan field restrictions do not break existing published forms
* server-side validation remains source of truth
* required fields are checked server-side
* office-only fields are ignored by public submission
* display-only fields are ignored by public submission
* no owner private data is exposed
* no tokens/secrets/storage credentials exposed
* duplicate submit prevention still works

## 8. File Upload Security Hardening

Review Google Drive and Dropbox upload handling.

Requirements:

* file type validation server-side
* file size validation server-side
* unsupported MIME types rejected
* no file binary stored permanently on FormOS server
* storage tokens never exposed to browser
* uploaded file metadata is safe
* public submitter cannot choose storage provider/path
* active provider chosen by owner only
* Dropbox paths are normalized and path traversal blocked
* Google folder config remains owner-only
* upload errors are friendly

## 9. PDF Generation Security

Review completed PDF generation/download/email.

Requirements:

* only owner or permitted workspace role can generate/download PDF
* Super Admin cannot access completed PDFs unless deliberately built later
* public user cannot access arbitrary PDFs by ID
* PDF does not expose storage links unless intended
* PDF does not expose uploaded file metadata if current clean layout removed it
* PDF generation errors do not leak stack traces
* finalization cannot be double-run to spam emails
* plan limits for PDF generation still apply

## 10. Server Action Hardening

Review all server actions.

Actions should:

* check logged-in user where required
* check resource ownership/workspace permission
* return friendly errors
* not expose raw stack traces
* not log sensitive data
* prevent double/duplicate critical actions where practical

Critical actions:

* create form
* create template
* save builder fields
* publish/unpublish/archive form
* save office fields
* finalize submission
* download PDF
* connect/disconnect integrations
* save storage folder/path
* set active storage provider
* invite staff
* remove staff
* change staff role
* assign plan
* edit quota override
* sync Stripe plan
* create checkout
* cancel/resume subscription

## 11. Rate Limiting / Abuse Controls

Add simple lightweight rate limiting where practical.

Priority targets:

* login attempts
* forgot password
* resend verification
* public form submission
* staff invite sending
* OAuth callback abuse if practical

Do not add Redis or heavy external infra in this milestone.

Simple DB-based or in-memory rate limiting is acceptable if safe for current deployment.

If rate limiting is too broad, at least add it to:

* forgot password
* resend verification
* public form submission

## 12. Security Headers

Add security headers in Next config or middleware if practical.

Recommended headers:

* X-Frame-Options: DENY or SAMEORIGIN
* X-Content-Type-Options: nosniff
* Referrer-Policy: strict-origin-when-cross-origin
* Permissions-Policy with limited permissions
* Content-Security-Policy if simple and not breaking existing inline styles/scripts

Be careful with CSP because it can break Stripe, OAuth, signatures, and scripts if done badly.

If CSP is risky, skip CSP and add safer basic headers first.

## 13. Error Handling

Improve error handling where practical.

Requirements:

* public users see friendly errors
* admin/internal errors do not expose stack traces
* API routes return safe JSON errors
* webhook route returns appropriate status
* sensitive logs avoided

Do not silence critical logs completely. Log safe messages.

## 14. Logging / Sensitive Data Review

Search for unsafe logging.

Remove or sanitize logs containing:

* passwords
* raw auth tokens
* token hashes if unnecessary
* OAuth access/refresh tokens
* Google Drive tokens
* Dropbox tokens
* Stripe secret/webhook secret
* Lark app secrets/tokens
* uploaded file contents
* full submitted answers where avoidable

## 15. Access Denied UX

Create or improve reusable access denied UI.

Text:

Access denied

You do not have permission to access this area.

Button:

Back to Dashboard

Use this for blocked dashboard/admin/staff routes where appropriate.

## 16. Security Test Checklist

Add a SECURITY_CHECKLIST.md or update DEPLOYMENT.md with manual checks:

* normal user cannot access /admin
* staff cannot access billing
* staff cannot access integrations
* staff cannot access another user’s form
* unauthenticated user cannot access dashboard
* draft form cannot be submitted publicly
* Stripe webhook rejects invalid signature
* forgot password does not reveal email existence
* OAuth state rejects invalid callback
* storage tokens are not visible in HTML
* public form does not expose owner private data

## Out of Scope

Do not build a full audit compliance system.
Do not build SOC2.
Do not build MFA.
Do not build CAPTCHA unless simple and already available.
Do not build per-form permissions.
Do not build multiple workspaces.
Do not rewrite data models to workspaceId.
Do not change billing plan logic except security fixes.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 25 is complete when:

* Authorization helpers are centralized or improved.
* Super Admin routes/actions are protected.
* Workspace owner/admin/staff permissions are enforced server-side.
* Staff cannot access billing/integrations/team management.
* Staff cannot access another workspace.
* Billing routes/actions are protected.
* Stripe webhook remains signature verified and idempotent.
* OAuth state validation is confirmed.
* Email verification/password reset token flows are hardened.
* Public submission route is hardened.
* File upload validation is server-side and safe.
* PDF generation/download is permission-protected.
* Critical server actions have ownership/permission checks.
* Basic rate limiting exists for priority abuse routes or is documented if deferred.
* Basic security headers are added where safe.
* Unsafe logging is removed/sanitized.
* Access denied UI exists.
* Security checklist document exists.
* Existing owner workflow still works.
* Existing staff workflow still works.
* Existing Super Admin workflow still works.
* Existing Stripe billing still works.
* Existing Google Drive/Dropbox upload flow still works.
* Existing PDF/email/audit flow still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
