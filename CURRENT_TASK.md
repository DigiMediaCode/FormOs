# CURRENT TASK — FormOS Milestone 37: Vertical Workflow Templates v1

## Strategic Direction

FormOS is now positioned as:

**The form builder that finishes the job.**

FormOS is not competing as a generic form builder against JotForm, Tally, Typeform, or Fillout.

FormOS is focused on businesses that need:

* customer intake
* signed agreements
* file uploads
* internal office processing
* finalization
* completed PDFs
* organized storage
* staff review

Current core features already exist:

* form builder
* conditional logic
* public forms
* file uploads
* signatures/initials
* Office Use Only fields
* finalization
* completed PDF generation
* Google Drive/Dropbox uploads
* QR code
* embed system
* WordPress plugin
* Shopify app/theme extension
* plans/permissions/quotas
* Super Admin

## Goal

Create 5 high-quality vertical workflow templates that demonstrate FormOS as a business workflow tool, not just a blank form builder.

These templates should be usable immediately by real small businesses.

## Templates To Create

Create these templates:

1. Vehicle Hire Agreement
2. Equipment Rental Agreement
3. Contractor Job Intake + Waiver
4. Service Booking + Consent Form
5. Photography/Event Booking Agreement

If Vehicle Hire Agreement already exists, improve it if needed but do not break existing users/templates.

## Template Quality Standard

Each template should feel like a complete workflow.

Each template should include:

* clear title
* helpful description
* public fields
* agreement/consent sections
* file upload fields where relevant
* signature and/or initials fields
* conditional logic where useful
* Office Use Only fields
* PDF-friendly structure
* finalization-friendly flow

Do not create shallow templates with only name/email/message.

## Template 1 — Vehicle Hire Agreement

Purpose:
For car hire, Uber rental, rideshare vehicle rental, or short-term vehicle hire businesses.

Suggested public fields:

* Customer full name
* Email
* Phone
* Residential address
* Date of birth
* Driver licence number
* Driver licence expiry date
* Driver licence upload
* Vehicle pickup date
* Vehicle return date
* Emergency contact name
* Emergency contact phone
* Agreement text
* Damage/accident responsibility acknowledgment
* Traffic fines/tolls responsibility acknowledgment
* Fuel/cleanliness acknowledgment
* Customer signature
* Customer initials

Conditional logic:

* If “Have you had any recent traffic offences?” = Yes, show offence details field.
* If “Will there be an additional driver?” = Yes, show additional driver fields.

Office Use Only fields:

* Vehicle assigned
* Registration number
* Odometer out
* Odometer in
* Bond received
* Staff inspection notes
* Approved by staff
* Final status

## Template 2 — Equipment Rental Agreement

Purpose:
For businesses renting tools, machines, party/event equipment, trailers, or commercial equipment.

Suggested public fields:

* Customer/business name
* Contact person
* Email
* Phone
* Billing address
* Equipment requested
* Rental start date
* Rental end date
* Pickup or delivery preference
* Delivery address
* ID upload
* Proof of address upload
* Agreement text
* Damage/loss responsibility acknowledgment
* Late return fee acknowledgment
* Safety/use responsibility acknowledgment
* Customer signature

Conditional logic:

* If pickup/delivery = Delivery, show delivery address and delivery instructions.
* If renting as business = Yes, show ABN/company fields.
* If equipment requires operator = Yes, show operator details.

Office Use Only fields:

* Equipment ID/serial number
* Condition before rental
* Condition after return
* Deposit/bond received
* Staff checklist
* Approved/rejected
* Internal notes

## Template 3 — Contractor Job Intake + Waiver

Purpose:
For trade contractors such as cleaners, electricians, plumbers, handymen, landscapers, installers, mobile mechanics, and home service providers.

Suggested public fields:

* Customer name
* Email
* Phone
* Job address
* Service type
* Preferred date/time
* Job description
* Photos of issue/upload
* Is this urgent?
* Is access available?
* Access instructions
* Safety/permission acknowledgment
* Property access consent
* Customer signature

Conditional logic:

* If service type = Other, show “Describe service needed”.
* If urgent = Yes, show urgency details.
* If customer will not be home = Yes, show access instructions.
* If job involves photos/documents = Yes, show upload field.

