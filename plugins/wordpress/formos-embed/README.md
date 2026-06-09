# FormOS Embed

FormOS Embed is a small WordPress plugin for embedding FormOS forms in WordPress pages and posts.

## Install

1. Copy the `formos-embed` folder into `wp-content/plugins/`.
2. Activate **FormOS Embed** in WordPress Admin → Plugins.
3. Open WordPress Admin → Settings → FormOS Embed.
4. Set **FormOS Base URL** to your FormOS site, for example:

   `https://formos.com.au`

5. Create a FormOS API token in **FormOS Dashboard -> API Tokens**.
6. Paste the token into **FormOS API Token**.
7. Save settings.
8. The settings page will show your published FormOS forms and shortcodes.

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
[formos_form id="abc123" surface="#ffffff" text="#111827" border="#e5e7eb"]
```

Supported appearance attributes:

- `theme`: `light`, `dark`, or `auto`
- `accent`: hex color such as `#2563eb`
- `bg`: `white`, `transparent`, `subtle`, or `none`
- `surface`: card and input background hex color such as `#ffffff`
- `text`: main text hex color such as `#111827`
- `border`: border hex color such as `#e5e7eb`
- `radius`: `0`, `6`, `8`, `12`, `16`, or `20`
- `compact`: `true` or `false`
- `font`: `system`, `sans`, or `inherit`

To match a WordPress theme more closely, set `bg="transparent"` and copy the theme's button/accent, card background, text, and border colors into `accent`, `surface`, `text`, and `border`.

You can find the Form ID in FormOS on the form detail page, or connect the plugin
with an API token and choose a form from the WordPress block editor.

## WordPress Block Editor

The plugin also adds a Gutenberg block:

1. Open a WordPress page or post.
2. Click the block inserter.
3. Search for **FormOS Form**.
4. Choose a published FormOS form from the dropdown.
5. Adjust height, auto-height, theme, accent color, background, radius, compact mode, or font if needed.

The block renders the same reliable FormOS embed as the shortcode.

If the dropdown is empty, open **Settings -> FormOS Embed**, save your FormOS Base URL and API token, then click **Refresh FormOS forms** inside the block sidebar.

## Security

The plugin stores the FormOS API token in WordPress options so editors can fetch published form metadata. The token is not shown again after saving and is only used server-side by WordPress to call `/api/external/forms`. Output uses WordPress escaping helpers and renders a FormOS iframe by default.

## Gutenberg Block

The Gutenberg block is included as a no-build editor script so the plugin remains easy to install.
