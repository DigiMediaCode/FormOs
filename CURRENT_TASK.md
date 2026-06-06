# CURRENT TASK — FormOS Milestone 30: Knowledge Base / FAQ System

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Super Admin exists.
* CMS Pages + Menu Manager exists.
* Blog System exists or is being completed.
* Public website/landing page exists.
* Forms, builder, public forms, submissions, QR, storage integrations, office fields, PDF generation, email, audit timeline, billing, plans, workspace, and staff access all work.
* Google Drive and Dropbox uploads work.
* Stripe billing works.
* Do not touch CommerceOS.

## Goal

Add a Knowledge Base / FAQ system for FormOS.

The Knowledge Base should help users find answers to common questions about using FormOS.

Super Admin should be able to create, edit, categorize, publish, and archive knowledge base articles.

Public users should be able to browse categories, read articles, and contact support if they cannot find an answer.

## Difference Between Blog and Knowledge Base

Blog:

* marketing articles
* product updates
* SEO content
* tutorials and thought leadership

Knowledge Base:

* support documentation
* FAQ answers
* how-to guides
* troubleshooting
* account/billing/help content

Do not mix blog posts and knowledge base articles.

## Public Routes

Create:

* /help
* /help/[categorySlug]
* /help/[categorySlug]/[articleSlug]

### /help

Knowledge Base home page.

Show:

* page title: Help Center
* search input
* category cards
* popular/recent articles
* contact support CTA at bottom

### /help/[categorySlug]

Category page.

Show:

* category title
* category description
* articles in that category
* search/filter if simple
* back to Help Center

### /help/[categorySlug]/[articleSlug]

Article page.

Show:

* article title
* category
* content
* updated date
* helpful contact/support CTA at bottom
* back to category/help links

Only published articles/categories should appear publicly.

Draft/archived articles should not be public.

## Admin Routes

Create Super Admin routes:

* /admin/knowledge-base
* /admin/knowledge-base/categories
* /admin/knowledge-base/categories/new
* /admin/knowledge-base/categories/[categoryId]
* /admin/knowledge-base/articles/new
* /admin/knowledge-base/articles/[articleId]

If too many routes are too much, implement simpler:

* /admin/knowledge-base
* /admin/knowledge-base/categories
* /admin/knowledge-base/articles/[articleId]

But the system must support category and article management.

Add Super Admin navigation link:

Knowledge Base → /admin/knowledge-base

Only SUPER_ADMIN can access.

## Prisma Schema

Add model:

```prisma
model KbCategory {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  status      String   @default("PUBLISHED")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  articles    KbArticle[]
}
```

Add model:

```prisma
model KbArticle {
  id              String   @id @default(cuid())
  title           String
  slug            String
  excerpt         String?
  content         String?
  status          String   @default("DRAFT")
  categoryId      String?
  sortOrder       Int      @default(0)
  isFeatured      Boolean  @default(false)
  metaTitle       String?
  metaDescription String?
  createdById     String?
  updatedById     String?
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        KbCategory? @relation(fields: [categoryId], references: [id])
}
```

Create migration:

```bash
npx prisma migrate dev –name add_knowledge_base
```

Do not use prisma db push.

## Status Values

For both categories and articles, support:

* DRAFT
* PUBLISHED
* ARCHIVED

Rules:

* public pages only show PUBLISHED categories/articles
* Super Admin can see all statuses
* archived articles are hidden publicly

## Category Fields

Admin category editor should support:

* Name
* Slug
* Description
* Status
* Sort Order

Slug rules:

* generated from name if missing
* lowercase
* letters/numbers/hyphens
* unique
* no slash or spaces

## Article Fields

Admin article editor should support:

* Title
* Slug
* Excerpt
* Content
* Status
* Category
* Sort Order
* Featured / Popular
* Meta Title
* Meta Description
* Published At

Slug rules:

* generated from title if missing
* lowercase
* letters/numbers/hyphens
* unique within category if possible
* unique globally is acceptable for MVP
* no slash or spaces

## Content Editor

Use simple textarea or existing safe editor.

Content can be simple HTML/Markdown-like text.

