CURRENT TASK — FormOS Milestone 26: User Onboarding + Setup Checklist

Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Google + Lark OAuth login works.
* Email verification/password reset works.
* User Profile + Business/Billing Profile exists.
* Dynamic plans, quota overrides, and field type controls exist.
* Stripe billing works.
* Business workspace and staff access work.
* Full system security hardening has been completed.
* Forms, builder, public submissions, QR, storage integrations, office fields, PDF generation, email, and audit timeline work.
* Google Drive and Dropbox uploads work.
* Super Admin exists.
* Do not touch CommerceOS.

Goal

Add a user onboarding and setup checklist so new users know what to do after signing up.

FormOS has many powerful features now, but new users need clear guidance.

The onboarding should help users complete the important first steps without overwhelming them.

Main UX

On /dashboard, show a setup checklist card for users who have not completed onboarding.

Checklist items:

1. Verify your email
2. Complete your business profile
3. Choose or confirm your plan
4. Connect Google Drive or Dropbox
5. Create your first form
6. Publish your form
7. Copy your public link or QR code
8. Submit a test response
9. Finalize a submission and send PDF

Each item should show:

* completed / not completed state
* short explanation
* action button/link

Example:

Verify your email
Protect your account and receive important notifications.
Button: Resend Verification / Verified

Checklist Logic

Checklist completion should be calculated from existing data where possible.

1. Verify your email

Complete if:

* user.emailVerifiedAt exists

Action:

* resend verification email if not verified

2. Complete business profile

Complete if BusinessProfile exists and has at least:

* companyName
    or
* billingName

Action:

* /dashboard/settings/profile

3. Choose or confirm plan

Complete if:

* UserSubscription exists
    or
* user has default Free plan shown

Since default Free exists, this can be marked as complete but still show action:

* /dashboard/settings/billing

Label:

Current plan: {planName}

4. Connect storage

Complete if:

* active upload provider is configured
    or
* Google Drive/Dropbox integration exists and active provider is selected

Action:

* /dashboard/settings/integrations

If current plan does not allow storage integrations:

Show:

Storage uploads are available on paid plans.

Action:

* /dashboard/settings/billing

5. Create first form

Complete if:

* user/workspace has at least one form

Action:

* /dashboard/forms/new

6. Publish form

Complete if:

* user/workspace has at least one published form

Action:

* /dashboard/forms

7. Copy public link or QR code

Complete if:

* user has at least one published form

Since tracking actual copy/download is not required, this can be suggested after publish.

Action:

* open latest published form detail page if easy
* otherwise /dashboard/forms

8. Submit test response

Complete if:

* user/workspace has at least one submission

Action:

* /dashboard/forms

9. Finalize submission and send PDF

Complete if:

* user/workspace has at least one submission with officeCompletedAt or finalized/completed status

Action:

* /dashboard/forms

Optional Tracking

If simple, add model:

UserOnboardingState {
id          String   @id @default(cuid())
userId      String   @unique
dismissedAt DateTime?
completedAt DateTime?
metadata    Json?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt

user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

Create migration:

npx prisma migrate dev –name add_user_onboarding_state

If avoiding schema change is preferred, calculate checklist only and store no state.

Preferred:

Add UserOnboardingState so user can dismiss the checklist.

Dismiss Behaviour

User should be able to click:

Hide setup checklist

If dismissed:

* store dismissedAt
* hide checklist from main dashboard
* show smaller link/card:
    Show setup checklist

If all checklist items are complete:

* set completedAt if using UserOnboardingState
* show small success card:
    Your FormOS workspace is ready.

Dashboard Integration

Update /dashboard.

Add onboarding card near the top.

It should not replace existing dashboard stats.

It should look modern and clean:

* progress bar
* completed count
* checklist rows
* action buttons
* dismiss option

Example:

Setup Progress: 5 / 9 completed

Staff Behaviour

Staff users should not see owner onboarding checklist.

If current user is workspace STAFF or ADMIN but not owner:

* hide onboarding checklist
* show normal staff dashboard

Only workspace owner should see setup checklist.

Super Admin Behaviour

Super Admin should not be forced through onboarding.

If Super Admin is also using FormOS as a normal user, showing checklist is acceptable but not required.

Do not show onboarding inside /admin.

Plan Awareness

Checklist should respect plan limits.

Examples:

If user’s plan does not allow Google Drive/Dropbox:

* storage checklist item should show upgrade message, not broken action

If user’s plan does not allow PDF generation:

* final PDF checklist item should show upgrade message if relevant

Do not break anything if user is on Free plan.

UI Requirements

Use Tailwind only.

Checklist should include:

* progress bar
* icons or simple status dots
* completed badge/checkmark
* action buttons
* dismiss button
* mobile-friendly layout

Do not add a heavy UI library.

Security

* user sees only their own onboarding data
* staff does not see owner-only setup actions
* no secrets exposed
* no private data exposed
* all linked pages already keep their own authorization checks

Out of Scope

Do not build product tours.
Do not build tooltips everywhere.
Do not build onboarding emails.
Do not build video tutorials.
Do not build AI assistant.
Do not change billing logic.
Do not change form submission logic.
Do not integrate CommerceOS.

Acceptance Criteria

Milestone 26 is complete when:

* Dashboard shows onboarding checklist for workspace owner.
* Checklist tracks email verification.
* Checklist tracks business profile completion.
* Checklist shows current plan.
* Checklist tracks storage setup where applicable.
* Checklist tracks first form creation.
* Checklist tracks published form.
* Checklist tracks first submission.
* Checklist tracks finalized submission/PDF completion.
* Checklist has progress display.
* Checklist action links work.
* User can dismiss checklist if UserOnboardingState is implemented.
* Staff users do not see owner onboarding checklist.
* Super Admin/admin pages are unaffected.
* Existing dashboard still works.
* Existing forms/submissions/storage/billing/team/security flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
