"use client";

import { useEffect } from "react";

type AdUnitProps = {
  adsEnabled: boolean;
  clientId: string;
  slotId: string;
  label?: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdUnit({
  adsEnabled,
  className = "",
  clientId,
  label = "Sponsored",
  slotId,
}: AdUnitProps) {
  useEffect(() => {
    if (!adsEnabled || !clientId || !slotId) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ad failures must not break FormOS pages.
    }
  }, [adsEnabled, clientId, slotId]);

  if (!adsEnabled || !clientId || !slotId) {
    return null;
  }

  return (
    <aside className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {label || "Sponsored"}
      </p>
      <ins
        className="adsbygoogle block min-h-24"
        data-ad-client={clientId}
        data-ad-format="auto"
        data-ad-slot={slotId}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
