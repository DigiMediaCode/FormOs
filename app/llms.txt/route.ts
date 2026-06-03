import { getAppUrl } from "@/lib/app-url";
import { getPlatformSettings } from "@/lib/platform/settings";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export async function GET() {
  const [settings, appUrl] = await Promise.all([
    getPlatformSettings(),
    Promise.resolve(safeAppUrl()),
  ]);

  const body = `# ${settings.siteName}

${settings.siteName} is a SaaS form builder for online forms, agreements, public submissions, signatures, file uploads, office-use fields, completed PDF delivery, QR code sharing, and submission activity timelines.

## Primary Pages
- Home: ${appUrl}/
- Pricing: ${appUrl}/pricing
- Privacy Policy: ${appUrl}/privacy-policy
- Terms of Service: ${appUrl}/terms-of-service
- Data Security: ${appUrl}/data-security
- Contact: ${appUrl}/contact

## Product Capabilities
- Visual form builder
- Public form links and QR codes
- Signature and initials capture
- Google Drive and Dropbox upload routing
- Office Use Only fields completed by form owners after submission
- Completed PDF generation and email delivery
- Submission activity timeline
- Vehicle Hire Agreement template support

## Indexing Notes
Public marketing and legal pages may be indexed. Dashboard, admin, API, private submissions, uploaded file metadata, storage tokens, and authenticated account areas should not be indexed.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
