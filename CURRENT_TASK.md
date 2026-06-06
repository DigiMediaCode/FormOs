# CURRENT TASK — FormOS Milestone 32: Form Embed System Foundation

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS MVP foundation is live and working.
* Auth/signup/login works.
* Google + Lark OAuth login works.
* CMS Pages, Blog, Knowledge Base, and Support system exist.
* Dynamic plans, quota overrides, field type controls, and billing exist.
* Stripe billing works.
* Super Admin exists.
* Forms, builder, public forms, QR, submissions, storage integrations, office fields, PDF generation, email, and audit timeline work.
* Google Drive and Dropbox uploads work.
* Public forms are accessible at /f/{formId}.
* Do not touch CommerceOS.

## Goal

Add form embed functionality so FormOS users can embed their forms into external websites.

This should support:

* generic website iframe embed
* JavaScript embed snippet with better auto-height behaviour
* future WordPress plugin
* future Shopify app/block

This milestone should create the embed foundation cleanly.

## Important Direction

Start with a secure iframe-based embed.

Add JavaScript auto-height support if practical.

Do not build WordPress plugin in this milestone.

Do not build Shopify app in this milestone.

But design the embed system so WordPress and Shopify can reuse it later.

## Product Behaviour

A form owner should be able to:

1. Open a form detail page.
2. See an Embed section.
3. Copy iframe embed code.
4. Copy JavaScript embed code if implemented.
5. Configure basic embed settings.
6. Paste the embed code into an external website.
7. Visitors can submit the embedded form.
8. Embedded submissions behave the same as normal public submissions.

## Where To Add UI

Add embed UI to:

* /dashboard/forms/[formId]

Optional if useful:

* /dashboard/forms/[formId]/builder

Main required location:

* /dashboard/forms/[formId]

## Embed Section UI

Create a card/section:

Embed Form

Show:

* Embed status
* iframe embed code
* Copy iframe code button
* JavaScript embed code if implemented
* Copy JS embed code button
* Preview button
* Embed settings

## Embed URL

Create a dedicated embed route:

* /embed/forms/[formId]

This route should render the form in embedded mode.

Do not use the normal /f/{formId} route directly inside iframe if it has public page branding/header/footer that is not suitable for embed.

Embedded form page should:

* show the form only
* no landing page header
* no public site footer
* minimal FormOS branding depending on plan
* responsive width
* clean inside iframe

## Embed Code

iframe Embed Code

Generate code like:

```html
<iframe
  src="{APP_URL}/embed/forms/{formId}"
  width="100%"
  height="800"
  frameborder="0"
  style="border:0; width:100%; min-height:800px;"
  loading="lazy"
></iframe>
```

Use APP_URL.

Do not use:

* localhost
* 127.0.0.1
* 0.0.0.0
* internal Hostinger host

JavaScript Embed Code

If practical, also generate:

```html
<div data-formos-form="{formId}"></div>
<script src="{APP_URL}/embed.js" async></script>
```

The script should:

* find [data-formos-form]
* create iframe
* set iframe src to /embed/forms/{formId}
* set width 100%
* set safe default height
* optionally listen for postMessage resize events from iframe
* update iframe height when embedded form posts height

If JS embed is too much, iframe embed is required and JS embed can be done as a follow-up.

Preferred: implement both if safe.

## Auto Height / postMessage

If JavaScript embed is implemented:

* embedded form can send height to parent using postMessage
* parent embed.js listens for message from FormOS origin only
* parent updates iframe height

Security:

* validate message origin
* validate message type
* validate formId
* validate height is a reasonable number
* do not allow arbitrary message actions

Message shape:

```json
{
  "type": "FORMOS_EMBED_HEIGHT",
  "formId": "…",
  "height": 1234
}
```

## Embed Settings

Add settings stored in Form.settings or a clean embedSettings object.

Suggested settings:

```json
{
  "embedSettings": {
    "enabled": true,
    "showBranding": true,
    "background": "transparent",
    "maxWidth": "720px",
    "height": 800
  }
}
```

For MVP, keep settings simple:

* Enable embed
* Show FormOS branding
* Default height

If settings UI is too much, default embed enabled for published forms and add basic values.

## Public Access Rules

Embedded forms should follow the same access rules as public forms:

