# CURRENT TASK — FormOS Milestone 33: WordPress Plugin for Form Embeds

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS embed foundation exists.
* Public embed route exists:
  /embed/forms/{formId}
* iframe embed code works.
* Optional JS embed /embed.js may exist.
* Public form submissions through embed work.
* Forms, submissions, storage, PDF, email, audit, billing, plans, workspace, and Super Admin all work.
* Do not touch CommerceOS.

## Goal

Create a WordPress plugin that allows WordPress users to embed FormOS forms into WordPress pages/posts.

This should be the simplest reliable integration first.

## Important Direction

Create a separate WordPress plugin folder/project.

Do not mix WordPress plugin code into FormOS Next.js app source unless a separate plugin package/folder is clearly created.

Do not build Shopify app in this milestone.

Do not build WordPress.org marketplace packaging yet.

Do not require WordPress users to authenticate with FormOS yet.

This plugin should consume the existing FormOS embed URL.

## Plugin Name

FormOS Embed

Suggested plugin folder:

wordpress-plugin/formos-embed/

or:

plugins/wordpress/formos-embed/

## Core Features

The plugin should support:

1. Admin settings page
2. FormOS base URL setting
3. Shortcode embed
4. Optional Gutenberg block if simple
5. Safe iframe output
6. Responsive embed

## WordPress Admin Settings

Create settings page:

Settings → FormOS Embed

Fields:

* FormOS Base URL

Example:

https://your-formos-domain.com

Default can be empty.

Validation:

* must be https:// URL in production
* remove trailing slash
* no javascript: URLs
* no HTML
* no unsafe input

Optional settings:

* Default height
* Use auto-height script if available
* Show plugin instructions

## Shortcode

Add shortcode:

[formos_form id="FORM_ID"]

Optional attributes:

[formos_form id="FORM_ID" height="800"]

[formos_form id="FORM_ID" js="true"]

Shortcode should render iframe:

<iframe
  src="{FORMOS_BASE_URL}/embed/forms/{FORM_ID}"
  width="100%"
  height="{height}"
  frameborder="0"
  style="border:0;width:100%;min-height:{height}px;"
  loading="lazy"
></iframe>

If js="true" and /embed.js is supported, optionally render:

<div data-formos-form="{FORM_ID}"></div>
<script src="{FORMOS_BASE_URL}/embed.js" async></script>

Default should be iframe because it is reliable.

## Gutenberg Block

If simple, add a basic block:

FormOS Form

Block fields:

* Form ID
* Height
* Use auto-height script toggle

If Gutenberg block is too much, document as TODO and implement shortcode only.

Shortcode is required.

## Security

Use WordPress escaping/sanitization:

* esc_url
* esc_attr
* sanitize_text_field
* absint for height
* current_user_can for admin settings

Do not allow arbitrary HTML or script injection.

Do not expose secrets.

Plugin should not store FormOS API keys in this milestone.

## User Instructions

Settings page should show examples:

Shortcode:

[formos_form id="abc123"]

With height:

[formos_form id="abc123" height="900"]

Tell users:

You can find your Form ID in FormOS on the form detail page.

## Plugin Files

Recommended structure:

formos-embed.php
includes/
class-formos-embed-settings.php
class-formos-embed-shortcode.php
assets/
admin.css optional

Keep it simple.

## Out of Scope

Do not build FormOS login inside WordPress.
Do not fetch forms list from API.
Do not add API tokens.
Do not build form selection dropdown from FormOS.
Do not build Shopify app.
Do not build WordPress.org release automation.
Do not store submission data in WordPress.
Do not proxy submissions through WordPress.

## Acceptance Criteria

Milestone 33 is complete when:

* WordPress plugin folder exists.
* Plugin can be installed/activated in WordPress.
* Settings page exists.
* Admin can set FormOS Base URL.
* Shortcode [formos_form id="..."] works.
* Shortcode renders responsive iframe.
* Height attribute works.
* Unsafe settings/input are sanitized.
* Plugin does not expose secrets.
* Embed submits to FormOS successfully.
* WordPress plugin code is separate from FormOS app.
* FormOS app still builds.
* npm run build for FormOS still passes if touched.