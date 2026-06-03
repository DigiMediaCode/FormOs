# CURRENT TASK — FormOS Milestone 20: Auth Hardening — Email Verification + Password Reset

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Lark email notifications work.
* Forms CRUD works.
* Builder works.
* Public forms work.
* QR code feature is live.
* Google Drive and Dropbox uploads work.
* Office Use Only fields work.
* Finalize Submission works.
* Completed PDF generation and email delivery work.
* Activity timeline / light audit works.
* Vehicle Hire Agreement template works.
* Super Admin foundation exists.
* Dynamic plans and quotas exist.
* Plan field controls exist.
* Do not touch CommerceOS.

## Goal

Improve authentication security and usability by adding:

1. Email verification after signup
2. Resend verification email
3. Forgot password flow
4. Reset password flow

Use existing Lark email provider for sending emails.

## Important Direction

Do not remove the existing password login system.

Do not build Lark SSO yet.

Do not build email OTP login yet.

Do not break existing users.

This milestone is only:

* verify email
* forgot password
* reset password
* auth-related UI and tokens

## Existing Users Safety

Do not lock existing users out unexpectedly.

Recommended behaviour:

* New users should receive verification email after signup.
* Existing users should still be able to log in.
* If emailVerifiedAt is missing for existing users, show a dashboard/banner prompting verification instead of blocking everything.
* Super Admin should not be blocked by missing verification.

If enforcing email verification globally is too risky, keep enforcement soft for this milestone.

## Prisma Schema Changes

Add to User model:

emailVerifiedAt DateTime?

Add token model:

AuthToken {
id        String   @id @default(cuid())
userId    String?
email     String
type      AuthTokenType
tokenHash String
expiresAt DateTime
usedAt    DateTime?
createdAt DateTime @default(now())

user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([email])
@@index([tokenHash])
@@index([type])
}

Enum:

AuthTokenType {
EMAIL_VERIFICATION
PASSWORD_RESET
}

Create Prisma migration:

npx prisma migrate dev --name add_auth_tokens_and_email_verification

Do not use prisma db push.

## Token Rules

Raw tokens must never be stored in the database.

Use secure random token generation.

Store only a hashed token.

Recommended:

* generate random token using crypto
* hash token using sha256 or secure hash helper
* store hash in database
* send raw token to user in URL

Token expiry:

* email verification token: 24 hours
* password reset token: 1 hour

Tokens should be one-time use.

When used:

* set usedAt
* do not allow reuse

## Email Verification Flow

### Signup

After successful signup:

1. Create user.
2. Create verification token.
3. Send verification email through Lark.
4. Continue normal signup flow.

If verification email fails:

* signup should still succeed
* log safe error
* show message encouraging user to request resend

### Verification Email

Subject:

Verify your FormOS email address

Body should include:

* greeting
* verify button/link
* expiry note: link expires in 24 hours
* if user did not create account, ignore this email

Verification link:

{APP_URL}/verify-email?token={rawToken}

Do not expose token hash.

### Verify Email Page

Create route:

/verify-email

Behaviour:

* read token from query
* validate token
* mark user emailVerifiedAt = now
* mark token usedAt = now
* show success message
* link to dashboard/login

If invalid/expired/used token:

* show friendly error
* show link to resend verification if possible

### Resend Verification

Create UI/action:

* on dashboard banner if user email is not verified
* or on /verify-email page
* optional on login page if practical

Action:

* require user email
* create new verification token
* send verification email
* friendly success message

Do not spam. If easy, rate limit by checking recent tokens within last few minutes.

## Dashboard Verification Banner

If logged-in user emailVerifiedAt is null:

Show banner on /dashboard:

Please verify your email address.

Button:

Resend verification email

Do not block all functionality in this milestone unless implementation is already safe.

## Forgot Password Flow

Create route:

/forgot-password

Fields:

* email

Button:

Send reset link

Behaviour:

* user enters email
* always show generic success:
  If an account exists for this email, a password reset link has been sent.
* do not reveal whether email exists
* if user exists:

  * create password reset token
  * send password reset email through Lark
* if email does not exist:

  * do nothing but show same success message

## Password Reset Email

Subject:

Reset your FormOS password

Body should include:

* reset button/link
* expiry note: link expires in 1 hour
* if user did not request this, ignore this email

Reset link:

{APP_URL}/reset-password?token={rawToken}

## Reset Password Flow

Create route:

/reset-password

Behaviour:

* read token from query
* validate token
* show new password form if valid
* user enters new password
* hash password using existing password helper
* update user password
* mark token usedAt = now
* optionally invalidate other password reset tokens for same email
* redirect/show success with login link

Password rules:

* minimum 8 characters
* friendly error if too short

If token invalid/expired/used:

* show friendly error
* link to /forgot-password

## Login Page Update

Add link:

Forgot password?

Link to:

/forgot-password

Do not break login.

## Signup Page Update

After signup, optionally show message:

Account created. Please check your email to verify your account.

Do not break current signup redirect/session logic unless necessary.

## Email Provider

Use existing Lark email abstraction.

Add notification helpers:

* sendEmailVerificationEmail
* sendPasswordResetEmail

Do not log:

* raw tokens
* token hashes
* passwords
* Lark secrets
* access tokens

## Security Requirements

* Raw tokens never stored in database.
* Password reset does not reveal whether email exists.
* Tokens expire.
* Tokens are one-time use.
* Passwords are hashed using existing password hashing helper.
* Do not log passwords.
* Do not log raw tokens.
* Do not expose secrets.
* Do not break existing sessions.
* Do not lock existing users out unexpectedly.

## Out of Scope

Do not build Lark SSO.
Do not build email OTP login.
Do not build MFA.
Do not build phone verification.
Do not build team invites.
Do not build billing.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 20 is complete when:

* User.emailVerifiedAt exists.
* AuthToken model exists.
* Prisma migration exists.
* Signup creates and sends verification email.
* /verify-email validates token and marks email verified.
* Resend verification email works.
* Dashboard shows verification banner when email is unverified.
* /forgot-password exists.
* Forgot password sends reset email without revealing whether email exists.
* /reset-password exists.
* Valid reset token allows password change.
* Used/expired/invalid reset token is rejected.
* Password reset tokens are one-time use.
* Login page has Forgot password link.
* Existing login still works.
* Existing signup still works.
* Existing Lark email notifications still work.
* Existing dashboard/forms/submissions still work.
* Existing plans/quotas still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev --name add_auth_tokens_and_email_verification creates migration.
* npm run build passes.