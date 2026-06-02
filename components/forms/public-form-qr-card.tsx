"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

type PublicFormQrCardProps = {
  formId: string;
  formSlug: string;
  publicFormUrl: string;
  status: string;
};

function statusWarning(status: string) {
  if (status === "DRAFT") {
    return "This form is not published yet. Public users will not be able to access it until it is published.";
  }

  if (status === "ARCHIVED") {
    return "This form is archived. Public users cannot access it.";
  }

  return null;
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function PublicFormQrCard({
  formId,
  formSlug,
  publicFormUrl,
  status,
}: PublicFormQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const warning = statusWarning(status);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(publicFormUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      width: 280,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (active) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl("");
        }
      });

    return () => {
      active = false;
    };
  }, [publicFormUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicFormUrl);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage("Copy failed. The link is visible above.");
    }
  }

  function downloadQrCode() {
    if (!qrDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `formos-${safeFileName(formSlug || formId) || formId}-qr.png`;
    link.click();
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-slate-950">
            Public Form Link
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Share this link or QR code with public submitters.
          </p>

          {warning ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              {warning}
            </p>
          ) : null}

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Public URL
            </p>
            <p className="mt-2 break-all text-sm text-slate-800">
              {publicFormUrl}
            </p>
          </div>

          {copyMessage ? (
            <p className="mt-3 text-sm text-slate-600">{copyMessage}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              onClick={copyLink}
              type="button"
            >
              Copy Link
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!qrDataUrl}
              onClick={downloadQrCode}
              type="button"
            >
              Download QR Code
            </button>
            <a
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={`/f/${formId}`}
              rel="noreferrer"
              target="_blank"
            >
              Open Public Form
            </a>
          </div>
        </div>

        <div className="flex w-full justify-center rounded-md border border-slate-200 bg-slate-50 p-5 lg:w-auto">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Public form QR code"
              className="h-56 w-56 rounded-md bg-white p-3 shadow-sm"
              src={qrDataUrl}
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
              QR code preview loading...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
