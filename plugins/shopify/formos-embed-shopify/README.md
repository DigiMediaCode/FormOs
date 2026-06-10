# FormOS Embed for Shopify

FormOS Embed for Shopify is a standalone Shopify embedded admin app plus Theme App Extension for embedding published FormOS forms in Shopify storefront themes.

This folder is versioned inside the FormOS repository for convenience, but it is not part of the FormOS Next.js web app runtime and should not be deployed to Hostinger with the FormOS app build.

## What This Includes

- Shopify embedded admin app scaffold.
- Shopify Theme App Extension scaffold.
- A `FormOS Form` app block.
- A **FormOS Embed** admin page at `/app`.
- Per-shop FormOS connection storage using Prisma/SQLite.
- FormOS Base URL + API token connection testing.
- Published FormOS forms fetched from `/api/external/forms`.
- Safe iframe output pointing to the FormOS embed route.
- No Shopify billing, customer/order/product sync, submission proxying, or Shopify App Store submission flow.

## Folder Structure

```text
plugins/shopify/formos-embed-shopify/
  app/
    routes/
      app.tsx
    formos.server.ts
    shopify.server.ts
  prisma/
    schema.prisma
  extensions/
    formos-form/
      shopify.extension.toml
      blocks/
        formos-form.liquid
  README.md
  package.json
  shopify.app.toml.example
```

## Requirements

- Shopify Partner account.
- Shopify development store.
- Shopify CLI installed locally.

Install Shopify CLI using Shopify's current documentation:

```bash
npm install -g @shopify/cli@latest
```

## Development Setup

1. Open this folder:

```bash
cd plugins/shopify/formos-embed-shopify
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill:

```text
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=
SHOPIFY_APP_URL=
DATABASE_URL="file:dev.sqlite"
```

The app does not need Shopify Admin API scopes for this milestone because it does not read products, orders, customers, or Shopify data.

4. Copy `shopify.app.toml.example` to `shopify.app.toml` if needed, then replace placeholders with Shopify CLI / Partner Dashboard values.

5. Prepare the local SQLite database:

```bash
npx prisma generate
npx prisma migrate deploy
```

6. Run:

```bash
shopify app dev
```

7. Choose your Shopify development store when prompted.
8. Install the app on the development store.

## Shopify Admin App Page

When the merchant opens the app from Shopify Admin, they should see:

**FormOS Embed**

This page is implemented at:

```text
app/routes/app.tsx
```

It includes:

- FormOS Base URL input
- FormOS API Token input
- Save Connection button
- Test Connection button
- Refresh Forms button
- Connection status
- Forms list returned from FormOS automatically after save and on page refresh
- Form picker for choosing the form to paste into the Shopify Theme Editor block
- Copy Form ID and Base URL buttons
- Theme Editor setup instructions

The API token is encrypted before storage and is not returned to the browser after save.

## FormOS Connection Flow

1. In FormOS, go to **Dashboard -> API Tokens**.
2. Create a token.
3. Copy the token immediately.
4. Open the Shopify app in Shopify Admin.
5. Paste:
   - FormOS Base URL: `https://formos.com.au`
   - FormOS API Token
6. Click **Save Connection**.
7. Published forms load immediately after a successful save.
8. Reopen or refresh the Shopify app page to refresh the forms list from FormOS.
9. Choose a form in the app page and copy the Form ID/Base URL.
10. Paste the Form ID and Base URL into the Theme Editor app block.

The app calls:

```text
GET {formosBaseUrl}/api/external/forms
Authorization: Bearer {apiToken}
```

Accepted response shape:

```json
{
  "data": [
    {
      "id": "formId",
      "title": "Vehicle Hire Agreement",
      "status": "PUBLISHED",
      "mode": "AGREEMENT",
      "updatedAt": "2026-06-09T00:00:00.000Z",
      "embedUrl": "https://formos.com.au/embed/forms/formId"
    }
  ]
}
```

The app also tolerates a raw array with the same form objects.

## Adding The FormOS Form Block

1. Open your Shopify development store admin.
2. Go to **Online Store -> Themes -> Customize**.
3. Open the page/template where you want the form.
4. Add an app block named **FormOS Form**.
5. Enter:
   - **FormOS Base URL**: copied from the **FormOS Embed** app page, usually `https://formos.com.au`
   - **Form ID**: copied from the **FormOS Embed** app page form picker or FormOS form detail page
   - **Height**: for example `800`
6. Adjust appearance settings if needed.
7. Save the theme.

### Why The Theme Block Uses A Manual Form ID

WordPress Gutenberg blocks can fetch FormOS forms and show a live dropdown in the editor. Shopify Theme App Extension block settings are static Liquid schema, so they cannot safely populate a live external dropdown from FormOS inside the Theme Editor. For Shopify, the connected form picker lives in the **FormOS Embed** admin app page, and the Theme Editor block remains a reliable manual Base URL/Form ID embed.

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

## Manual API Test

You can test the FormOS endpoint outside Shopify:

```bash
curl -H "Authorization: Bearer YOUR_FORMOS_API_TOKEN" \
  https://formos.com.au/api/external/forms
```

The API returns safe form metadata only:

- `id`
- `title`
- `status`
- `mode`
- `updatedAt`
- `embedUrl`

It does not return submissions, fields, storage credentials, billing data, or owner private data.

## Testing A Submission

1. Publish the target form in FormOS.
2. Open the Shopify app admin page.
3. Save a valid FormOS API token.
4. Confirm forms load automatically and copy the desired Form ID.
5. Add the Shopify app block to a development theme.
6. Enter the FormOS Base URL and copied Form ID.
7. Open the storefront page.
8. Submit a test response.
9. Confirm the submission appears in the FormOS dashboard.
10. If the form includes uploads, confirm the owner's active FormOS storage integration receives the files.

## Security Notes

- Merchant-entered Liquid settings are escaped.
- The block does not accept raw scripts or arbitrary HTML.
- The saved FormOS API token is encrypted with the Shopify API secret before storage.
- The saved FormOS API token is not shown after saving.
- Submissions are not stored in Shopify.
- Submissions are not proxied through Shopify.
- The block only creates an iframe to the public FormOS embed route.
- Shopify customer, order, and product data are not requested or synced.

## Future Compatibility

Possible future milestones:

- Select a form directly from the app page and write it into app block settings if Shopify provides a safe flow.
- Add a dynamic Theme Editor dropdown if Shopify introduces externally populated block settings.
- Store a per-store default FormOS Base URL.
- Add an app proxy if needed.
- Prepare Shopify App Store submission.
- Add Shopify billing if needed.

## Testing Learnings

- Choose extension-only app if you only need the theme block; choose embedded app if you need the FormOS Embed admin page.
- Shopify range settings must have no more than 101 steps.
- Use current theme and save changes in Theme Editor.
- Deploy the extension if it needs to work outside dev preview.
