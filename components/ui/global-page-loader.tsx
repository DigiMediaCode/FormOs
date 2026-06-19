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
  const routeSignature = `${pathname}?${searchParams.toString()}`;
  const [loading, setLoading] = useState(false);
  const startedAtRef = useRef(0);
  const startedRouteRef = useRef(routeSignature);
  const currentRouteRef = useRef(routeSignature);
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
    startedRouteRef.current = currentRouteRef.current;
    setLoading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      timeoutRef.current = null;
    }, 20000);
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
    currentRouteRef.current = routeSignature;

    if (!loading) {
      return;
    }

    if (startedRouteRef.current === routeSignature) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(700 - elapsed, 0);
    const timeout = setTimeout(clearLoader, remaining);

    return () => clearTimeout(timeout);
  }, [routeSignature, loading]);

  if (!loading) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Page loading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-6 backdrop-blur-sm"
      role="status"
    >
      <div className="flex min-w-48 flex-col items-center gap-4 rounded-3xl border border-blue-100 bg-white/95 px-7 py-6 text-center shadow-2xl shadow-slate-950/20">
        <span className="h-12 w-12 animate-spin rounded-full border-[5px] border-blue-100 border-t-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-950">Loading</p>
          <p className="mt-1 text-xs text-slate-500">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
