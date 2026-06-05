import { getPlatformSettings } from "@/lib/platform/settings";

export const dynamic = "force-dynamic";

function normalizeAdsensePublisherId(clientId: string) {
  const publisherId = clientId.trim().replace(/^ca-/, "");

  if (!/^pub-\d+$/.test(publisherId)) {
    return "";
  }

  return publisherId;
}

export async function GET() {
  const settings = await getPlatformSettings();
  const publisherId = normalizeAdsensePublisherId(settings.adsenseClientId);
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
