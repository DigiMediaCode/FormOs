# CURRENT TASK — FormOS Milestone 13.2: PDF Branding and Visual Polish

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Completed submission PDF generation works.
* PDF is emailed to both form owner and submitter.
* Clean PDF layout already exists.
* PDF currently contains the correct content but still looks plain/basic.
* Do not touch CommerceOS.

## Goal

Improve the design and UI of the completed PDF.

The PDF should feel more polished and professional by improving:

* typography
* font sizes
* spacing
* layout hierarchy
* visual readability
* branding

Also add the owner/company logo at the top-left corner of the PDF.

## Important Direction

Do not change the core PDF content structure unnecessarily.

This milestone is about visual polish, not changing the business logic.

Keep the PDF simple, clean, and readable.

Do not add back technical metadata such as:

* submission ID
* form version
* submitted date
* uploaded file metadata
* public/office section headings

## Branding Requirement

Add a logo at the top-left of the PDF.

Implementation direction:

* Support a logo image file from a known project path, such as:

  * `public/pdf-logo.png`
  * or another clearly defined path used by the PDF generator
* If logo file exists, render it in the top-left of the first page.
* If logo file is missing, PDF generation should still work without breaking.

For now, a single configured logo file is enough.

Do not build full per-user branding management yet.

## Header Layout

The first page header should be improved.

Required layout:

* Logo on top-left
* Form title centered or visually centered in the header area
* Clean spacing under the header
* Optional horizontal divider line below header if it improves readability

Header should look professional, not crowded.

## Typography

Use nicer fonts if supported by the chosen PDF library.

Preferred direction:

* clean sans-serif font
* visually distinct heading font weight
* readable body font
* reasonable font sizes

Suggested typography style:

* Form title: larger and bold
* Section headings: medium-large and bold
* Field labels: medium weight
* Field values: regular readable size
* Footer: smaller subtle size

If custom fonts are possible cleanly, use them.
If not, use the best built-in font available with a clean style.

## Spacing and Layout

Improve spacing throughout the PDF.

Requirements:

* proper top/bottom margins
* consistent spacing between fields
* more breathing room between groups/sections
* enough white space around signatures
* consistent line height
* avoid cramped text
* page breaks should be handled cleanly

If a section is too close to the page bottom, move it to the next page cleanly.

## Field Rendering Style

Keep the body simple and polished.

Recommended format:

* Label
* Value beneath or beside it in a neat layout

If suitable, use one of these:

Option A:
Label on one line, value on next line

Option B:
Label on left, value on right

Choose whichever is simpler and cleaner in the current PDF engine.

For long fields like textarea/address/html text:

* allow multi-line rendering
* preserve spacing
* avoid overlap

For checkbox fields:

* show clear Yes / No

For signature/initials:

* show label
* render signature image below with clean spacing
* optionally draw a light border or signature line area if helpful

## Section Heading Styling

If `section_heading` fields are present, style them better.

Requirements:

* slightly larger font
* bold
* spacing above and below
* visually distinct from normal labels

Do not over-design.

## Static/HTML Content Styling

If static text / html content is already rendered in the PDF:

* keep it readable
* use smaller paragraph spacing
* avoid giant blocks of dense text
* preserve clear paragraph breaks

No fancy HTML rendering is required.

## Footer

Keep footer simple.

Footer text must remain:

Form Created using FormOS

But improve presentation:

* centered
* smaller font size
* subtle style
* positioned consistently on each page

Do not add other metadata in footer.

## Technical / Implementation Guidance

Likely file area:

* `lib/pdf/`
* existing `generateCompletedSubmissionPdf` helper

Improve PDF generation logic only.

Do not change:

* Office Use Only logic
* email sending logic
* Lark provider logic
* Google Drive logic
* Dropbox logic
* submission flow
* database schema unless absolutely necessary

## Fallback Behaviour

If logo file is not found:

* PDF should still generate normally
* skip logo gracefully
* do not crash PDF generation

## Out of Scope

Do not build per-user branding settings.
Do not build multiple logo management.
Do not build theme designer.
Do not redesign the whole form builder.
Do not add uploaded photos to PDF.
Do not add uploaded file metadata back.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 13.2 is complete when:

* PDF design is visually improved.
* PDF uses cleaner typography.
* Font sizes are more reasonable.
* Spacing is improved across the document.
* Header layout is improved.
* Logo appears on the top-left when the logo file exists.
* PDF still works if logo file is missing.
* Form title remains prominent and clean.
* Signatures are displayed with better spacing.
* Footer still only says "Form Created using FormOS".
* Footer is centered and visually cleaner.
* Existing email delivery to owner and submitter still works.
* Existing clean content rules still remain intact.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
