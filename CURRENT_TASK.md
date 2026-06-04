# CURRENT TASK — FormOS Milestone 24: Business Workspace + Staff Access Foundation

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Google + Lark OAuth login works.
* Email verification/password reset works.
* User Profile + Business/Billing Profile exists.
* Dynamic plans and quota controls exist.
* Field-type limits per plan exist.
* Stripe billing works.
* Stripe plan sync works.
* Stripe Checkout and Customer Portal work.
* Billing events/webhook logs work.
* Super Admin exists.
* Forms, builder, submissions, storage, PDF, audit, and QR features work.
* Google Drive and Dropbox uploads work.
* Do not touch CommerceOS.

## Goal

Add a simple Business Workspace and Staff Access foundation.

Individual users can continue using FormOS alone.

Business-plan users can add staff members to help manage forms/submissions.

This milestone should create the foundation only.

Do not build complex team permissions yet.

## Product Direction

Staff/team access should be available only if the user’s effective plan allows it.

Add a new plan limit:

allowTeamMembers: boolean

Add another limit:

maxTeamMembers: number | null

Rules:

* null = unlimited staff
* number = maximum staff users allowed

Default suggested limits:

Free:

* allowTeamMembers: false
* maxTeamMembers: 0

Starter:

* allowTeamMembers: false
* maxTeamMembers: 0

Pro:

* allowTeamMembers: false
* maxTeamMembers: 0

Business:

* allowTeamMembers: true
* maxTeamMembers: 5

Custom quota override can override these.

Unlimited Everything should include:

* allowTeamMembers: true
* maxTeamMembers: null

## Workspace Concept

Each main account owner should have a workspace.

For now, keep it simple:

* One owner user = one workspace
* Owner can invite/add staff if plan allows
* Forms belong to the owner/workspace
* Staff can access owner’s workspace based on role

Do not build multi-workspace switching yet unless absolutely necessary.

## Staff Roles

For this milestone, support simple roles:

* OWNER
* ADMIN
* STAFF

Owner:

* the main account user
* full access to their workspace
* can manage staff

Admin:

* can view/manage forms and submissions
* can complete office fields
* can finalize submissions
* cannot manage billing
* cannot manage subscription plan
* cannot delete owner account

Staff:

* can view forms and submissions
* can complete office fields
* can upload/download completed PDF if current owner permissions allow
* cannot edit form builder unless simple and explicitly allowed
* cannot manage billing
* cannot manage staff
* cannot manage integrations

Keep permissions simple and server-side.

## Prisma Schema

Add models:

```prisma
Workspace {
id        String   @id @default(cuid())
ownerId   String   @unique
name      String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

owner     User     @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
members   WorkspaceMember[]
}

WorkspaceMember {
id          String   @id @default(cuid())
workspaceId String
userId      String
role        WorkspaceRole @default(STAFF)
status      String @default("ACTIVE")
invitedEmail String?
invitedBy   String?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt

workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

@@unique([workspaceId, userId])
@@index([workspaceId])
@@index([userId])
}

WorkspaceInvite {
id          String   @id @default(cuid())
workspaceId String
email       String
role        WorkspaceRole @default(STAFF)
tokenHash   String
expiresAt   DateTime
acceptedAt  DateTime?
invitedBy   String?
createdAt   DateTime @default(now())

workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

@@index([email])
@@index([tokenHash])
@@index([workspaceId])
}

enum WorkspaceRole {
OWNER
ADMIN
STAFF
}
```

Add User relations as needed.

Create migration:

```bash
npx prisma migrate dev –name add_workspaces_and_staff
```

Do not use prisma db push.

## Workspace Creation

Create workspace automatically for owner users.

Options:

* create workspace on signup
* create workspace lazily when user opens team settings
* create workspace lazily when needed

Preferred for safety:

Create lazily if missing using helper:

getOrCreateUserWorkspace(ownerId)

Workspace name can default to:

{BusinessProfile.companyName} Workspace

or:

{User.name}’s Workspace

or:

My Workspace

## Team Settings Page

Create route:

/dashboard/settings/team

Add dashboard navigation link:

Team

If user’s effective limits do not allow team members:

Show upgrade message:

Team access is available on Business plans.

Show current plan and “Upgrade from Billing” button/link:

/dashboard/settings/billing

Do not show staff invite form.

If user’s plan allows team members:

Show:

* workspace name
* current team members
* invite staff form
* role selector: Admin / Staff
* remove member button
* change role button if simple

## Invite Flow

Owner/Admin sends invite by email.

For this milestone, only OWNER can invite staff.

Invite form:

* email
* role: Admin or Staff

On submit:

1. Check effective plan allows team members.
2. Check current active staff count below maxTeamMembers.
3. Create invite token.
4. Store token hash only.
5. Email invite link using existing Lark email provider.
6. Show success message.

