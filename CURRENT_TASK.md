# CURRENT TASK - FormOS Milestone 43: Backend UI Polish + Mobile Navigation Fix

## Current Status

FormOS is almost ready for beta outreach. Before outreach, fix backend/dashboard UX issues and polish the UI using the FlowStep design direction.

## Strategic Positioning

FormOS is **the form builder that finishes the job.**

## Goal

Improve authenticated/backend usability without building major new product features or breaking existing forms, submissions, billing, templates, analytics, public forms, embeds, WordPress, or Shopify.

## Requirements

### 1. Mobile Navigation

Dashboard and Super Admin navigation must be collapsed behind a menu button on mobile. Content should be visible immediately, the menu must open/close, and it should close after selecting a link.

### 2. Backend UI Polish

Polish authenticated areas with modern SaaS styling:

* `/dashboard`
* `/dashboard/forms`
* `/dashboard/forms/new`
* `/dashboard/forms/[formId]`
* `/dashboard/forms/[formId]/builder`
* `/dashboard/forms/[formId]/submissions`
* `/dashboard/forms/[formId]/submissions/[submissionId]`
* `/dashboard/settings/*`
* `/admin`
* `/admin/users`
* `/admin/forms`
* `/admin/settings`

Focus on clean cards, spacing, blue primary actions, badges, compact lists, usable mobile layout, and friendly empty states.

### 3. Forms List

Forms list should clearly show title, status, mode/category, submissions count, last updated, and quick actions including direct Submissions access.

### 4. Preserve Functionality

Do not break builder, conditional logic, office fields, submissions, storage, billing, templates, public forms, embeds, WordPress, or Shopify.

### 5. AdSense Rule

Do not add AdSense to dashboard, admin, auth, checkout, or form submission controls.

### 6. Commands

Run:

* `npx prisma validate`
* `npx prisma generate`
* `npm run build`
