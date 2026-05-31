# CURRENT TASK — FormOS Milestone 13.1: Clean Final PDF Layout

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* Completed submission PDF generation works.
* PDF is emailed to both form owner and submitter.
* Lark email attachment support works.
* Office Use Only fields work.
* Signatures/initials work.
* Google Drive and Dropbox uploads work.
* Do not touch CommerceOS.

## Problem

The generated completed PDF contains too much technical/internal information.

Current PDF includes items like:

* submission ID
* form version
* submitted date
* headings like "Public Submitted Answers"
* uploaded file metadata
* extra footer metadata

This is not suitable for a clean customer-facing completed form/agreement.

## Goal

Simplify the completed PDF layout.

The PDF should look like a clean completed form, not a technical report.

## Required PDF Layout

### Header

At the top of the first page:

* Form title
* Center aligned
* Large/bold text

Do not show:

* Submission ID
* Form version
* Submitted date
* Completed date
* Generated timestamp

### Body

Show submitted fields in the natural form order.

Use labels from `formSnapshot.fields`.

Render public fields and office-use fields together in the same form flow.

Do not add a heading called:

* Public Submitted Answers
* Office Use Only Answers

If office fields are present, show them as normal fields using their labels.

Do not expose the internal idea of public/office sections in the final PDF.

### Field Rendering

For normal fields:

* Label: Answer

For checkbox fields:

* Label: Yes / No

For select fields:

* Show selected option label if available.
* Fallback to selected value.

For signatures/initials:

* Show field label
* Render signature/initials image below the label

For display-only content fields:

* section_heading may be shown as a heading
* static_text/html may be shown if currently supported safely
* keep it clean and readable

### Uploaded Files

Do not include uploaded file metadata.

Do not include:

* file names
* MIME types
* file sizes
* Google Drive metadata
* Dropbox metadata
* Google Drive links
* Dropbox paths
* uploaded file section

Uploaded files should stay in the owner’s connected storage provider.

### Footer

Each page footer should contain only:

Form Created using FormOS

Footer should be centered.

Do not include:

* generated timestamp
* submission ID
* technical metadata
* storage information

## Email Behaviour

Keep existing email behaviour:

* Completed PDF goes to form owner.
* Completed PDF goes to submitter if submitter email is detected.
* Do not attach uploaded documents.
* Do not include Drive/Dropbox links.

Only the PDF layout/content should change.

## Security / Privacy

* Do not expose storage links.
* Do not expose OAuth tokens.
* Do not expose uploaded file metadata.
* Do not include internal technical identifiers unless explicitly requested later.
* Do not give Super Admin PDF access.

## Out of Scope

Do not build PDF template designer.
Do not build public completed view.
Do not add uploaded photos to PDF.
Do not add uploaded file metadata.
Do not change email provider.
Do not change Office Use Only workflow.
Do not change Google Drive or Dropbox upload logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 13.1 is complete when:

* PDF title is centered at the top.
* PDF does not show submission ID.
* PDF does not show form version.
* PDF does not show submitted date.
* PDF does not show heading "Public Submitted Answers".
* PDF does not show heading "Office Use Only Answers".
* PDF shows public field answers.
* PDF shows office field answers.
* PDF shows signatures/initials.
* PDF does not show uploaded file metadata.
* PDF footer only says "Form Created using FormOS".
* Footer text is centered.
* Completed PDF is still emailed to owner and submitter.
* Existing PDF generation still works.
* Existing office completion flow still works.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.