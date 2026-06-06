# CURRENT TASK — FormOS Milestone 33.1: Embed Theme Customization for WordPress + Generic Embeds

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

* FormOS embed system works.
* WordPress plugin works.
* WordPress plugin can embed a FormOS form using form ID.
* Embedded forms submit successfully.
* FormOS public embed route exists.
* Do not touch CommerceOS.

## Goal

Improve embedded form styling so forms can better match the website where they are embedded.

This is especially needed for WordPress sites where each website has its own color scheme and visual style.

## Important Direction

Do not build full form editing inside WordPress yet.

Do not build FormOS login inside WordPress yet.

Do not build API token/OAuth connection for WordPress yet.

This milestone is only about embed styling and theme customization.

## Why Not Build Form Creation Inside WordPress Yet

Creating/editing forms inside WordPress would require:

* WordPress plugin authentication to FormOS
* API tokens or OAuth
* FormOS API for listing/creating/editing forms
* permissions
* sync/error handling
* more complex plugin UI

That should be a future milestone.

For now, embed customization gives immediate value with low risk.

## Embed Styling Concept

The embedded form should support safe theme query parameters.

Example:

/embed/forms/{formId}?theme=auto&accent=%232563eb&radius=12&bg=transparent

Supported query parameters:

* theme
* accent
* bg
* radius
* compact
* font

## Supported Theme Parameters

### theme

Allowed values:

* light
* dark
* auto

Default:

light

### accent

Hex color.

Example:

#2563eb

Rules:

* must be valid hex color
* reject unsafe values
* fallback to default if invalid

### bg

Allowed values:

* white
* transparent
* subtle
* none

Default:

white

### radius

Allowed values:

* 0
* 6
* 8
* 12
* 16
* 20

Default:

12

### compact

Allowed values:

* true
* false

Default:

false

### font

Allowed values:

* system
* sans
* inherit

Default:

system

Note:

Because iframe content is isolated from parent CSS, inherit cannot truly inherit parent page CSS unless CSS variables are passed. For MVP, treat inherit similar to system but keep option for future.

## Embed Route Styling

Update:

/embed/forms/[formId]

It should read safe query parameters and apply them to the embedded form UI.

Requirements:

* transparent background option should remove outer heavy background/card styling
* accent color should affect submit button/focus styles where safe
* radius should affect card/input/button border radius
* compact should reduce spacing
* dark theme should use dark background and readable text
* auto can use prefers-color-scheme or default light if simpler

Do not allow arbitrary CSS injection.

Do not allow arbitrary style tags.

Only safe predefined values and validated hex color.

## WordPress Plugin Settings

Update WordPress plugin settings page:

Settings → FormOS Embed

Add default embed appearance settings:

* Default Theme: Light / Dark / Auto
* Accent Color
* Background: White / Transparent / Subtle / None
* Border Radius
* Compact Mode
* Font Style

These settings are used by shortcode unless overridden.

## WordPress Shortcode Attributes

Update shortcode:

[formos_form id="FORM_ID"]

Support optional attributes:

* theme
* accent
* bg
* radius
* compact
* font
* height
* js

Examples:

[formos_form id="abc123" theme="auto" accent="#7c3aed"]

[formos_form id="abc123" bg="transparent" radius="16" compact="true"]

Shortcode attributes should override plugin defaults.

## WordPress Plugin Output

The iframe src should include safe query params.

Example:

https://formos.com/embed/forms/abc123?theme=auto&accent=%237c3aed&bg=transparent&radius=16&compact=true

Sanitize all attributes using WordPress sanitization functions.

Do not allow arbitrary CSS or JavaScript.

## Copy Embed Code in FormOS

Update FormOS embed section if practical.

Add simple theme options to generated embed code:

* Theme
* Accent color
* Background
* Radius
* Compact mode

If this is too much, at minimum ensure embed route supports query params and WordPress plugin can use them.

## Plan Consideration

Do not restrict theme customization by plan in this milestone.

Later, advanced custom branding can become a paid feature.

For now, all embed users can use these simple style options.

## Security

* no arbitrary CSS input
* no arbitrary JS input
* validate hex color
* whitelist theme/bg/font/radius values
* WordPress plugin must sanitize shortcode attributes
* FormOS embed route must validate query params server-side
* do not expose secrets

## Out of Scope

Do not build WordPress form creation.
Do not build WordPress FormOS login.
Do not build API keys.
Do not build Shopify app.
Do not build custom CSS editor.
Do not build full theme designer.
Do not build per-form theme presets.
Do not change core submission logic.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 33.1 is complete when:

* Embed route accepts safe theme query parameters.
* Accent color affects embedded form styling.
* Background option works.
* Border radius option works.
* Compact mode works.
* Dark/light/auto theme works or gracefully falls back.
* Invalid theme parameters are ignored or safely defaulted.
* WordPress plugin settings include default appearance options.
* WordPress shortcode accepts appearance attributes.
* Shortcode attributes override plugin defaults.
* WordPress plugin sanitizes all appearance inputs.
* Embedded form visually adapts better to WordPress sites.
* Existing embed submissions still work.
* Existing iframe embed still works.
* Existing public form route still works.
* FormOS build passes.