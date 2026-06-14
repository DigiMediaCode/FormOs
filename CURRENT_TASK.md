# CURRENT TASK - FormOS Milestone 36: Conditional Logic / Branching MVP

## Strategic Direction

FormOS is no longer positioned as a generic form builder. It is positioned as:

**FormOS - the form builder that finishes the job.**

FormOS is for businesses that need forms, signatures, uploads, office processing, and finalized PDFs.

## Goal

Allow form owners to add simple conditional visibility rules so fields can show or hide based on previous answers.

## MVP Scope

- Field visibility logic only.
- Show field when condition matches.
- Hide field when condition matches.
- One condition per field.
- No redirects.
- No calculations.
- No email routing logic.
- No payment logic.
- No multi-step branching pages.

## Supported Operators

- equals
- not equals
- contains
- is empty
- is not empty
- greater than, for number/currency sources
- less than, for number/currency sources

## Supported Source Fields

Conditions can be based on public input fields:

- text
- textarea
- email
- phone
- number
- currency
- date
- select/dropdown
- checkbox

Do not allow conditions based on signature, initials, file upload, static text, section heading, HTML content, or office-only fields.

## Data Structure

Store rules in each field:

```ts
conditionalLogic: {
  enabled: boolean;
  action: "SHOW" | "HIDE";
  sourceFieldId: string;
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "IS_EMPTY"
    | "IS_NOT_EMPTY"
    | "GREATER_THAN"
    | "LESS_THAN";
  value?: string;
}
```

## Builder Requirements

- Add Conditional Visibility section in each field settings panel.
- Show enable toggle.
- Show action selector.
- Show source field dropdown excluding current field.
- Show operator dropdown.
- Show value input where needed.
- If the plan does not allow conditional logic, show:
  "Conditional logic is available on Pro and Business plans."

## Public Renderer Requirements

- Evaluate conditional logic client-side.
- Hidden fields are not shown.
- Hidden required fields do not block submission.
- If a field becomes hidden, clear its value where safe.
- Office-only fields remain hidden from public users.

## Server-Side Validation

- Server validation must respect conditional visibility.
- Required fields hidden by logic must not be required.
- Submitted values for hidden fields should be ignored.
- Office-only fields remain ignored for public submissions.
- Display-only fields are not answer fields.

## Plan Limits

Add:

- allowConditionalLogic: boolean
- maxConditionalRules: number | null

Defaults:

- Free: allowConditionalLogic false, maxConditionalRules 0
- Starter: allowConditionalLogic false, maxConditionalRules 0
- Pro: allowConditionalLogic true, maxConditionalRules null
- Business: allowConditionalLogic true, maxConditionalRules null
- Unlimited: allowConditionalLogic true, maxConditionalRules null

## Acceptance Criteria

- Builder has Conditional Visibility section.
- User can configure one condition per field.
- Conditional rules are saved in field schema.
- Published public forms evaluate conditional visibility.
- Hidden required fields do not block public submission.
- Server-side validation respects hidden conditional fields.
- Plan limits include allowConditionalLogic.
- Plan limits include maxConditionalRules.
- Super Admin plan editor can control these limits.
- Server-side builder save enforces these limits.
- Existing forms without conditional logic still work.
- Existing submissions still display.
- PDF generation still works.
- Embeds still work.
- WordPress embeds still work.
- Shopify embeds still work.
- npm run build passes.