If rendering HTML:

* sanitize before public display
* block script tags
* block iframe/object/embed
* block event handler attributes
* block javascript: URLs

Use existing sanitize helper where possible.

Do not allow arbitrary JavaScript.

## Search

Add simple search on /help.

MVP search can be query parameter based:

```text
/help?q=google
```

Search should look through:

* article title
* excerpt
* content

Only search published articles.

If full search is too much, implement simple server-side contains search.

## Suggested Default Categories

If safe, add seed helper for default categories:

* Getting Started
* Forms & Builder
* File Uploads
* Signatures & PDFs
* Billing & Plans
* Account & Security
* Team & Staff

Do not overwrite existing categories.

Default status:

PUBLISHED

## Suggested Default Articles

Optional draft or published starter articles:

Getting Started:

* How to create your first form
* How to publish and share a form
* How to use QR codes

File Uploads:

* How file uploads work with Google Drive
* How file uploads work with Dropbox

Signatures & PDFs:

* How signatures work
* How to finalize a submission and send PDF

Billing & Plans:

* How plans and limits work
* How to manage your subscription

Account & Security:

* How to reset your password
* How to verify your email

Team & Staff:

* How to invite staff members

If creating article content is too much, seed categories only.

## Public Help Center Design

/help should be clean and support-focused.

Sections:

* hero/search area
* category cards
* featured/popular articles
* contact support CTA

Contact CTA:

Still need help?

Button:

Contact Us

Link:

/contact

If /contact is CMS page, use that. Otherwise use fallback contact page.

## Contact CTA on Article Pages

At the bottom of each article, show:

Still need help?

If you cannot find the answer, contact us and we’ll help.

Button:

Contact Us

Link:

/contact

## SEO Metadata

/help:

Title:

FormOS Help Center

Description:

Find answers and guides for using FormOS forms, agreements, signatures, uploads, billing, and team features.

Category pages:

Use category name/description.

Article pages:

Use metaTitle/metaDescription if available, otherwise title/excerpt.

## Admin Knowledge Base List

/admin/knowledge-base should show:

* articles list
* title
* category
* status
* featured
* sort order
* updated date
* edit button
* public link if published

Also include links/buttons:

* New Article
* Manage Categories

## Category Admin Page

/admin/knowledge-base/categories should show:

* categories list
* name
* slug
* status
* article count
* sort order
* edit button

## Archive/Delete Rules

Preferred:

* archive by setting status = ARCHIVED
* hard delete optional with confirmation

If category has articles:

* block hard delete
* suggest archive instead

For MVP:

* archive is enough

## Menu / Header / Footer Integration

Add Help Center link to public header/footer if practical.

Footer should include:

* Help Center
* Blog
* Privacy Policy
* Terms
* Contact

Do not break CMS menu manager.

## Security

* only SUPER_ADMIN can create/edit/archive categories/articles
* public only sees published content
* sanitize article content
* do not expose admin data
* do not expose secrets
* do not allow arbitrary JS

## Out of Scope

Do not build live chat.
Do not build support tickets.
Do not build article feedback voting.
Do not build comments.
Do not build AI search.
Do not build file attachments.
Do not build rich media manager.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 30 is complete when:

* KbCategory model exists.
* KbArticle model exists.
* Prisma migration exists.
* /help exists.
* /help shows search, categories, and articles.
* /help/[categorySlug] exists.
* /help/[categorySlug]/[articleSlug] exists.
* Public only sees published content.
* Draft/archived content is hidden publicly.
* /admin/knowledge-base exists.
* Super Admin can create/edit/publish/archive KB articles.
* Super Admin can manage KB categories.
* Slug generation works.
* Slug uniqueness is enforced.
* Content is sanitized before rendering.
* Search works at least basically.
* Contact Us CTA appears at bottom of Help Center/article pages.
* Help Center link appears in public nav/footer where practical.
* Existing blog still works.
* Existing CMS pages still work.
* Existing public website still works.
* Existing dashboard/admin still works.
* Existing forms/billing/storage/PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev –name add_knowledge_base creates migration.
* npm run build passes.
