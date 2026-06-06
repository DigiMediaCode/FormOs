import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export function GET() {
  const appUrl = safeAppUrl();
  const script = `
(function () {
  var FORMOS_ORIGIN = ${JSON.stringify(appUrl)};
  var FORMOS_MESSAGE_TYPE = "FORMOS_EMBED_HEIGHT";
  var DEFAULT_HEIGHT = 800;
  var MIN_HEIGHT = 320;
  var MAX_HEIGHT = 5000;

  function safeFormId(value) {
    return typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value);
  }

  function createIframe(target) {
    var formId = target.getAttribute("data-formos-form");
    if (!safeFormId(formId) || target.getAttribute("data-formos-mounted") === "true") {
      return;
    }

    var height = Number(target.getAttribute("data-formos-height") || DEFAULT_HEIGHT);
    if (!Number.isFinite(height)) height = DEFAULT_HEIGHT;
    height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.floor(height)));

    var iframe = document.createElement("iframe");
    iframe.src = FORMOS_ORIGIN.replace(/\\/+$/, "") + "/embed/forms/" + encodeURIComponent(formId);
    iframe.width = "100%";
    iframe.height = String(height);
    iframe.loading = "lazy";
    iframe.title = target.getAttribute("data-formos-title") || "FormOS embedded form";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("data-formos-iframe", formId);
    iframe.style.border = "0";
    iframe.style.width = "100%";
    iframe.style.minHeight = height + "px";
    iframe.style.display = "block";

    target.setAttribute("data-formos-mounted", "true");
    target.appendChild(iframe);
  }

  function mount() {
    var targets = document.querySelectorAll("[data-formos-form]");
    for (var i = 0; i < targets.length; i += 1) {
      createIframe(targets[i]);
    }
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== FORMOS_ORIGIN) return;
    var data = event.data || {};
    if (data.type !== FORMOS_MESSAGE_TYPE || !safeFormId(data.formId)) return;
    var height = Number(data.height);
    if (!Number.isFinite(height)) return;
    height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.floor(height)));
    var iframe = document.querySelector('iframe[data-formos-iframe="' + data.formId + '"]');
    if (!iframe) return;
    iframe.height = String(height);
    iframe.style.minHeight = height + "px";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
`;

  return new NextResponse(script, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
