"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Strikethrough,
  Underline,
  Upload,
  Video,
  X,
} from "lucide-react";

type EditorMode = "visual" | "html";

type RichContentEditorProps = {
  help?: string;
  initialHtml?: string;
  label: string;
  name: string;
  onHtmlChange?: (html: string) => void;
};

type ToolbarButtonProps = {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
};

type MediaAssetOption = {
  id: string;
  publicPath: string;
  publicUrl?: string;
  fileName: string;
  originalName?: string | null;
  mimeType: string;
  altText?: string | null;
  size?: number;
};

const EMPTY_HTML = "<p></p>";

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, "");
}

function absoluteMediaUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl, window.location.origin).toString();
  } catch {
    return pathOrUrl;
  }
}

function mediaFragment(input: {
  alt: string;
  mimeType?: string;
  url: string;
}) {
  const url = escapeAttribute(absoluteMediaUrl(input.url));
  const alt = escapeAttribute(input.alt || "Uploaded media");

  return input.mimeType?.startsWith("video/")
    ? `<p><video controls style="max-width:100%;height:auto;border-radius:12px;" src="${url}"></video></p>`
    : `<p><img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:12px;" /></p>`;
}

function ToolbarButton({ children, label, onPress }: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 active:bg-blue-50 active:text-blue-700"
      onMouseDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px bg-slate-200" />;
}

