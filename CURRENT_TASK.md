# CURRENT TASK — FormOS Milestone 40: Basic Form Analytics

## Strategic Direction

FormOS is positioned as:

**The form builder that finishes the job.**

Recent completed milestones:

* Conditional Logic / Branching MVP
* Vertical Workflow Templates v1
* Plan-based free trials
* Template landing pages
* Homepage/pricing positioning alignment
* Public page AdSense consistency

Now we need basic analytics so users can understand form performance.

## Goal

Add basic analytics for form owners:

* form views
* submissions
* completion rate
* source/embed tracking
* simple dashboard summaries

This should be useful for launch but not overbuilt.

## Core Metrics

Track and display:

1. Form Views
   A view is recorded when a public form or embedded form is loaded.

2. Submissions
   Use existing FormSubmission records.

3. Completion Rate
   Formula:

submissions / views * 100

If views = 0, show 0% or “No views yet”.

4. Source Breakdown

Track where views/submissions came from:

* public link
* embed
* WordPress
* Shopify
* unknown/referrer

Use existing metadata if available. If not, add basic source detection.

5. Recent Activity

Show recent form events:

* views
* submissions
* finalized submissions if easy from existing event data

## Data Model

Create a lightweight analytics/event model.

Suggested model:

FormAnalyticsEvent {
id          String   @id @default(cuid())
formId      String
ownerId     String
type        String   // VIEW, START, SUBMIT if START is implemented later
source      String?  // PUBLIC, EMBED, WORDPRESS, SHOPIFY, UNKNOWN
referrer    String?
userAgent   String?
ipHash      String?
sessionId   String?
createdAt   DateTime @default(now())

form        Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

@@index([formId, createdAt])
@@index([ownerId, createdAt])
@@index([type, createdAt])
}

Use enum if the codebase prefers enums.

Privacy:
Do not store raw IP address if avoidable.
If storing IP-related data, hash it.
Do not store sensitive submitted values in analytics events.

## View Tracking

Track views on:

* /f/[formSlug]
* /embed/forms/[formId]

For public form route:
source = PUBLIC unless query/referrer indicates otherwise.

For embed route:
source = EMBED by default.

If embed metadata indicates WordPress/Shopify, classify:

* WORDPRESS
* SHOPIFY

Detection can use:

* query params if existing plugin/app includes source
* referrer hostname
* embed source metadata

Keep MVP simple.

## Duplicate View Control

Avoid creating too many duplicate views from refreshes if simple.

Options:

* use session cookie/localStorage client-side event
* or server-side simple sessionId
* or accept raw page views for MVP

MVP acceptable:
Track page views, not unique visitors.

If using cookies/localStorage, do not break SSR.

## Submission Tracking

When a submission is created, record analytics event:

type = SUBMIT

Make sure this does not duplicate existing submission count in dashboard. The source of truth for submissions remains FormSubmission records.

## Dashboard UI

Add analytics display to:

1. Dashboard Home

Show overview cards:

* Total form views
* Total submissions
* Average completion rate
* Top performing form

2. Form Detail Page

Show analytics cards for that form:

* Views
* Submissions
* Completion rate
* Source breakdown

3. Optional Analytics Page

If simple, add:

/dashboard/analytics

This page can show:

* top forms
* views/submissions table
* source breakdown
* date range filters

If this is too much, keep analytics on dashboard home and form detail only for MVP.

## Date Range

MVP date filters:

* Last 7 days
* Last 30 days
* All time

Default:
Last 30 days

If adding date filters is too much, show Last 30 days only plus all-time counts.

## Plan Permission

Add plan controls:

allowBasicAnalytics: boolean

Recommended default:

Free: true but limited summary
Starter: true
Pro: true
Business: true
Enterprise: true

Optional later:
allowAdvancedAnalytics

For MVP:

* Free users can see basic counts.
* Advanced filtering/source details can be paid if desired, but do not overcomplicate now.

Super Admin plan editor should support allowBasicAnalytics.

Server-side:
Analytics pages/actions should check allowBasicAnalytics if added.

## Super Admin

Optional but useful:

Super Admin dashboard can show platform-level totals:

* total form views
* total submissions
* views last 30 days
* submissions last 30 days

Do not overbuild.

## Privacy / Security

* Do not store submitted answer data in analytics events.
* Do not expose analytics across users.
* Owner/staff should only see analytics for forms they can access.
* Public users should not see analytics.
* Super Admin can see platform aggregate, not private submission answers.
* If storing IP, hash it.
* Respect existing workspace permissions.

## Performance

Avoid heavy queries.

Use grouped counts where possible.

Do not load all analytics events into memory.

Indexes should support:

* formId + createdAt
* ownerId + createdAt
* type + createdAt

## Out of Scope

Do not build advanced analytics.
Do not build field-level drop-off.
Do not build funnel tracking.
Do not build UTM campaign reporting beyond storing basic referrer/source if available.
Do not build charts if heavy.
Do not build export.
Do not build notifications based on analytics.
Do not add analytics to legal pages unless already part of public page views.
Do not track dashboard page views.

## Acceptance Criteria

Complete when:

* FormAnalyticsEvent or equivalent model exists.
* Migration exists.
* Public form views are tracked.
* Embed form views are tracked.
* Submissions create analytics submit events or submissions are counted reliably.
* Dashboard home shows basic analytics summary.
* Form detail shows views/submissions/completion rate.
* Source breakdown exists at least for public vs embed.
* Users cannot see other users’ analytics.
* Public users cannot access analytics.
* Analytics does not store submitted answers.
* IP is not stored raw.
* Plan key allowBasicAnalytics exists if implemented.
* Existing forms/submissions still work.
* Public forms still work.
* Embed/WordPress/Shopify still work.
* npm run build passes.
