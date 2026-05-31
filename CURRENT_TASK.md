# CURRENT TASK — FormOS Milestone 12.1: Reuse First Signature

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Public forms work.
* Signature fields work.
* Initials fields work.
* Multiple signature fields can exist in one form.
* Vehicle Hire Agreement template is being prepared and will include multiple signature fields.
* Do not touch CommerceOS.

## Goal

Improve public signature field UX by allowing users to reuse the first signature for later signature fields.

This is useful for agreement forms where the same person must sign multiple sections.

## Product Behaviour

On a public form with multiple signature fields:

1. User draws the first signature.
2. Later signature fields show a button:
   Use first signature
3. When clicked, the first signature is copied into that signature field.
4. User can still clear the copied signature and draw a different one.
5. Required validation should treat copied signatures as valid.
6. Submission should save each signature field value separately in FormSubmission.signatures.

## UI Rules

For the first signature field:

* Show normal signature canvas and Clear button.
* Do not show “Use first signature” on the first signature field.

For later signature fields:

* Show normal signature canvas and Clear button.
* Show button:
  Use first signature

Only show/use this button if the first signature has already been drawn.

If the first signature is empty, the button can be disabled with helper text:

Sign the first signature field first.

## Storage Rules

Do not change database schema.

Do not store only one signature reference.

Each signature field should still save its own data URL in:

FormSubmission.signatures

Example:

{
"signature_1": "data:image/png;base64,...",
"signature_2": "data:image/png;base64,..."
}

If copied, signature_2 contains the same data URL as signature_1.

## Validation

Existing required signature validation must continue working.

Copied signatures should count as provided.

Invalid non-image data URLs should still be rejected.

## Out of Scope

Do not change signature storage model.
Do not build saved signature profile.
Do not build account-level reusable signatures.
Do not change initials unless easy and safe.
Do not build PDF export.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 12.1 is complete when:

* Public forms with multiple signature fields allow later signature fields to use the first signature.
* First signature field does not show the copy button.
* Later signature fields show “Use first signature”.
* Button is disabled or unavailable until first signature is provided.
* Copied signatures can still be cleared/changed.
* Copied signatures pass required validation.
* FormSubmission.signatures stores each signature field separately.
* Existing signature fields still work normally.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.