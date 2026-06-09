# CURRENT TASK — FormOS Milestone 34.1: Shopify App Account Connection + Form Picker

## Project Context

FormOS is a standalone SaaS-style form builder project.

Current state:

- FormOS embed system works.
- WordPress plugin works.
- Shopify Theme App Extension works.
- Shopify app block can render FormOS forms on Shopify storefront.
- Shopify block currently requires manual FormOS Base URL and Form ID.
- Public embed route exists at /embed/forms/{formId}.
- Embed theme customization works.
- FormOS public embed submissions work.
- Forms, submissions, storage, PDF, email, audit, billing, plans, staff, and Super Admin features work.
- Do not touch CommerceOS.

## Goal

Improve the Shopify integration so merchants can connect their FormOS account and select a form from a dropdown instead of manually typing a Form ID.

This milestone should build the foundation for a real Shopify app experience.

## Product Behaviour

A Shopify merchant should be able to:

1. Install/open the FormOS Shopify app.
2. Enter or connect a FormOS API token.
3. Save the connection.
4. See a list of their published FormOS forms.
5. Copy/use the selected form ID in the theme app block.
6. In the theme editor, select or enter the FormOS form.
7. Render the form on the storefront.

## Important Direction

Do not build full Shopify App Store submission yet.

Do not build Shopify billing.

Do not sync Shopify customers/orders.

Do not store FormOS submissions in Shopify.

Do not proxy form submissions through Shopify.

Do not build a full FormOS form builder inside Shopify.

The app should only connect to FormOS and help merchants select/embed forms.

## FormOS API Token Foundation

Add a secure API token system in FormOS.

Users should be able to generate an API token for external integrations.

Create dashboard route:

/dashboard/settings/api-tokens

Add dashboard nav link:

API Tokens

User can:

- create token
- name token
- view token once after creation
- revoke token
- see created date
- see last used date if implemented

Token rules:

- raw token shown only once
- store only token hash
- token belongs to user
- token can be revoked
- token should support scopes if simple

Suggested scopes:

- forms:read
- embeds:read

For this milestone, forms:read is enough.

## Prisma Model

Add:

ApiToken {
  id          String   @id @default(cuid())
  userId      String
  name        String
  tokenHash   String   @unique
  scopes      Json?
  lastUsedAt  DateTime?
  revokedAt   DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}

Create migration:

npx prisma migrate dev --name add_api_tokens

Do not use prisma db push.

## FormOS API Endpoint For Shopify

Create API endpoint:

GET /api/external/forms

Authentication:

Authorization: Bearer {apiToken}

Returns only the authenticated user's forms.

Return only safe fields:

[
  {
    "id": "formId",
    "title": "Vehicle Hire Agreement",
    "status": "PUBLISHED",
    "mode": "AGREEMENT",
    "updatedAt": "...",
    "embedUrl": "https://formos.com.au/embed/forms/formId"
  }
]

Rules:

- only return forms owned by token user
- preferably return published forms by default
- do not return submissions
- do not return private answers
- do not return storage tokens
- do not return owner private data

Optional query:

?status=PUBLISHED

## External API Security

- require valid non-revoked token
- token hash lookup only
- update lastUsedAt if practical
- return 401 for invalid token
- return safe JSON errors
- rate limit if existing helper exists
- do not log raw tokens

## Shopify App Admin Connection

In the Shopify app folder:

plugins/shopify/formos-embed-shopify/

Add or update app admin UI if scaffold supports it.

If current app is extension-only and no admin runtime exists, create clear documentation and a lightweight config approach.

Preferred if possible:

Create app admin/settings page:

FormOS Connection

Fields:

- FormOS Base URL
- FormOS API Token

Actions:

- Save connection
- Test connection
- Fetch Forms

Show:

- connection status
- list of forms from FormOS
- copy form ID button
- instructions to add app block in Theme Editor

If a full admin app is not available in the current scaffold, update README and prepare the next scaffold step.

## Shopify Theme App Extension Update

Update FormOS Form app block settings.

Current settings can remain:

- FormOS Base URL
- Form ID
- height/theme/accent/background/radius/compact/font

If Shopify app block cannot dynamically populate dropdown from app backend yet, keep manual Form ID field but improve instructions.

Add helper text:

Connect your FormOS account in the app settings to find your Form ID.

If dynamic source/settings are supported, add a form picker.

## Form Picker Strategy

Best MVP:

- Shopify app admin page fetches forms and shows Copy Form ID
- Theme block still uses Form ID text input

Future:

- app block dynamic dropdown populated by app backend

Do not overbuild dynamic dropdown if Shopify extension architecture makes it difficult.

## Installation / Usage Flow

Document clearly:

1. In FormOS, create API token from Dashboard → API Tokens.
2. In Shopify app, paste FormOS Base URL and API token.
3. Click Test Connection.
4. Select/copy desired Form ID.
5. Go to Theme Editor.
6. Add FormOS Form app block.
7. Paste Form ID.
8. Save theme.

## Plan / Package Controls

Add plan limit:

allowApiAccess: boolean

Default suggestion:

Free: false  
Starter: false  
Pro: true  
Business: true  
Unlimited: true

Update:

- plan editor
- user quota overrides
- effective limits

When user tries to create API token:

- check allowApiAccess
- if false, block with friendly error:
  API access is not included in your current plan.

This makes Shopify/advanced integrations a paid feature.

## Super Admin Visibility

Update Super Admin user detail if practical:

- API token count
- last API token usage
- API access allowed by plan

Do not expose raw tokens or token hashes.

## Security

- raw API token shown once only
- token hash stored only
- revoked tokens cannot be used
- external API returns only safe form data
- no submissions exposed
- no storage tokens exposed
- no billing data exposed
- no private user data exposed
- plan allowApiAccess enforced server-side

## Out of Scope

Do not build full Shopify App Store submission.
Do not build Shopify billing.
Do not build Shopify customer/order sync.
Do not build form builder inside Shopify.
Do not build WordPress API connection.
Do not expose submissions API.
Do not build API token scopes beyond forms read unless simple.
Do not integrate CommerceOS.

## Acceptance Criteria

Milestone 34.1 is complete when:

- ApiToken model exists.
- Prisma migration exists.
- User can create API token in FormOS.
- Raw token is shown only once.
- Token hash is stored.
- User can revoke token.
- Plan limit allowApiAccess exists.
- API token creation respects allowApiAccess.
- GET /api/external/forms exists.
- External forms API authenticates Bearer token.
- External forms API returns only safe form list.
- Revoked/invalid token is rejected.
- Shopify app documentation explains API token connection.
- Shopify app can test/fetch forms if admin runtime exists, or README documents current manual flow.
- Shopify theme block still works.
- Existing embed route still works.
- Existing WordPress plugin still works.
- Existing FormOS app features still work.
- npx prisma validate passes.
- npx prisma generate passes.
- npm run build passes.