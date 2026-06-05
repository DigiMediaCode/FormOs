import { AdUnit } from "@/components/ads/ad-unit";

export function PublicFormAdUnit({
  settings,
}: {
  settings: {
    enabled: boolean;
    adsenseClientId: string;
    publicFormAdSlot: string;
    publicFormAdLabel: string;
  };
}) {
  return (
    <AdUnit
      adsEnabled={settings.enabled}
      className="shadow-sm"
      clientId={settings.adsenseClientId}
      label={settings.publicFormAdLabel}
      slotId={settings.publicFormAdSlot}
    />
  );
}
