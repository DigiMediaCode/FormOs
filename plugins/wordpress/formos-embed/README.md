# FormOS Embed

FormOS Embed is a small WordPress plugin for embedding FormOS forms in WordPress pages and posts.

## Install

1. Copy the `formos-embed` folder into `wp-content/plugins/`.
2. Activate **FormOS Embed** in WordPress Admin → Plugins.
3. Open WordPress Admin → Settings → FormOS Embed.
4. Set **FormOS Base URL** to your FormOS site, for example:

   `https://formos.com.au`

5. Save settings.

## Shortcodes

Basic iframe embed:

```text
[formos_form id="abc123"]
```

Custom height:

```text
[formos_form id="abc123" height="900"]
```

Use the FormOS JavaScript embed if enabled in plugin settings:

```text
[formos_form id="abc123" js="true"]
```

Theme overrides:

```text
[formos_form id="abc123" theme="auto" accent="#7c3aed"]
[formos_form id="abc123" bg="transparent" radius="16" compact="true"]
```

Supported appearance attributes:

- `theme`: `light`, `dark`, or `auto`
- `accent`: hex color such as `#2563eb`
- `bg`: `white`, `transparent`, `subtle`, or `none`
- `radius`: `0`, `6`, `8`, `12`, `16`, or `20`
- `compact`: `true` or `false`
- `font`: `system`, `sans`, or `inherit`

You can find the Form ID in FormOS on the form detail page.

## WordPress Block Editor

The plugin also adds a Gutenberg block:

1. Open a WordPress page or post.
2. Click the block inserter.
3. Search for **FormOS Form**.
4. Enter the Form ID in the block settings sidebar.
5. Adjust height, auto-height, theme, accent color, background, radius, compact mode, or font if needed.

The block renders the same reliable FormOS embed as the shortcode.

## Security

The plugin does not store FormOS API keys or secrets. It only stores a FormOS Base URL, default height, and the auto-height preference. Output uses WordPress escaping helpers and renders a FormOS iframe by default.

## Gutenberg Block

The Gutenberg block is included as a no-build editor script so the plugin remains easy to install.
