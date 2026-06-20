"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Eye,
  Palette,
  SlidersHorizontal,
} from "lucide-react";

type FormEmbedCardProps = {
  allowEmbeds: boolean;
  embedUrl: string;
  formId: string;
  isPublished: boolean;
  scriptUrl: string;
};

type WidgetSettings = {
  accent: string;
  background: string;
  border: string;
  compact: boolean;
  font: string;
  height: number;
  radius: string;
  surface: string;
  text: string;
  theme: string;
};

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  accent: "#2563eb",
  background: "transparent",
  border: "#e2e8f0",
  compact: true,
  font: "system",
  height: 800,
  radius: "12",
  surface: "#ffffff",
  text: "#0f172a",
  theme: "light",
};

const themeOptions = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["auto", "Auto"],
];

const backgroundOptions = [
  ["transparent", "Transparent"],
  ["white", "White"],
  ["subtle", "Subtle"],
  ["none", "None"],
];

const radiusOptions = [
  ["0", "Square"],
  ["6", "Soft 6"],
  ["8", "Soft 8"],
  ["12", "Rounded 12"],
  ["16", "Rounded 16"],
  ["20", "Rounded 20"],
];

const fontOptions = [
  ["system", "System"],
  ["sans", "Sans"],
  ["inherit", "Inherit website"],
];

function clampHeight(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_WIDGET_SETTINGS.height;
  }

  return Math.min(5000, Math.max(320, Math.floor(value)));
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <pre className="max-h-44 max-w-full overflow-x-auto overflow-y-auto p-4 text-xs leading-5 text-slate-50">
        <code className="block w-max whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function FieldLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

export function FormEmbedCard({
  allowEmbeds,
  embedUrl,
  formId,
  isPublished,
  scriptUrl,
}: FormEmbedCardProps) {
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings>(
    DEFAULT_WIDGET_SETTINGS,
  );

  const widgetUrl = useMemo(() => {
    const params = new URLSearchParams({
      accent: settings.accent,
      bg: settings.background,
      border: settings.border,
      compact: String(settings.compact),
      font: settings.font,
      radius: settings.radius,
      surface: settings.surface,
      text: settings.text,
      theme: settings.theme,
    });

    return `${embedUrl}?${params.toString()}`;
  }, [embedUrl, settings]);

  const safeHeight = clampHeight(settings.height);
  const iframeCode = `<iframe
  src="${widgetUrl}"
  width="100%"
  height="${safeHeight}"
  frameborder="0"
  style="border:0; width:100%; min-height:${safeHeight}px;"
  loading="lazy"
></iframe>`;
  const jsCode = `<div
  data-formos-form="${formId}"
  data-formos-height="${safeHeight}"
  data-formos-src="${widgetUrl}"
></div>
<script src="${scriptUrl}" async></script>`;

  async function copyCode(code: string, label: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copy failed. The widget code is visible above.");
    }
  }

  function updateSetting<Key extends keyof WidgetSettings>(
    key: Key,
    value: WidgetSettings[Key],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  if (!allowEmbeds) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <h2 className="text-lg font-semibold text-slate-950">Embed Widget</h2>
        <p className="mt-2">
          Form embeds are not included in the owner&apos;s current plan.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Widget
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Design your embed widget
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Match the embedded form to your website, then copy the iframe or
            auto-height JavaScript widget code.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isPublished
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isPublished ? <Check className="size-3.5" /> : null}
          {isPublished ? "Ready to embed" : "Publish before embedding"}
        </span>
      </div>

      {!isPublished ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This form is not published yet. Embedded visitors will see an
          unavailable message until it is published.
        </p>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-950">
              Appearance
            </h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Theme">
              <select
                className={inputClass()}
                onChange={(event) => updateSetting("theme", event.target.value)}
                value={settings.theme}
              >
                {themeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Background">
              <select
                className={inputClass()}
                onChange={(event) =>
                  updateSetting("background", event.target.value)
                }
                value={settings.background}
              >
                {backgroundOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Accent">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                onChange={(event) => updateSetting("accent", event.target.value)}
                type="color"
                value={settings.accent}
              />
            </FieldLabel>

            <FieldLabel label="Card surface">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                onChange={(event) => updateSetting("surface", event.target.value)}
                type="color"
                value={settings.surface}
              />
            </FieldLabel>

            <FieldLabel label="Text">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                onChange={(event) => updateSetting("text", event.target.value)}
                type="color"
                value={settings.text}
              />
            </FieldLabel>

            <FieldLabel label="Border">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
                onChange={(event) => updateSetting("border", event.target.value)}
                type="color"
                value={settings.border}
              />
            </FieldLabel>

            <FieldLabel label="Radius">
              <select
                className={inputClass()}
                onChange={(event) => updateSetting("radius", event.target.value)}
                value={settings.radius}
              >
                {radiusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Font">
              <select
                className={inputClass()}
                onChange={(event) => updateSetting("font", event.target.value)}
                value={settings.font}
              >
                {fontOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Default height">
              <input
                className={inputClass()}
                max={5000}
                min={320}
                onChange={(event) =>
                  updateSetting("height", Number(event.target.value))
                }
                type="number"
                value={settings.height}
              />
            </FieldLabel>

            <label className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Compact spacing
              <input
                checked={settings.compact}
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                onChange={(event) =>
                  updateSetting("compact", event.target.checked)
                }
                type="checkbox"
              />
            </label>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Widget preview
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                  onClick={() => setShowPreview((current) => !current)}
                  type="button"
                >
                  <Eye className="size-3.5" />
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
                <a
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                  href={widgetUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ArrowUpRight className="size-3.5" />
                  Open
                </a>
              </div>
            </div>
            {showPreview ? (
              <iframe
                className="mt-4 block w-full rounded-2xl border border-slate-200 bg-white"
                height={Math.min(safeHeight, 520)}
                loading="lazy"
                src={widgetUrl}
                title="FormOS widget preview"
              />
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-600">
                Preview is paused so it does not create extra form views while
                you edit. Use Show preview when you want to test the widget.
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-950">
                  iframe widget code
                </h3>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                onClick={() => copyCode(iframeCode, "iframe widget code")}
                type="button"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
            <div className="mt-3">
              <CodeBlock code={iframeCode} />
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Auto-height JavaScript widget
                </h3>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                onClick={() => copyCode(jsCode, "JavaScript widget code")}
                type="button"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
            <div className="mt-3">
              <CodeBlock code={jsCode} />
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}

      <ol className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 sm:grid-cols-2">
        <li>1. Design the widget.</li>
        <li>2. Copy iframe or JavaScript code.</li>
        <li>3. Paste it into your website.</li>
        <li>4. Submissions appear in FormOS.</li>
      </ol>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        WordPress and Shopify integrations can use the same FormOS embed URL and
        appearance query params.
      </p>
    </section>
  );
}