Invite link:

{APP_URL}/team/invite/accept?token={rawToken}

Do not store raw token.

Invite expiry:

7 days.

## Accept Invite Flow

Create route:

/team/invite/accept

Behaviour:

* read token
* validate token
* if logged out:
    * ask user to login/signup first
    * after login, user should be able to accept invite if email matches
* if logged in:
    * check logged-in user email matches invite email
    * create WorkspaceMember
    * mark invite acceptedAt
    * redirect to /dashboard

For this milestone, keep it simple:

If user with invite email does not exist:

* show message:
    Please create an account with this email to accept the invite.
* link to /signup

Do not build complex post-signup invite continuation unless easy.

## Staff Access Rules

Staff/Admin should access the owner workspace data.

This requires workspace-aware authorization helpers.

Create helpers:

* getCurrentWorkspaceContext
* requireWorkspaceOwner
* requireWorkspaceMember
* requireWorkspaceAdminOrOwner
* canManageWorkspaceForms
* canViewWorkspaceSubmissions
* canCompleteOfficeFields

For this milestone:

Owner:

* full access

Admin:

* can view/manage forms and submissions
* can save office fields
* can finalize submissions

Staff:

* can view forms and submissions
* can save office fields
* can finalize submissions only if simple, otherwise block and document

If implementing full workspace scoping is too much, start with:

* staff can view forms list
* staff can view submissions
* staff can save office fields
* owner-only billing/integrations/team management

Do not break owner access.

## Data Access Strategy

Existing forms use ownerId.

For this milestone, do not rewrite all data models to workspaceId unless necessary.

Instead:

* workspace.ownerId remains the owner of forms
* staff access checks whether current user is a member of workspace whose ownerId matches form.ownerId
* ownerId stays as the data owner

This avoids a risky migration across forms/submissions.

## Dashboard Behaviour for Staff

When staff logs in:

* dashboard should show workspace they belong to
* show forms from workspace owner
* hide billing/settings that staff cannot access
* team/settings/billing/integrations should be owner-only unless explicitly allowed

Keep UI simple.

## Plan Enforcement

Add new limits to plan system:

* allowTeamMembers
* maxTeamMembers

Update plan editor UI:

* Allow team members toggle
* Max team members numeric input with Unlimited toggle

Update user quota override UI:

* allowTeamMembers override
* maxTeamMembers override
* Unlimited Everything includes team access

Server-side checks required before sending invite.

## Super Admin Visibility

Update Super Admin user view if practical:

Show:

* workspace owner
* team member count
* plan allows team: yes/no

Do not let Super Admin access private workspace submissions in this milestone.

## Email Notification

Create invite email:

Subject:

You have been invited to FormOS

Body:

You have been invited to join {workspaceName} on FormOS.

Button/link:

Accept Invite

Invite expires in 7 days.

Email failure should not create a broken state if possible.

If email fails after invite is created, show warning so owner can resend later if resend is implemented.

Resend invite is optional.

## Security

* Only owner can invite/remove staff in this milestone.
* Staff cannot manage billing.
* Staff cannot change subscription plan.
* Staff cannot edit user quota.
* Staff cannot access Super Admin.
* Staff cannot access another workspace.
* Invite tokens are hashed.
* Invite tokens expire.
* Invite email must match accepting user email.
* Server-side authorization required.
* Do not rely only on hiding UI.

## Out of Scope

Do not build multiple workspaces per user.
Do not build team billing seats.
Do not build per-form permissions.
Do not build granular role editor.
Do not build audit logs for staff actions unless existing audit helper can be reused simply.
Do not migrate forms to workspaceId unless absolutely necessary.
Do not build CommerceOS integration.
Do not change Stripe billing except plan limits.

## Acceptance Criteria

Milestone 24 is complete when:

* Workspace model exists.
* WorkspaceMember model exists.
* WorkspaceInvite model exists.
* WorkspaceRole enum exists.
* Prisma migration exists.
* Users can have/get a workspace.
* Plan limits include allowTeamMembers and maxTeamMembers.
* Business/unlimited users can invite staff.
* Non-business users see upgrade message instead of invite form.
* Staff invite email sends.
* Invite token is hashed.
* Invite token expires.
* Invite can be accepted by matching email user.
* WorkspaceMember is created on accept.
* Owner can see team members.
* Owner can remove staff member.
* Owner can change staff role if implemented.
* Staff cannot access billing.
* Staff cannot manage integrations.
* Staff cannot manage team.
* Staff can access permitted workspace forms/submissions according to role.
* Server-side access checks protect workspace data.
* Existing owner access still works.
* Existing forms/submissions still work.
* Existing billing/plans still work.
* Existing Google Drive/Dropbox/PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev –name add_workspaces_and_staff creates migration.
* npm run build passes.
