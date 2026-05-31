# CURRENT TASK — FormOS Milestone 9: Super Admin Foundation

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
* FormOS is deployed live on Hostinger
* Supabase is connected
* Prisma Migrate deployment workflow is active
* Do not touch CommerceOS

## Goal

Add a Super Admin foundation for FormOS.

The platform owner should be able to access a protected admin area to monitor users, forms, submission counts, and Google Drive integration status.

Super Admin must not get default access to sensitive submission contents or uploaded files.

## Privacy Rule

Uploaded documents belong to the form owner, not FormOS.

FormOS stores only Google Drive metadata for uploaded files.

Super Admin should not see:

* uploaded file links
* Google Drive file links
* uploaded ID photos
* driving licence images
* passport/bank documents
* OAuth access tokens
* OAuth refresh tokens
* raw sensitive submission answers by default

Super Admin may see operational metadata only.

## Required Database Change

Add a UserRole enum:

* USER
* SUPER_ADMIN

Update User model:

* role UserRole @default(USER)

Create a Prisma migration using:

npx prisma migrate dev --name add_user_roles

Do not use prisma db push.

## First Super Admin User

For now, create a safe way to promote a user to SUPER_ADMIN.

Acceptable MVP options:

Option A:

* Add a script that promotes a user by email.
* Example: scripts/make-super-admin.ts or scripts/make-super-admin.js

Option B:

* Add a temporary server-side helper or documented SQL command.

Preferred:
Create a script.

The script should:

* accept email from command line
* find user by email
* set role to SUPER_ADMIN
* print safe success/failure message
* not expose secrets

Example command:

node scripts/make-super-admin.js [your@email.com](mailto:your@email.com)

## Admin Routes

Create:

* /admin
* /admin/users
* /admin/forms

Optional if easy:

* /admin/submissions

But keep it summary-only.

## Access Control

Only users with role SUPER_ADMIN can access /admin routes.

If logged out:

* redirect to /login

If logged in but not SUPER_ADMIN:

* show access denied or redirect to /dashboard

Do not expose admin data to normal users.

## Admin Layout / Navigation

Create a simple admin layout/navigation.

Links:

* Admin Dashboard → /admin
* Users → /admin/users
* Forms → /admin/forms
* Back to App Dashboard → /dashboard

Keep it simple.

## Admin Dashboard

/admin should show basic stats:

* total users
* total forms
* total published forms
* total submissions
* total Google Drive connected users

Do not show uploaded file links.

## Admin Users Page

/admin/users should show a table/list:

* name
* email
* role
* created date
* forms count
* submissions count
* Google Drive connected: Yes/No

Do not show tokens.

Do not show sensitive submission data.

## Admin Forms Page

/admin/forms should show a table/list:

* form title
* owner email
* status
* mode
* version
* submissions count
* created date
* updated date

Do not show uploaded file links.

Do not show full submission answers.

## Optional Admin Submissions Summary

If implemented:

/admin/submissions should show summary only:

* submission id
* form title
* owner email
* status
* created date
* form version
* file count

Do not show answers.
Do not show file links.
Do not show Drive links.

## Helpers

Create helpers such as:

* requireSuperAdmin
* getAdminDashboardStats
* getAdminUsers
* getAdminForms
* getAdminSubmissionSummary if needed

## Security Requirements

* Super Admin routes must be server-side protected.
* Do not rely only on hiding UI links.
* Do not expose OAuth tokens.
* Do not expose Google Drive file links.
* Do not expose sensitive submission answers.
* Do not expose uploaded files.
* Keep queries read-only for this milestone.
* No user deletion yet.
* No impersonation yet.
* No role editing from UI yet.

## Out of Scope

Do not build user deletion.
Do not build user suspension.
Do not build impersonation.
Do not build billing.
Do not build role editing UI.
Do not expose submission detail to Super Admin.
Do not expose uploaded files to Super Admin.
Do not build audit logs yet.
Do not build office-use fields yet.
Do not build notifications.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 9 is complete when:

* UserRole enum exists.
* User has role field with USER default.
* Prisma migration exists for add_user_roles.
* A safe script or documented method exists to promote a user to SUPER_ADMIN.
* /admin route exists.
* /admin/users route exists.
* /admin/forms route exists.
* Logged-out users cannot access /admin.
* Normal users cannot access /admin.
* SUPER_ADMIN user can access /admin.
* Admin dashboard shows platform stats.
* Admin users page shows users with counts and Drive connected status.
* Admin forms page shows forms with owner and submission counts.
* No uploaded file links are exposed to Super Admin.
* No OAuth tokens are exposed.
* No sensitive submission answers are exposed by default.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev --name add_user_roles creates migration.
* npm run build passes.