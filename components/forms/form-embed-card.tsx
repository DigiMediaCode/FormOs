"use client";

import { useState } from "react";

type FormEmbedCardProps = {
  allowEmbeds: boolean;
  embedUrl: string;
  iframeCode: string;
  isPublished: boolean;
  jsCode: string;
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="max-h-44 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-50">
      <code>{code}</code>
    </pre>
  );
}

export function FormEmbedCard({
  allowEmbeds,
  embedUrl,
  iframeCode,
  isPublished,
  jsCode,
}: FormEmbedCardProps) {
  const [message, setMessage] = useState("");

  async function copyCode(code: string, label: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copy failed. The embed code is visible above.");
    }
  }

  if (!allowEmbeds) {
    return (
      <section className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900">
        <h2 className="text-xl font-semibold text-slate-950">Embed Form</h2>
        <p className="mt-2">
          Form embeds are not included in the owner&apos;s current plan.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Embed Form</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Copy an embed snippet and paste it into your website HTML.
            Submissions appear in your FormOS dashboard.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
            isPublished
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isPublished ? "Ready to embed" : "Publish before embedding"}
        </span>
      </div>

      {!isPublished ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This form is not published yet. Embedded visitors will see an
          unavailable message until it is published.
        </p>
      ) : null}

      <div className="mt-5 grid gap-5">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">iframe embed code</h3>
            <button
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              onClick={() => copyCode(iframeCode, "iframe code")}
              type="button"
            >
              Copy iframe code
            </button>
          </div>
          <CodeBlock code={iframeCode} />
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">JavaScript embed code</h3>
            <button
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              onClick={() => copyCode(jsCode, "JavaScript code")}
              type="button"
            >
              Copy JS code
            </button>
          </div>
          <CodeBlock code={jsCode} />
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          href={embedUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open embed preview
        </a>
      </div>

      <ol className="mt-5 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 sm:grid-cols-2">
        <li>1. Copy the embed code.</li>
        <li>2. Paste it into your website HTML.</li>
        <li>3. Publish your website.</li>
        <li>4. View submissions in FormOS.</li>
      </ol>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        WordPress and Shopify apps are coming soon. For now, use the iframe
        embed code.
      </p>
    </section>
  );
}
