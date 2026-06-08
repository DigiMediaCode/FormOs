# FormOS Embed for Shopify

FormOS Embed for Shopify is a standalone Shopify integration scaffold for embedding published FormOS forms in Shopify storefront themes.

This folder is versioned inside the FormOS repository for convenience, but it is not part of the FormOS Next.js web app runtime and should not be deployed to Hostinger with the FormOS app build.

## What This Milestone Includes

- A Shopify Theme App Extension scaffold.
- A `FormOS Form` app block.
- Merchant settings for FormOS Base URL, Form ID, height, and appearance.
- Safe iframe output pointing to the FormOS embed route.
- No FormOS API tokens, Shopify billing, submission proxying, or Shopify App Store submission flow.

## Folder Structure

```text
plugins/shopify/formos-embed-shopify/
  README.md
  package.json
  shopify.app.toml.example
  extensions/
    formos-form/
      shopify.extension.toml
      blocks/
        formos-form.liquid
```

## Requirements

- A Shopify Partner account.
- A Shopify development store.
- Shopify CLI installed locally.

Install Shopify CLI using Shopify's current documentation:

```bash
npm install -g @shopify/cli@latest
```

## Development Setup

This scaffold is intentionally extension-first. If Shopify CLI requires a generated app shell for your environment, create one and copy the extension folder into it.

Recommended setup:

1. Create or open a Shopify app project with Shopify CLI.
2. Copy `extensions/formos-form` from this folder into your Shopify app project's `extensions/` folder.
3. Copy `shopify.app.toml.example` to `shopify.app.toml` only if you want a local placeholder config, then replace placeholder values with your Shopify app values.
4. Run:

```bash
shopify app dev
```

5. Choose your Shopify development store when prompted.
6. Install the app on the development store.

## Adding The FormOS Form Block

1. Open your Shopify development store admin.
2. Go to **Online Store → Themes → Customize**.
3. Open the page/template where you want the form.
4. Add an app block named **FormOS Form**.
5. Enter:
   - **FormOS Base URL**: `https://formos.com.au`
   - **Form ID**: the ID from the FormOS form detail page
   - **Height**: for example `800`
6. Adjust appearance settings if needed.
7. Save the theme.

## Block Settings

- FormOS Base URL
- Form ID
- Height
- Theme: Light, Dark, Auto
- Accent color
- Background: White, Transparent, Subtle, None
- Border radius: 0, 6, 8, 12, 16, 20
- Compact mode
- Font: System, Sans, Inherit

## Rendered Iframe

The app block renders an iframe similar to:

```html
<iframe
  src="https://formos.com.au/embed/forms/FORM_ID?theme=auto&accent=2563eb&bg=transparent&radius=16&compact=true&font=system"
  width="100%"
  height="800"
  loading="lazy"
  style="border:0;width:100%;min-height:800px;"
></iframe>
```

The embedded form submits directly to FormOS. Shopify does not store submissions and does not proxy form data.

## Testing A Submission

1. Publish the target form in FormOS.
2. Add the Shopify app block to a development theme.
3. Enter the FormOS Base URL and Form ID.
4. Open the storefront page.
5. Submit a test response.
6. Confirm the submission appears in the FormOS dashboard.
7. If the form includes uploads, confirm the owner's active FormOS storage integration receives the files.

## Security Notes

- Merchant-entered Liquid settings are escaped.
- The block does not accept raw scripts or arbitrary HTML.
- No FormOS secrets are stored in Shopify.
- No FormOS API token is required in this milestone.
- Submissions are not stored in Shopify.
- The block only creates an iframe to the public FormOS embed route.

## Future Compatibility

Possible future milestones:

- Connect a FormOS account.
- List and select forms from FormOS.
- Store a per-store default FormOS Base URL.
- Add an app admin dashboard.
- Add an app proxy if needed.
- Prepare Shopify App Store submission.
- Add Shopify billing if needed.

#Testing Learnings
- choose extension-only app
- height range must have max 101 steps
- use current theme and save changes
- deploy extension if it needs to work outside dev preview