# CURRENT TASK — FormOS Milestone 13.3: Final PDF Header Layout Fix

## Project Context

FormOS completed PDF generation is working.

Current state:

* PDF is generated successfully.
* PDF is emailed to both owner and submitter.
* Logo appears in the PDF.
* Footer works.
* PDF content is mostly correct.
* Do not touch CommerceOS.

## Problem

The PDF logo positioning and header layout are not correct.

The desired layout is:

1. Logo at the top-left corner.
2. Form title underneath the logo/header area.
3. Form title should be centered.
4. Form title should be uppercase.
5. Form data should start below the centered title.
6. Use a clean sans-serif font family/style.
7. Maintain clean spacing.

## Required PDF Header Layout

At the top of the first page:

* Place logo at the top-left.
* Keep logo size reasonable.
* Logo should not overlap the title or form content.
* Add spacing below logo/header area.
* Show form title centered below the logo/header area.
* Convert form title to uppercase.
* Use larger bold sans-serif styling for the title.
* Add spacing below the title before form data begins.

Suggested visual structure:

[Logo top-left]

```
                FORM TITLE IN UPPERCASE
```

Form data starts here...

## Typography

Use a clean sans-serif font.

Preferred:

* Helvetica / Helvetica-Bold if using built-in PDF fonts
* Or another clean sans-serif font already supported by the current PDF library

Do not add external font files unless absolutely necessary.

Suggested sizing:

* Title: 18–22pt bold
* Section headings: 12–14pt bold
* Field labels: 10–11pt bold or medium
* Field values: 10–11pt regular
* Footer: 8–9pt regular

## Spacing

Improve spacing:

* top margin should be clean
* logo should have breathing room
* title should not be too close to logo
* form data should not start too close to title
* fields should not feel cramped
* signatures should have enough vertical space

## Existing Rules To Keep

Do not add back:

* submission ID
* form version
* submitted date
* uploaded file metadata
* public/office headings
* storage links

Footer should still only say:

Form Created using FormOS

Footer should remain centered.

## Out of Scope

Do not change email delivery.
Do not change Lark provider.
Do not change Office Use Only logic.
Do not change Google Drive or Dropbox logic.
Do not change database schema.
Do not change form builder.
Do not integrate CommerceOS.

## Acceptance Criteria

This task is complete when:

* Logo appears at the top-left corner.
* Form title appears below the logo/header area.
* Form title is centered.
* Form title is uppercase.
* Form data starts below the title with proper spacing.
* PDF uses clean sans-serif font styling.
* Footer still only says "Form Created using FormOS".
* Existing PDF emailing to owner and submitter still works.
* npm run build passes.