"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isHashOnlyNavigation(anchor: HTMLAnchorElement) {
  try {
    const url = new URL(anchor.href);

    return (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      Boolean(url.hash)
    );
  } catch {
    return false;
  }
}

function shouldTrackAnchor(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (
    event.defaultPrevented ||
    isModifiedClick(event) ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download") ||
    isHashOnlyNavigation(anchor)
  ) {
    return false;
  }

  return Boolean(anchor.href);
}

function shouldTrackButton(button: HTMLButtonElement) {
  if (button.disabled || button.getAttribute("aria-disabled") === "true") {
    return false;
  }

  const type = (button.getAttribute("type") || "submit").toLowerCase();
  return type === "submit" && Boolean(button.closest("form"));
}

export function GlobalPageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLoader() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoading(false);
  }

  function startLoader() {
    startedAtRef.current = Date.now();
    setLoading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      timeoutRef.current = null;
    }, 12000);
  }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (anchor instanceof HTMLAnchorElement && shouldTrackAnchor(anchor, event)) {
        startLoader();
        return;
      }

      const button = target.closest("button");
      if (button instanceof HTMLButtonElement && shouldTrackButton(button)) {
        startLoader();
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (!event.defaultPrevented) {
        startLoader();
      }
    }

    function handlePageShow() {
      clearLoader();
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", handlePageShow);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(250 - elapsed, 0);
    const timeout = setTimeout(clearLoader, remaining);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams, loading]);

  if (!loading) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Page loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999]"
      role="status"
    >
      <div className="h-1 w-full overflow-hidden bg-blue-100">
        <div className="h-full w-1/2 animate-[formos-loader_1.1s_ease-in-out_infinite] rounded-r-full bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.55)]" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xl shadow-slate-950/10 backdrop-blur">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        Loading...
      </div>
      <style jsx>{`
        @keyframes formos-loader {
          0% {
            transform: translateX(-105%);
          }
          55% {
            transform: translateX(95%);
          }
          100% {
            transform: translateX(205%);
          }
        }
      `}</style>
    </div>
  );
}
