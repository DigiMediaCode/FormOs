# CURRENT TASK — FormOS Milestone 29: Blog System

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Super Admin exists.
* CMS Pages + Menu Manager exists or is being completed.
* Public website/landing page exists.
* Forms, builder, public forms, submissions, QR, storage integrations, office fields, PDF generation, email, audit timeline, billing, plans, workspace, and staff access all work.
* Do not touch CommerceOS.

## Goal

Add a simple but professional blog system.

Super Admin should be able to create, edit, publish, archive, and manage blog posts.

Public visitors should be able to browse blog posts and read individual posts.

This will help FormOS with SEO, product education, tutorials, announcements, and content marketing.

## Important Direction

Do not build Knowledge Base in this milestone.

Do not build comments.

Do not build likes/reactions.

Do not build newsletter system.

Do not build multi-author workflow beyond basic author tracking.

Do not build media library yet.

Do not allow arbitrary JavaScript.

Keep it simple, clean, secure, and SEO-friendly.

## Public Blog Routes

Create:

* /blog
* /blog/[slug]

### /blog

Public blog listing page.

Show:

* page title: Blog
* short description
* list/grid of published blog posts
* featured image if available
* title
* excerpt
* category if available
* published date
* read more link

Only show posts where status = PUBLISHED.

Sort newest first by publishedAt or createdAt.

### /blog/[slug]

Public blog post detail page.

Show:

* title
* excerpt if useful
* featured image if available
* category
* published date
* author name if available
* content
* back to blog link
* optional related/recent posts if simple

Only published posts should render publicly.

Draft/archived/missing posts should show clean not found/unavailable page.

## Super Admin Blog Routes

Create:

* /admin/blog
* /admin/blog/new
* /admin/blog/[postId]

Add Super Admin navigation link:

Blog → /admin/blog

Only SUPER_ADMIN can access.

## Prisma Schema

Add model:

```prisma
model BlogCategory {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     BlogPost[]
}
```

Add model:

```prisma
model BlogPost {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  excerpt         String?
  content         String?
  status          String   @default("DRAFT")
  featuredImage   String?
  metaTitle       String?
  metaDescription String?
  publishedAt     DateTime?
  categoryId      String?
  authorId        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        BlogCategory? @relation(fields: [categoryId], references: [id])
}
```

If adding author relation to User is simple, add it. If not, authorId string is acceptable for MVP.

Create migration:

```bash
npx prisma migrate dev --name add_blog_system
```

Do not use prisma db push.

## Post Status

Supported statuses:

* DRAFT
* PUBLISHED
* ARCHIVED

Rules:

* only PUBLISHED posts render publicly
* DRAFT and ARCHIVED are hidden from public
* Super Admin can view/edit all

## Blog Post Fields

Super Admin post editor should support:

* Title
* Slug
* Excerpt
* Content
* Status
* Featured Image URL / Path
* Category
* Meta Title
* Meta Description
* Published At

## Blog Category Management

Keep category management simple.

Options:

Preferred MVP:

* allow category creation inline on blog post editor
* or add basic category create field on /admin/blog

Minimum acceptable:

* category is optional
* allow selecting existing categories
* allow creating a new category through simple action

Do not overbuild category management.

## Content Editor

Use a large textarea or existing safe editor style.

Content can be simple HTML/Markdown-like content.

If rendering HTML:

* sanitize before public rendering
* block script/iframe/object/embed/form/input/button tags
* block event handler attributes
* block javascript: URLs

Do not allow arbitrary JavaScript.

Use existing sanitize helper where possible.

## Slug Rules

Generate slug from title if missing.

Validate:

* lowercase
* letters, numbers, hyphens only
* no spaces
* no slash
* unique

Reserved slugs should be blocked:

* admin
* dashboard
* login
* signup
* api
* f
* p
* blog
* pricing
* privacy-policy
* terms-of-service
* data-security
* contact

## SEO Metadata

For /blog:

* title: FormOS Blog
* description: Tips, guides, and updates about online forms, signed agreements, document workflows, and FormOS.

For /blog/[slug]:

Use:

* metaTitle if available, otherwise post title
* metaDescription if available, otherwise excerpt

Do not break build over dynamic metadata.

## Public Header/Footer Integration

Public header should include Blog link if practical.

Footer should include Blog link if practical.

Do not break CMS menu functionality.

## Admin Blog List

/admin/blog should show:

* title
* slug
* status
* category
* published date
* updated date
* edit button
* public view link if published
* archive/delete action

## Archive/Delete Rules

Preferred:

* archive by setting status = ARCHIVED
* hard delete allowed only with confirmation if no important relation issues

For MVP:

* archive is enough
* hard delete optional

## Default Blog Content

Optional:

Seed one draft post:

Welcome to FormOS

Do not publish automatically unless safe.

Do not overwrite existing posts.

## Security

* only SUPER_ADMIN can create/edit/archive/delete blog posts
* public only sees published posts
* sanitize content
* no arbitrary scripts
* no secrets exposed
* no private user/form/submission data exposed

## Out of Scope

Do not build Knowledge Base.
Do not build comments.
Do not build newsletter.
Do not build media library.
Do not build tags unless simple.
Do not build author profile pages.
Do not build public search yet.
Do not build RSS unless very simple.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 29 is complete when:

* BlogPost model exists.
* BlogCategory model exists.
* Prisma migration exists.
* /admin/blog exists.
* /admin/blog/new exists.
* /admin/blog/[postId] exists.
* Super Admin can create a blog post.
* Super Admin can edit a blog post.
* Super Admin can publish/draft/archive a blog post.
* Blog slug generation works.
* Blog slug uniqueness is enforced.
* Public /blog shows published posts.
* Public /blog/[slug] shows published post content.
* Draft/archived posts are hidden publicly.
* Blog content is sanitized before rendering.
* SEO metadata works where practical.
* Public header/footer can link to Blog.
* Existing CMS pages still work.
* Existing public website still works.
* Existing dashboard/admin still work.
* Existing forms/submissions/billing/storage/PDF/email/audit flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npx prisma migrate dev --name add_blog_system creates migration.
* npm run build passes.