Office Use Only fields:

* Assigned staff/contractor
* Estimated quote
* Internal job notes
* Site risk notes
* Job status
* Approved for scheduling
* Follow-up required

## Template 4 — Service Booking + Consent Form

Purpose:
For salons, clinics not requiring regulated medical workflows, consultants, coaches, repair services, mobile services, and general appointments.

Suggested public fields:

* Client full name
* Email
* Phone
* Service requested
* Preferred appointment date
* Preferred appointment time
* New or returning client
* Special notes
* Consent/terms section
* Cancellation policy acknowledgment
* Client signature

Conditional logic:

* If new client = Yes, show “How did you hear about us?”
* If service requested = Other, show details field.
* If client has special requirements = Yes, show special requirements details.

Office Use Only fields:

* Appointment confirmed
* Assigned staff member
* Deposit/payment status
* Internal notes
* Booking status
* Follow-up required

## Template 5 — Photography/Event Booking Agreement

Purpose:
For photographers, videographers, event planners, DJs, decorators, and creative service businesses.

Suggested public fields:

* Client name
* Email
* Phone
* Event type
* Event date
* Event start time
* Event location
* Package/service requested
* Number of guests
* Special moments/details
* Upload mood board/reference images
* Usage permission/portfolio consent
* Cancellation/reschedule acknowledgment
* Booking agreement text
* Client signature

Conditional logic:

* If event type = Other, show event details field.
* If location is not confirmed = Yes, show estimated location field.
* If portfolio consent = No, show privacy notes.
* If package = Custom, show custom package requirements.

Office Use Only fields:

* Assigned photographer/staff
* Package confirmed
* Deposit received
* Balance due
* Internal shot list
* Final booking status
* Staff notes

## Template System Requirements

Use the existing template creation helper/pattern.

Each template should:

* create a real editable FormOS form
* use existing field types only
* use conditionalLogic where useful
* include Office Use Only fields where appropriate
* include signatures/initials where appropriate
* be compatible with PDF generation
* be compatible with public form renderer
* be compatible with embed renderer
* respect allowTemplates plan control
* respect allowOfficeUseFields and allowedFieldTypes where existing template flow enforces them

## Template Listing UI

If there is already a template picker/list:

* add these templates there
* add descriptions
* add category labels if category support exists

Suggested categories:

* Rental & Hire
* Trades & Services
* Booking & Events

If category support does not exist, keep the UI simple and add descriptions only.

## Super Admin / Seed Behaviour

If templates are code-based helpers, add them as available template definitions.

Do not automatically create user forms unless the user chooses to create from template.

Do not duplicate existing templates unnecessarily.

## Pricing / Plan Behaviour

Template use remains controlled by:

allowTemplates

If user’s plan does not allow templates:

* show templates locked/upgrade message
* block template creation server-side

## Out of Scope

Do not build template marketplace.
Do not build public template landing pages yet.
Do not build advanced PDF template editor.
Do not build payments/deposits.
Do not build multi-step forms.
Do not build advanced conditional OR groups.
Do not build vertical-specific dashboards.
Do not create legal advice disclaimers beyond reasonable generic agreement text.

## Legal Safety

These templates are operational starting points, not legal advice.

Use wording such as:

“This template is provided as a starting point and should be reviewed by the business before use.”

Do not claim the agreements are legally guaranteed or enforceable in every jurisdiction.

## Acceptance Criteria

Milestone 37 is complete when:

* 5 vertical workflow templates exist.
* Vehicle Hire Agreement still works.
* Equipment Rental Agreement template exists.
* Contractor Job Intake + Waiver template exists.
* Service Booking + Consent template exists.
* Photography/Event Booking Agreement template exists.
* Templates include signatures/uploads/office fields where appropriate.
* Templates use conditional logic where useful.
* Template creation respects plan limits.
* Created forms are editable in builder.
* Created forms render correctly publicly.
* Created forms can be submitted.
* Created submissions can be viewed.
* Office fields can be completed.
* PDFs still generate correctly.
* Embed route still works.
* WordPress/Shopify embeds still work for created forms.
* npm run build passes.