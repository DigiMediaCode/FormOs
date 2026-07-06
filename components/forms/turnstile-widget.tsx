"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * Renders the Cloudflare Turnstile widget inside the public form. Turnstile
 * injects a hidden `cf-turnstile-response` input into the enclosing <form>,
 * which is verified server-side in the submission gate.
 */
export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function renderWidget() {
      if (cancelled || widgetIdRef.current || !containerRef.current) {
        return;
      }

      if (!window.turnstile) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
      );

      if (existing) {
        existing.addEventListener("load", renderWidget, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", renderWidget, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be gone; ignore.
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="cf-turnstile" />;
}
