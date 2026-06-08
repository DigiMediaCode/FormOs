# CURRENT TASK — FormOS Milestone 34: Shopify App / Theme App Extension for Form Embeds

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS embed system works.
* WordPress plugin works.
* WordPress shortcode embeds FormOS forms successfully.
* Embed route exists at /embed/forms/{formId}.
* Embed theme customization exists.
* Public embed submissions work.
* Forms, submissions, storage, PDF, email, audit, billing, plans, staff, and Super Admin features work.
* Do not touch CommerceOS.

## Goal

Create a Shopify app foundation that allows Shopify merchants to embed FormOS forms into their Shopify storefront.

This should support:

* Shopify Theme App Extension
* App block for adding FormOS form to Shopify theme sections
* Merchant-configurable form ID
* Merchant-configurable embed appearance settings
* FormOS iframe/embed URL
* Future compatibility with a full Shopify app dashboard and API integration

## Important Direction

Create Shopify app/plugin code separately from the FormOS Next.js app.

Do not mix Shopify app runtime into the FormOS app build.

Do not change the FormOS core app unless needed for documentation or embed compatibility.

Do not build Shopify App Store submission in this milestone.

Do not build full FormOS login inside Shopify yet.

Do not build automatic form list fetching from FormOS yet.

Do not build billing inside Shopify.

Do not build CommerceOS integration.

## Recommended Folder

Create a separate folder:

plugins/shopify/formos-embed-shopify/

This folder should contain the Shopify app / theme extension scaffold.

It is stored in the FormOS repo for version control, but it is not part of the FormOS Hostinger runtime.

Add a README explaining this.

## Shopify Architecture

Use Shopify’s modern app structure where practical.

Preferred:

* Shopify CLI app scaffold
* Embedded admin app shell if scaffolded
* Theme App Extension
* App block for FormOS embed

Theme app extension should provide:

* FormOS Form app block
* optional app embed block if useful

The first useful target is an app block merchants can add through the Shopify Theme Editor.

## Theme App Extension Block

Create a theme app extension block such as:

FormOS Form

Block settings:

* Form ID
* Embed height
* Theme: Light / Dark / Auto
* Accent color
* Background: White / Transparent / Subtle / None
* Border radius
* Compact mode
* Font style
* Show FormOS branding if available or allow existing embed behaviour

The block should render an iframe:

<iframe
  src="{formos_base_url}/embed/forms/{form_id}?theme={theme}&accent={accent}&bg={bg}&radius={radius}&compact={compact}&font={font}"
  width="100%"
  height="{height}"
  loading="lazy"
  style="border:0;width:100%;min-height:{height}px;"
></iframe>

Use safe Liquid escaping.

## FormOS Base URL

For MVP, the FormOS base URL can be configured in one of these ways:

Option A:
Hardcode development/default base URL in extension settings or snippet.

Option B:
Add theme block setting:

FormOS Base URL

Option C:
App admin settings page stores base URL.

Preferred MVP:

Use a block setting:

FormOS Base URL

Default empty or your live FormOS domain.

This keeps the extension simple.

Later, a full Shopify app dashboard can store this globally.

## Shopify App Admin Page

If app scaffold includes an admin page, create a simple app page:

FormOS Embed Settings

Show:

* short explanation
* FormOS Base URL
* instructions to find Form ID in FormOS
* instructions to add the app block in Theme Editor
* example embed preview/instructions

Do not build API connection to FormOS yet.

## Merchant Usage

Merchant flow:

1. Install Shopify app on development store.
2. Open Shopify Theme Editor.
3. Add app block: FormOS Form.
4. Enter FormOS Base URL.
5. Enter Form ID.
6. Configure appearance.
7. Save theme.
8. Form appears on storefront.
9. Submissions go to FormOS dashboard.

## Shopify App Extension Settings

Suggested block settings:

* formos_base_url: text
* form_id: text
* height: number/range, default 800
* theme: select light/dark/auto
* accent: text color hex
* background: select white/transparent/subtle/none
* radius: select 0/6/8/12/16/20
* compact: checkbox
* font: select system/sans/inherit

Validation in Liquid is limited, but keep output safe and escaped.

## Embed Appearance

The extension should pass the same query params supported by FormOS:

* theme
* accent
* bg
* radius
* compact
* font

This keeps Shopify consistent with WordPress plugin embeds.

## Security

* Do not expose FormOS secrets.
* Do not use FormOS API tokens in this milestone.
* Do not proxy submissions through Shopify.
* Do not store submissions in Shopify.
* Use iframe pointing to FormOS embed route.
* Escape merchant-entered settings.
* Do not allow arbitrary JavaScript.
* Do not allow merchants to paste raw script code.

## Future Compatibility

Design so future milestones can add:

* Shopify app OAuth/store install flow
* App admin dashboard
* FormOS account connection
* API token/OAuth connection to FormOS
* list forms from FormOS
* select form from dropdown
* per-store default FormOS base URL
* Shopify app billing if needed
* Shopify App Store submission

But do not build these now.

## Local Development / Documentation

Add README with:

* how to install Shopify CLI if needed
* how to run the Shopify app locally
* how to connect to development store
* how to add the app block in theme editor
* how to enter FormOS form ID
* how to test submission
* how to package/deploy later

## FormOS Core App

Do not change FormOS core app unless needed.

If FormOS embed route already supports all query params, no core changes should be required.

If a small compatibility fix is needed, keep it minimal and run FormOS build.

## Out of Scope

Do not build Shopify App Store submission.
Do not build Shopify billing.
Do not build FormOS login inside Shopify.
Do not build FormOS API token connection.
Do not fetch/list forms from FormOS.
Do not store submissions in Shopify.
Do not build app proxy in this milestone unless absolutely necessary.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 34 is complete when:

* Shopify app/plugin folder exists separately from FormOS core app.
* Theme app extension exists.
* FormOS Form app block exists.
* Merchant can enter FormOS Base URL.
* Merchant can enter Form ID.
* Merchant can configure height/theme/accent/background/radius/compact/font.
* App block renders iframe to FormOS embed route.
* Form appears on Shopify storefront.
* Submission goes to FormOS.
* Theme block output is escaped/safe.
* No FormOS secrets are exposed.
* README explains setup/testing.
* FormOS core app still builds if touched.
* Existing WordPress plugin remains unaffected.