* only PUBLISHED forms can be embedded
* DRAFT forms show unavailable message
* ARCHIVED forms show unavailable message
* plan submission limits apply
* field type restrictions and form validation remain server-side
* storage provider rules remain unchanged
* office-only fields remain hidden
* display-only fields render safely

## Plan / Package Controls

Add plan permission:

allowEmbeds: boolean

Default suggested:

Free:

* allowEmbeds: true

Starter:

* allowEmbeds: true

Pro:

* allowEmbeds: true

Business:

* allowEmbeds: true

Why allow Free? Because embeds can be a growth feature, and ads can still show for free users if ad-free is not allowed.

However, the plan system should support disabling embeds later.

Update plan editor and user quota override UI to support:

* Allow form embeds

If allowEmbeds is false:

* hide/disable embed section
* show upgrade message
* embedded route should block with friendly message

Server-side enforcement required.

## Ads / Branding In Embedded Forms

Embedded forms should follow current ad/ad-free rules.

If owner plan is not ad-free and platform public form ads are enabled:

* ads may show inside embedded form
* same safe placement rules as public form
* do not place ads near submit/signature/upload controls

Branding:

If showBranding true or plan requires branding:

* show subtle “Powered by FormOS”

If plan allows custom/ad-free branding later:

* hide branding if allowed and setting disabled

For now, keep existing FormOS branding behaviour consistent.

## Security Headers / iframe Support

Since forms must be embeddable, make sure security headers do not block embed route.

If the app currently uses X-Frame-Options: DENY globally, embeds will fail.

Adjust carefully:

* Do not remove protection blindly for entire app.
* Allow iframe embedding only for /embed/forms/[formId] if possible.
* Dashboard/admin routes should remain protected from iframe embedding.
* Avoid allowing admin/dashboard in iframes.

If using CSP frame-ancestors, configure carefully.

For MVP:

* ensure /embed/forms/[formId] can be iframe embedded
* admin/dashboard should not be embeddable

## CORS / Cross-Origin

Iframe embeds usually do not need CORS.

If using embed.js:

* script must be publicly accessible
* no secrets exposed
* it should only create iframe and handle resize

Do not expose private API endpoints.

## WordPress / Shopify Future Compatibility

Design with future apps in mind.

Future WordPress plugin should be able to use:

* form ID
* iframe embed URL
* JS embed URL

Future Shopify app/block should be able to use:

* form ID
* embed URL
* script URL

Do not hardcode website-specific assumptions.

Keep embed code generic.

## User Instructions

In embed card, show short instructions:

1. Copy the embed code.
2. Paste it into your website HTML.
3. Publish your website.
4. Form submissions will appear in your FormOS dashboard.

For WordPress/Shopify:

Show small note:

WordPress and Shopify apps are coming soon. For now, use the iframe embed code.

## Submission Source Tracking

Update public submission metadata if practical.

When submitted from embed route, store:

metadata.source = “embed”

When submitted from normal public route, store:

metadata.source = “public_form”

If iframe passes referrer, store safe referrer/origin if available.

Do not store sensitive data.

## Out of Scope

Do not build WordPress plugin.
Do not build Shopify app.
Do not build embed analytics.
Do not build domain allowlist yet unless simple.
Do not build custom embed themes.
Do not build per-form custom CSS.
Do not build conditional logic.
Do not change core submission logic beyond embed source handling.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 32 is complete when:

* /embed/forms/[formId] exists.
* Embedded form route renders published forms.
* Embedded form route blocks draft/archived forms.
* Embedded form route hides public site header/footer.
* Embedded form submits successfully.
* Embed submissions appear in dashboard.
* Embed submissions use existing validation.
* Embed submissions respect storage provider/upload rules.
* Embed submissions hide office-only fields.
* Embed section appears on form detail page.
* iframe embed code is generated using APP_URL.
* Copy iframe code button works.
* JS embed code exists if implemented.
* embed.js exists if implemented.
* Auto-height works if implemented.
* Plan limit allowEmbeds exists.
* Plan editor can control allowEmbeds.
* User quota override can control allowEmbeds.
* Embed route/server-side logic respects allowEmbeds.
* Dashboard/admin routes are not accidentally iframe-embeddable.
* Embed route can be used inside iframe.
* Existing public form route still works.
* Existing QR code still works.
* Existing Google Drive/Dropbox uploads still work.
* Existing PDF/email/audit/billing flows still work.
* npx prisma validate passes.
* npx prisma generate passes.
* npm run build passes.
