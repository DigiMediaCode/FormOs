"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Heading2,
  Image,
  Link as LinkIcon,
  MousePointerClick,
  Plus,
  Rows3,
  Trash2,
  Type,
} from "lucide-react";
import { RichContentEditor } from "@/components/admin/rich-content-editor";

type CmsBlockType = "heading" | "paragraph" | "image" | "button" | "section" | "html";

type CmsBlock = {
  id: string;
  type: CmsBlockType;
  heading?: string;
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  label?: string;
  html?: string;
  align?: "left" | "center";
};

const blockTypes: Array<{
  type: CmsBlockType;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "section", label: "Section", icon: Rows3 },
  { type: "image", label: "Image", icon: Image },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "html", label: "Safe HTML", icon: LinkIcon },
];

function createBlock(type: CmsBlockType): CmsBlock {
  const id = crypto.randomUUID();

  if (type === "heading") {
    return { id, type, heading: "New heading", align: "left" };
  }

  if (type === "paragraph") {
    return { id, type, html: "<p>Write your page text here.</p>" };
  }

  if (type === "section") {
    return {
      id,
      type,
      heading: "Section heading",
      text: "Add a clear section description here.",
    };
  }

  if (type === "image") {
    return { id, type, src: "", alt: "Page image" };
  }

  if (type === "button") {
    return { id, type, label: "Learn more", href: "/", align: "left" };
  }

  return { id, type, html: "<p>Add safe HTML here.</p>" };
}

function initialBlocks(content: string): CmsBlock[] {
  if (!content.trim()) {
  return [
    { id: "initial-heading", type: "heading", heading: "Page heading", align: "center" },
    { id: "initial-paragraph", type: "paragraph", text: "Write your introduction here." },
    ];
  }

  return [
    {
      id: "initial-html",
      type: "html",
      html: content,
    },
  ];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }

  return "";
}

function stripUnsafeHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*\/?>/gi, "")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/<input\b[^>]*\/?>/gi, "")
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]*/gi, "");
}

function renderBlock(block: CmsBlock) {
  const alignClass = block.align === "center" ? "text-center" : "";

  if (block.type === "heading") {
    return `<h2 class="${alignClass} text-3xl font-semibold tracking-tight text-slate-950">${escapeHtml(block.heading ?? "")}</h2>`;
  }

  if (block.type === "paragraph") {
    if (block.html) {
      return `<div class="text-base leading-8 text-slate-700">${stripUnsafeHtml(block.html)}</div>`;
    }

    return `<p class="text-base leading-8 text-slate-700">${escapeHtml(block.text ?? "").replace(/\n/g, "<br />")}</p>`;
  }

  if (block.type === "section") {
    return `<section class="rounded-2xl border border-slate-200 bg-slate-50 p-6"><h2 class="text-2xl font-semibold text-slate-950">${escapeHtml(block.heading ?? "")}</h2><p class="mt-3 text-base leading-8 text-slate-700">${escapeHtml(block.text ?? "").replace(/\n/g, "<br />")}</p></section>`;
  }

  if (block.type === "image") {
    const src = safeUrl(block.src ?? "");
    if (!src) {
      return "";
    }

    return `<figure><img class="w-full rounded-2xl border border-slate-200 object-cover" src="${escapeHtml(src)}" alt="${escapeHtml(block.alt ?? "")}" /></figure>`;
  }

  if (block.type === "button") {
    const href = safeUrl(block.href ?? "");
    if (!href) {
      return "";
    }

    return `<p class="${alignClass}"><a class="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm" href="${escapeHtml(href)}">${escapeHtml(block.label ?? "Open")}</a></p>`;
  }

  return stripUnsafeHtml(block.html ?? "");
}

