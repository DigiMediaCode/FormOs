import Script from "next/script";

export function GoogleAdSenseScript({
  adsEnabled,
  clientId,
}: {
  adsEnabled: boolean;
  clientId: string;
}) {
  if (!adsEnabled || !clientId) {
    return null;
  }

  return (
    <Script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
      strategy="afterInteractive"
    />
  );
}
