import { AdUnit } from "@/components/ads/ad-unit";
import { GoogleAdSenseScript } from "@/components/ads/google-adsense-script";
import { getPlatformSettings } from "@/lib/platform/settings";

type PublicAdSectionProps = {
  className?: string;
  slot?: "top" | "middle" | "bottom";
};

export async function PublicAdSection({
  className = "",
  slot = "middle",
}: PublicAdSectionProps) {
  const settings = await getPlatformSettings();
  const slotId =
    slot === "top"
      ? settings.landingTopAdSlot
      : slot === "bottom"
        ? settings.landingBottomAdSlot
        : settings.landingMiddleAdSlot;
  const enabled =
    settings.adsEnabled &&
    settings.showLandingPageAds &&
    Boolean(settings.adsenseClientId) &&
    Boolean(slotId);

  if (!enabled) {
    return null;
  }

  return (
    <section className={`mx-auto max-w-[1088px] px-5 sm:px-8 ${className}`}>
      <GoogleAdSenseScript adsEnabled clientId={settings.adsenseClientId} />
      <AdUnit
        adsEnabled
        className="shadow-sm"
        clientId={settings.adsenseClientId}
        label={settings.publicFormAdLabel}
        slotId={slotId}
      />
    </section>
  );
}