function updateBlock(blocks: CmsBlock[], id: string, patch: Partial<CmsBlock>) {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

function moveBlock(blocks: CmsBlock[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= blocks.length) {
    return blocks;
  }

  const copy = [...blocks];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export function CmsPageBuilder({ initialContent }: { initialContent: string }) {
  const [blocks, setBlocks] = useState<CmsBlock[]>(() => initialBlocks(initialContent));
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const content = useMemo(() => blocks.map(renderBlock).filter(Boolean).join("\n\n"), [blocks]);

  async function uploadImage(blockId: string, file: File | null) {
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadingBlockId(blockId);

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
        originalName?: string | null;
      };

      if (!response.ok || !payload.publicPath) {
        throw new Error(payload.error || "Upload failed.");
      }

      setBlocks((current) =>
        updateBlock(current, blockId, {
          src: payload.publicPath,
          alt: payload.originalName ?? "Page image",
        }),
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingBlockId(null);
    }
  }

  return (
    <section className="grid gap-3">
      <input name="content" type="hidden" value={content} />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-950">Page Builder</p>
            <p className="text-xs text-slate-500">
              Add content blocks. The saved output is sanitized HTML.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockTypes.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
                  key={blockType.type}
                  onClick={() => setBlocks((current) => [...current, createBlock(blockType.type)])}
                  type="button"
                >
                  <Icon className="size-3.5" />
                  {blockType.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3">
          {blocks.map((block, index) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              key={block.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-950">
                    {block.type}
                  </p>
                  <p className="text-xs text-slate-500">Block {index + 1}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    disabled={index === 0}
                    onClick={() => setBlocks((current) => moveBlock(current, index, -1))}
                    title="Move up"
                    type="button"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    disabled={index === blocks.length - 1}
                    onClick={() => setBlocks((current) => moveBlock(current, index, 1))}
                    title="Move down"
                    type="button"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                    onClick={() =>
                      setBlocks((current) => current.filter((item) => item.id !== block.id))
                    }
                    title="Delete block"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3">
                {block.type === "heading" || block.type === "section" ? (
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Heading
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setBlocks((current) =>
                          updateBlock(current, block.id, { heading: event.target.value }),
                        )
                      }
                      value={block.heading ?? ""}
                    />
                  </label>
                ) : null}

                {block.type === "paragraph" ? (
                  <RichContentEditor
                    help="Format text and insert photos or videos. Uploaded media is stored in the FormOS Media Library."
                    initialHtml={block.html ?? escapeHtml(block.text ?? "")}
                    label="Paragraph content"
                    name={`paragraph-editor-${block.id}`}
                    onHtmlChange={(value) =>
                      setBlocks((current) => updateBlock(current, block.id, { html: value }))
                    }
                  />
                ) : null}

                {block.type === "section" ? (
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Text
                    <textarea
                      className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setBlocks((current) =>
                          updateBlock(current, block.id, { text: event.target.value }),
                        )
                      }
                      value={block.text ?? ""}
                    />
                  </label>
                ) : null}

                {block.type === "image" ? (
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                        Image URL / Path
                        <input
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          onChange={(event) =>
                            setBlocks((current) =>
                              updateBlock(current, block.id, { src: event.target.value }),
                            )
                          }
                          placeholder="/media/... or https://..."
                          value={block.src ?? ""}
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                        Alt text
                        <input
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          onChange={(event) =>
                            setBlocks((current) =>
                              updateBlock(current, block.id, { alt: event.target.value }),
                            )
                          }
                          value={block.alt ?? ""}
                        />
                      </label>
                    </div>
                    <label className="grid gap-1.5 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-3 text-xs font-medium text-blue-900">
                      Upload to Media Library
                      <input
                        accept="image/*"
                        className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                        disabled={uploadingBlockId === block.id}
                        onChange={(event) => {
                          void uploadImage(block.id, event.target.files?.[0] ?? null);
                          event.target.value = "";
                        }}
                        type="file"
                      />
                      <span className="text-[11px] font-normal leading-5 text-blue-800">
                        {uploadingBlockId === block.id
                          ? "Uploading image..."
                          : "Uploaded CMS/email assets are stored in FormOS media, not owner Drive or Dropbox."}
                      </span>
                    </label>
                    {uploadError && uploadingBlockId === null ? (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {uploadError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {block.type === "button" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                      Button Label
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) =>
                          setBlocks((current) =>
                            updateBlock(current, block.id, { label: event.target.value }),
                          )
                        }
                        value={block.label ?? ""}
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                      Link
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) =>
                          setBlocks((current) =>
                            updateBlock(current, block.id, { href: event.target.value }),
                          )
                        }
                        value={block.href ?? ""}
                      />
                    </label>
                  </div>
                ) : null}

                {(block.type === "heading" || block.type === "button") ? (
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Alignment
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setBlocks((current) =>
                          updateBlock(current, block.id, {
                            align: event.target.value as "left" | "center",
                          }),
                        )
                      }
                      value={block.align ?? "left"}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                    </select>
                  </label>
                ) : null}

                {block.type === "html" ? (
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Safe HTML
                    <textarea
                      className="min-h-40 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-6 text-slate-950 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setBlocks((current) =>
                          updateBlock(current, block.id, { html: event.target.value }),
                        )
                      }
                      value={block.html ?? ""}
                    />
                  </label>
                ) : null}
              </div>
            </article>
          ))}

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => setBlocks((current) => [...current, createBlock("paragraph")])}
            type="button"
          >
            <Plus className="size-4" />
            Add paragraph block
          </button>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <p className="text-sm font-semibold text-slate-950">Live Preview</p>
          <div
            className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: content || "<p>This page is empty.</p>" }}
          />
        </aside>
      </div>
    </section>
  );
}