function editorDocumentHtml(content: string) {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: #fff;
      color: #1e293b;
      direction: ltr;
      font-family: Inter, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.75;
      text-align: left;
      unicode-bidi: normal;
      writing-mode: horizontal-tb;
    }
    body {
      min-height: 210px;
      padding: 14px 16px;
      outline: none;
      overflow-wrap: anywhere;
    }
    p { margin: 0 0 12px; }
    h2 { margin: 0 0 12px; font-size: 22px; line-height: 1.3; font-weight: 700; color: #020617; }
    h3 { margin: 0 0 10px; font-size: 18px; line-height: 1.35; font-weight: 700; color: #020617; }
    a { color: #1d4ed8; text-decoration: underline; }
    blockquote { margin: 0 0 12px; padding-left: 14px; border-left: 4px solid #cbd5e1; color: #475569; }
    ul, ol { margin: 0 0 12px; padding-left: 24px; }
    img, video { display: block; max-width: 100%; height: auto; margin: 12px 0; border-radius: 12px; }
    code { border-radius: 4px; background: #f1f5f9; padding: 1px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    hr { margin: 16px 0; border: 0; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body contenteditable="true" spellcheck="true">${content || EMPTY_HTML}</body>
</html>`;
}

export function RichContentEditor({
  help,
  initialHtml = "",
  label,
  name,
  onHtmlChange,
}: RichContentEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeDocumentRef = useRef(editorDocumentHtml(initialHtml || EMPTY_HTML));
  const [html, setHtml] = useState(initialHtml || EMPTY_HTML);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [uploading, setUploading] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetOption[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getEditorDocument() {
    return iframeRef.current?.contentDocument ?? null;
  }

  function getEditorBody() {
    return getEditorDocument()?.body ?? null;
  }

  function syncFromVisual() {
    const body = getEditorBody();
    if (!body) {
      return;
    }

    const nextHtml = body.innerHTML || EMPTY_HTML;
    setHtml(nextHtml);
    onHtmlChange?.(nextHtml);
  }

  function setHtmlValue(nextHtml: string) {
    const finalHtml = nextHtml || EMPTY_HTML;
    setHtml(finalHtml);
    onHtmlChange?.(finalHtml);

    const body = getEditorBody();
    if (body && body.innerHTML !== finalHtml) {
      body.innerHTML = finalHtml;
    }
  }

  function initializeVisualEditor(syncContent = false) {
    const doc = getEditorDocument();
    const body = doc?.body;

    if (!doc || !body) {
      return;
    }

    doc.designMode = "on";
    if (syncContent && body.innerHTML !== html) {
      body.innerHTML = html || EMPTY_HTML;
    }
    body.setAttribute("contenteditable", "true");
    body.setAttribute("dir", "ltr");
    body.style.direction = "ltr";
    body.style.textAlign = "left";
    body.addEventListener("input", syncFromVisual);
    body.addEventListener("blur", syncFromVisual);
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || mode !== "visual") {
      return;
    }

    const onLoad = () => initializeVisualEditor(true);
    iframe.addEventListener("load", onLoad);
    initializeVisualEditor(true);

    return () => {
      iframe.removeEventListener("load", onLoad);
      const body = iframe.contentDocument?.body;
      body?.removeEventListener("input", syncFromVisual);
      body?.removeEventListener("blur", syncFromVisual);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function focusVisual() {
    const body = getEditorBody();
    body?.focus();
  }

  function runCommand(command: string, value?: string) {
    setError(null);
    const doc = getEditorDocument();
    if (!doc) {
      return;
    }

    focusVisual();
    doc.execCommand(command, false, value);
    syncFromVisual();
  }

  function insertHtml(fragment: string) {
    runCommand("insertHTML", fragment);
  }

  function clearFormatting() {
    const doc = getEditorDocument();
    const selectedText = doc?.getSelection()?.toString();

    if (selectedText) {
      runCommand("removeFormat");
      return;
    }

    setHtmlValue(stripTags(html));
  }

  function addLink() {
    const url = window.prompt("Enter a URL");
    if (!url) {
      return;
    }

    if (!url.startsWith("/") && !url.startsWith("https://") && !url.startsWith("http://")) {
      setError("Links must start with /, https://, or http://.");
      return;
    }

    runCommand("createLink", url);
  }

  function insertMedia(asset: MediaAssetOption) {
    const fragment = mediaFragment({
      alt: asset.altText || asset.originalName || asset.fileName || "Uploaded media",
      mimeType: asset.mimeType,
      url: asset.publicUrl || asset.publicPath,
    });

    if (mode === "html") {
      setHtmlValue(`${html}${fragment}`);
    } else {
      insertHtml(fragment);
    }

    setMediaPickerOpen(false);
  }

  async function loadMediaAssets() {
    setError(null);
    setMediaLoading(true);

    try {
      const response = await fetch("/api/admin/media", {
        headers: {
          accept: "application/json",
        },
      });
      const payload = (await response.json()) as {
        assets?: MediaAssetOption[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load media library.");
      }

      setMediaAssets(payload.assets ?? []);
    } catch (mediaError) {
      setError(mediaError instanceof Error ? mediaError.message : "Unable to load media library.");
    } finally {
      setMediaLoading(false);
    }
  }

  function openMediaLibrary() {
    setMediaPickerOpen(true);
    if (mediaAssets.length === 0) {
      void loadMediaAssets();
    }
  }

  async function uploadMedia(file: File | null) {
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        error?: string;
        publicPath?: string;
        publicUrl?: string;
        originalName?: string | null;
        mimeType?: string;
      };

      if (!response.ok || !payload.publicPath) {
        throw new Error(payload.error || "Upload failed.");
      }

      const fragment = mediaFragment({
        alt: payload.originalName || "Uploaded media",
        mimeType: payload.mimeType,
        url: payload.publicUrl || payload.publicPath,
      });

      if (mode === "html") {
        setHtmlValue(`${html}${fragment}`);
      } else if (payload.mimeType?.startsWith("video/")) {
        insertHtml(fragment);
      } else {
        insertHtml(fragment);
      }

      void loadMediaAssets();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <input name={name} type="hidden" value={html} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        {uploading ? (
          <span className="text-[11px] font-medium text-blue-700">Uploading media...</span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 p-2">
          <div className="mr-2 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === "visual" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
              onClick={() => setMode("visual")}
              type="button"
            >
              Visual
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === "html" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
              onClick={() => {
                if (mode === "visual") {
                  syncFromVisual();
                }
                setMode("html");
              }}
              type="button"
            >
              HTML
            </button>
          </div>
          <ToolbarButton label="Paragraph" onPress={() => runCommand("formatBlock", "<p>")}>
            <Pilcrow className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" onPress={() => runCommand("formatBlock", "<h2>")}>
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" onPress={() => runCommand("formatBlock", "<h3>")}>
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Bold" onPress={() => runCommand("bold")}>
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic" onPress={() => runCommand("italic")}>
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Underline" onPress={() => runCommand("underline")}>
            <Underline className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" onPress={() => runCommand("strikeThrough")}>
            <Strikethrough className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Inline code" onPress={() => runCommand("formatBlock", "<pre>")}>
            <Code className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Bullet list" onPress={() => runCommand("insertUnorderedList")}>
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" onPress={() => runCommand("insertOrderedList")}>
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" onPress={() => runCommand("formatBlock", "<blockquote>")}>
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Align left" onPress={() => runCommand("justifyLeft")}>
            <AlignLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Align center" onPress={() => runCommand("justifyCenter")}>
            <AlignCenter className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Align right" onPress={() => runCommand("justifyRight")}>
            <AlignRight className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Clear formatting" onPress={clearFormatting}>
            <Eraser className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Horizontal line" onPress={() => insertHtml("<hr />")}>
            <Minus className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Insert link" onPress={addLink}>
            <LinkIcon className="size-4" />
          </ToolbarButton>
          <label
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            title="Upload image or video"
          >
            <Upload className="size-4" />
            <input
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                void uploadMedia(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          <button
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
            onMouseDown={(event) => {
              event.preventDefault();
              openMediaLibrary();
            }}
            title="Open Media Library"
            type="button"
          >
            <Image className="size-3" />
            <Video className="size-3" />
            Media Library
          </button>
        </div>

        {mode === "visual" ? (
          <iframe
            className="block min-h-64 w-full bg-white"
            ref={iframeRef}
            sandbox="allow-same-origin"
            srcDoc={iframeDocumentRef.current}
            title={`${label} visual editor`}
          />
        ) : (
          <textarea
            className="min-h-64 w-full resize-y border-0 px-4 py-3 font-mono text-sm leading-7 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
            dir="ltr"
            lang="en"
            onChange={(event) => setHtmlValue(event.target.value)}
            spellCheck={false}
            style={{
              direction: "ltr",
              textAlign: "left",
              unicodeBidi: "normal",
              writingMode: "horizontal-tb",
            }}
            value={html}
          />
        )}
      </div>
      {mediaPickerOpen ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                Media Library
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Select an uploaded image or video to insert it into this email.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                disabled={mediaLoading}
                onClick={() => void loadMediaAssets()}
                type="button"
              >
                {mediaLoading ? "Loading..." : "Refresh"}
              </button>
              <button
                aria-label="Close media library"
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                onClick={() => setMediaPickerOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          {mediaLoading ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Loading media assets...
            </p>
          ) : mediaAssets.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              No media assets found yet. Upload an image using the upload button above.
            </p>
          ) : (
            <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {mediaAssets.map((asset) => {
                const src = absoluteMediaUrl(asset.publicUrl || asset.publicPath);
                const label = asset.altText || asset.originalName || asset.fileName;

                return (
                  <button
                    className="group grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    key={asset.id}
                    onClick={() => insertMedia(asset)}
                    type="button"
                  >
                    <span className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {asset.mimeType.startsWith("video/") ? (
                        <video
                          className="max-h-full max-w-full object-contain"
                          muted
                          src={src}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={label}
                          className="max-h-full max-w-full object-contain"
                          src={src}
                        />
                      )}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
      {help ? <p className="text-[11px] leading-4 text-slate-500">{help}</p> : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
