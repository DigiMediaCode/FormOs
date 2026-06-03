# CURRENT TASK — FormOS Milestone 19.1: Plan-Based Field Type Controls

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Dynamic subscription plans are created in the backend.
* Super Admin can create/edit plans.
* User-specific quota overrides exist or are being added.
* Basic plan/usage foundation exists.
* Form builder supports multiple field types.
* Do not touch CommerceOS.

## Goal

Allow Super Admin to control which form field types are available for each subscription plan.

Different plans should be able to allow or block specific field types.

This lets FormOS create real package differences such as:

* Free plan: basic fields only
* Starter plan: basic fields + upload/signature
* Pro plan: agreement fields + office fields
* Business plan: all fields

## Core Requirement

Each subscription plan should support allowed field type limits.

Add to plan limits JSON:

allowedFieldTypes: string[] | null

Rules:

* string array = only these field types are allowed
* null = all field types allowed

Example:

{
"maxForms": 5,
"maxMonthlySubmissions": 100,
"allowGoogleDrive": true,
"allowDropbox": false,
"allowPdfGeneration": true,
"allowOfficeUseFields": false,
"allowTemplates": true,
"allowQrCode": true,
"allowCustomBranding": false,
"allowedFieldTypes": ["text", "textarea", "email", "phone", "date", "select", "checkbox"]
}

## Supported Field Types

The system currently supports:

* text
* textarea
* date
* phone
* email
* address
* number
* currency
* select
* checkbox
* image_upload
* signature
* initials
* static_text
* section_heading
* html

Use these exact internal values.

## Default Plan Field Controls

Update default seeded plan limits.

### Free

Allowed field types:

* text
* textarea
* email
* phone
* date
* select
* checkbox
* section_heading
* static_text

### Starter

Allowed field types:

* text
* textarea
* email
* phone
* date
* address
* number
* currency
* select
* checkbox
* image_upload
* signature
* initials
* section_heading
* static_text

### Pro

Allowed field types:

* all supported field types

Set allowedFieldTypes to null or full array.

### Business

Allowed field types:

* all supported field types

Set allowedFieldTypes to null.

## Super Admin Plan UI

Update /admin/plans plan create/edit UI.

Add a section:

Allowed Field Types

Show all supported field types as checkboxes with human-friendly labels:

* Text
* Long Text
* Date
* Phone
* Email
* Address
* Number
* Currency
* Dropdown
* Checkbox
* File Upload
* Signature
* Initials
* Static Text
* Section Heading
* HTML Content

Add option:

Allow all field types

If "Allow all field types" is enabled:

* save allowedFieldTypes as null
* disable/hide individual field type checkboxes

If disabled:

* show individual field type checkboxes
* require at least one field type to be selected

## User Quota Override

Update user quota override UI.

Super Admin should be able to override allowed field types per user.

Add:

Allowed Field Types Override

Options:

* Use plan default
* Allow all field types
* Custom allowed field types

Rules:

* Use plan default = no override for allowedFieldTypes
* Allow all field types = allowedFieldTypes: null in override
* Custom allowed field types = array of selected field types

If Unlimited Everything is enabled:

* allowedFieldTypes should be null
* hide/disable individual field type controls

## Effective Limits Logic

Update limits merging logic.

Rules:

* default free limits apply first
* assigned plan limits override defaults
* user quota override overrides plan limits
* allowedFieldTypes follows the same merge rule

If final allowedFieldTypes is null:

* all field types are allowed

If final allowedFieldTypes is array:

* only those field types are allowed

Create helper:

isFieldTypeAllowed(effectiveLimits, fieldType)

Create assertion:

assertCanUseFieldTypes(userId, fields)

This should check all fields being saved.

## Enforcement

Server-side enforcement is required.

Update builder save action.

When user saves form fields:

1. Load user effective limits.
2. Check every field type in submitted fields.
3. If any field type is not allowed, block save.
4. Return friendly error such as:

Your current plan does not allow these field types: Signature, File Upload.

Do not save partial fields.

Do not rely only on hiding UI.

## Builder UI

Update form builder Add Field panel.

If a field type is not allowed by the user’s effective plan:

* disable that field type button
* show small badge or message:
  Upgrade required
* optionally show helper:
  This field type is not included in your current plan.

Allowed fields should work normally.

Existing forms:

* If user already has disallowed fields due to downgrade, do not crash.
* Show warning in builder:
  This form contains field types that are not included in your current plan. You can remove them or upgrade your plan.
* Prevent saving until disallowed fields are removed or plan is upgraded.

## Template Creation

Template creation must also respect allowed field types.

Before creating Vehicle Hire Agreement template:

* check whether all template field types are allowed
* if not, block template creation with friendly error:
  Your current plan does not include all field types required for this template.

This is separate from allowTemplates.

Both conditions must pass:

* allowTemplates true
* all template field types allowed

## Public Submission Behaviour

Public submissions for existing forms should not crash.

Plan field type enforcement should mostly happen at builder/template creation time.

Do not block public submission just because a field type later becomes disallowed, unless existing plan enforcement already requires it.

## Dashboard Plan Display

Update user dashboard plan/usage display if practical.

Show:

Field types available:

* All field types

or:

Field types available:
Text, Long Text, Email, Phone, Dropdown...

Keep it simple.

## Security

* Only Super Admin can edit plan field type controls.
* Only Super Admin can edit user field type overrides.
* Server-side builder save enforcement is required.
* Normal users cannot bypass limits by editing requests.
* Do not expose admin controls to normal users.

## Out of Scope

Do not build Stripe.
Do not build billing.
Do not build checkout.
Do not build new field types.
Do not change public form rendering unless needed for compatibility.
Do not change Google Drive or Dropbox logic.
Do not change PDF/email/audit logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 19.1 is complete when:

* Plan limits support allowedFieldTypes.
* Super Admin can configure allowed field types for each plan.
* Super Admin can choose Allow all field types for a plan.
* User quota overrides can override allowed field types.
* Unlimited Everything grants all field types.
* Effective limit calculation includes allowedFieldTypes.
* Builder disables disallowed field types in Add Field panel.
* Builder save action blocks disallowed field types server-side.
* Friendly error shows disallowed field names.
* Existing forms with disallowed fields do not crash.
* Template creation checks required field types.
* Dashboard shows field type availability if practical.
* Existing allowed field builder flow still works.
* Existing public submissions still work.
* Existing Google Drive/Dropbox/PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.