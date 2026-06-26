import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { getAppUrl } from "@/lib/app-url";
import {
  getPlatformSettings,
  getRenderablePlatformLogoUrl,
  isSafePublicUrlOrPath,
} from "@/lib/platform/settings";
import {
  getPublicWorkspaceBranding,
  renderableWorkspaceLogoUrl,
} from "@/lib/workspaces/branding";

type BusinessDocumentPdfInput = {
  id: string;
  ownerId: string;
  type: string;
  title: string;
  documentNumber: string | null;
  status: string;
  clientSnapshot: unknown;
  ownerSnapshot: unknown;
  scopeOfWork: string | null;
  terms: string | null;
  paymentTerms: string | null;
  startDate: Date | null;
  endDate: Date | null;
  totalAmount: unknown;
  currency: string | null;
  signatures: unknown;
  createdAt: Date;
  completedAt: Date | null;
};

type LogoSource = "workspace" | "platform" | "fallback" | "none";

type LoadedLogo = {
  image: PDFImage | null;
  source: LogoSource;
};

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
  logo: LoadedLogo;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 44;
const TOP_MARGIN = 42;
const BOTTOM_MARGIN = 68;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const DEFAULT_LOGO_PATHS = ["/formos-logo-v2.png", "/formos-logo.png", "/pdf-logo.png"];
const MAX_SIGNATURE_DATA_URL_LENGTH = 750_000;

const COLORS = {
  ink: rgb(0.06, 0.1, 0.16),
  muted: rgb(0.39, 0.45, 0.54),
  faint: rgb(0.94, 0.97, 1),
  blue: rgb(0.1, 0.37, 0.96),
  blueDark: rgb(0.04, 0.16, 0.42),
  line: rgb(0.84, 0.88, 0.93),
  white: rgb(1, 1, 1),
  soft: rgb(0.98, 0.99, 1),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function richText(value: string | null | undefined) {
  const text = safeText(value);

  if (!text) {
    return "Not set";
  }

  return stripHtml(text)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function snapshotValue(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) {
    return "";
  }

  return safeText(snapshot[key]);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(date);
}

function formatAmount(value: unknown, currency: string | null) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return safeText(value);
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency || "AUD",
  }).format(amount);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  const paragraphs = String(text || "").split(/\n/);

  for (const paragraph of paragraphs) {
    const words = safeText(paragraph).split(/\s+/).filter(Boolean);
    let current = "";

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

async function readPublicAsset(assetPath: string) {
  try {
    return await readFile(path.join(process.cwd(), "public", assetPath.replace(/^\/+/, "")));
  } catch {
    return null;
  }
}

function absoluteLogoUrl(pathOrUrl: string) {
  if (!pathOrUrl || !isSafePublicUrlOrPath(pathOrUrl)) {
    return "";
  }

  if (pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  if (process.env.NODE_ENV !== "production" && pathOrUrl.startsWith("http://")) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith("/")) {
    return new URL(pathOrUrl, `${getAppUrl().replace(/\/+$/, "")}/`).toString();
  }

  return "";
}

async function fetchImageBytes(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedLogoImage(doc: PDFDocument, sourceUrl: string) {
  const bytes =
    sourceUrl.startsWith("/") && !sourceUrl.startsWith("/media/")
      ? await readPublicAsset(sourceUrl)
      : await fetchImageBytes(absoluteLogoUrl(sourceUrl));

  if (!bytes) {
    return null;
  }

  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

async function loadDocumentLogo(doc: PDFDocument, ownerId: string): Promise<LoadedLogo> {
  const branding = await getPublicWorkspaceBranding(ownerId);
  const workspaceLogoUrl = branding ? renderableWorkspaceLogoUrl(branding) : "";

  if (workspaceLogoUrl) {
    const image = await embedLogoImage(doc, workspaceLogoUrl);

    if (image) {
      return { image, source: "workspace" };
    }
  }

  const platformSettings = await getPlatformSettings();
  const platformLogoUrl = getRenderablePlatformLogoUrl(platformSettings);

  if (platformLogoUrl) {
    const image = await embedLogoImage(doc, platformLogoUrl);

    if (image) {
      return { image, source: "platform" };
    }
  }

  for (const fallbackPath of DEFAULT_LOGO_PATHS) {
    const image = await embedLogoImage(doc, fallbackPath);

    if (image) {
      return { image, source: "fallback" };
    }
  }

  return { image: null, source: "none" };
}

function addPage(ctx: PdfContext) {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - TOP_MARGIN;
}

function ensureSpace(ctx: PdfContext, height: number) {
  if (ctx.y - height < BOTTOM_MARGIN) {
    addPage(ctx);
  }
}

function drawRawText(
  ctx: PdfContext,
  text: string,
  x: number,
  y: number,
  options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {},
) {
  ctx.page.drawText(safeText(text), {
    x,
    y,
    size: options.size ?? 10,
    font: options.font ?? ctx.regular,
    color: options.color ?? COLORS.ink,
  });
}

function drawWrappedText(
  ctx: PdfContext,
  text: string,
  x: number,
  maxWidth: number,
  options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; lineHeight?: number } = {},
) {
  const size = options.size ?? 10.5;
  const font = options.font ?? ctx.regular;
  const lineHeight = options.lineHeight ?? size + 5;
  const lines = wrapText(text || "Not set", font, size, maxWidth);

  ensureSpace(ctx, lines.length * lineHeight + 4);

  for (const line of lines) {
    drawRawText(ctx, line, x, ctx.y, {
      font,
      size,
      color: options.color ?? COLORS.ink,
    });
    ctx.y -= lineHeight;
  }
}

function drawSectionTitle(ctx: PdfContext, title: string) {
  ensureSpace(ctx, 38);
  ctx.y -= 10;
  drawRawText(ctx, title, MARGIN_X, ctx.y, {
    font: ctx.bold,
    size: 13,
    color: COLORS.blueDark,
  });
  ctx.y -= 10;
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ctx.y },
    thickness: 0.8,
    color: COLORS.line,
  });
  ctx.y -= 20;
}

function drawInfoRow(ctx: PdfContext, label: string, value: string, x: number, y: number) {
  drawRawText(ctx, label, x, y, {
    font: ctx.bold,
    size: 7.8,
    color: COLORS.muted,
  });
  drawRawText(ctx, value || "Not set", x, y - 13, {
    size: 10,
    color: COLORS.ink,
  });
}

function drawInfoCard(
  ctx: PdfContext,
  items: Array<{ label: string; value: string }>,
  options: { columns?: number } = {},
) {
  const columns = options.columns ?? 3;
  const columnWidth = TEXT_WIDTH / columns;
  const rows = Math.ceil(items.length / columns);
  const rowHeight = 42;
  const height = rows * rowHeight + 20;

  ensureSpace(ctx, height + 10);
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - height,
    width: TEXT_WIDTH,
    height,
    color: COLORS.soft,
    borderColor: COLORS.line,
    borderWidth: 0.6,
  });

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawInfoRow(
      ctx,
      item.label,
      item.value,
      MARGIN_X + 14 + columnWidth * column,
      ctx.y - 22 - rowHeight * row,
    );
  });

  ctx.y -= height + 12;
}

function drawParagraphSection(
  ctx: PdfContext,
  title: string,
  text: string | null | undefined,
) {
  drawSectionTitle(ctx, title);
  drawWrappedText(ctx, richText(text), MARGIN_X, TEXT_WIDTH, {
    size: 10.4,
    lineHeight: 16,
    color: COLORS.ink,
  });
  ctx.y -= 8;
}

function ownerDisplayName(ownerSnapshot: unknown) {
  return (
    snapshotValue(ownerSnapshot, "companyName") ||
    snapshotValue(ownerSnapshot, "name") ||
    snapshotValue(ownerSnapshot, "email") ||
    "Business"
  );
}

function clientDisplayName(clientSnapshot: unknown) {
  return (
    snapshotValue(clientSnapshot, "companyName") ||
    snapshotValue(clientSnapshot, "name") ||
    snapshotValue(clientSnapshot, "email") ||
    "Client"
  );
}

function drawHeader(ctx: PdfContext, document: BusinessDocumentPdfInput) {
  const top = ctx.y;

  if (ctx.logo.image) {
    const maxWidth = 112;
    const maxHeight = 54;
    const scale = Math.min(
      maxWidth / ctx.logo.image.width,
      maxHeight / ctx.logo.image.height,
      1,
    );
    const width = ctx.logo.image.width * scale;
    const height = ctx.logo.image.height * scale;

    ctx.page.drawImage(ctx.logo.image, {
      x: MARGIN_X,
      y: top - height,
      width,
      height,
    });
  } else {
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: top - 44,
      width: 72,
      height: 36,
      color: COLORS.faint,
      borderColor: COLORS.line,
      borderWidth: 0.6,
    });
    drawRawText(ctx, "FormOS", MARGIN_X + 12, top - 29, {
      font: ctx.bold,
      size: 10,
      color: COLORS.blue,
    });
  }

  const ownerLines = [
    ownerDisplayName(document.ownerSnapshot),
    snapshotValue(document.ownerSnapshot, "address"),
    snapshotValue(document.ownerSnapshot, "phone"),
    snapshotValue(document.ownerSnapshot, "billingEmail") ||
      snapshotValue(document.ownerSnapshot, "email"),
  ].filter(Boolean);
  const rightX = PAGE_WIDTH - MARGIN_X - 210;
  let ownerY = top - 4;

  for (const line of ownerLines.slice(0, 5)) {
    const size = ownerY === top - 4 ? 10.5 : 8.6;
    drawRawText(ctx, line, rightX, ownerY, {
      font: ownerY === top - 4 ? ctx.bold : ctx.regular,
      size,
      color: ownerY === top - 4 ? COLORS.ink : COLORS.muted,
    });
    ownerY -= 12;
  }

  ctx.y = top - 92;
  drawRawText(ctx, document.type === "CONTRACT" ? "Contract" : "Agreement", MARGIN_X, ctx.y, {
    font: ctx.bold,
    size: 9,
    color: COLORS.blue,
  });
  ctx.y -= 27;
  drawWrappedText(ctx, document.title, MARGIN_X, TEXT_WIDTH, {
    font: ctx.bold,
    size: 24,
    lineHeight: 28,
    color: COLORS.ink,
  });
  ctx.y -= 8;
  drawInfoCard(ctx, [
    { label: "DOCUMENT NUMBER", value: document.documentNumber || document.id },
    { label: "STATUS", value: document.status },
    { label: "DATE", value: formatDate(document.completedAt || document.createdAt) },
    { label: "TYPE", value: document.type === "CONTRACT" ? "Contract" : "Agreement" },
    { label: "START DATE", value: formatDate(document.startDate) },
    { label: "END DATE", value: formatDate(document.endDate) },
  ]);
}

function drawParties(ctx: PdfContext, document: BusinessDocumentPdfInput) {
  drawSectionTitle(ctx, "Parties");
  drawInfoCard(
    ctx,
    [
      { label: "BUSINESS", value: ownerDisplayName(document.ownerSnapshot) },
      {
        label: "EMAIL",
        value:
          snapshotValue(document.ownerSnapshot, "billingEmail") ||
          snapshotValue(document.ownerSnapshot, "email"),
      },
      { label: "PHONE", value: snapshotValue(document.ownerSnapshot, "phone") },
      { label: "ADDRESS", value: snapshotValue(document.ownerSnapshot, "address") },
      { label: "TAX / BUSINESS ID", value: snapshotValue(document.ownerSnapshot, "taxId") },
      {
        label: "CONTACT NAME",
        value: snapshotValue(document.ownerSnapshot, "name") || ownerDisplayName(document.ownerSnapshot),
      },
    ],
    { columns: 2 },
  );
  drawInfoCard(
    ctx,
    [
      { label: "CLIENT", value: clientDisplayName(document.clientSnapshot) },
      { label: "EMAIL", value: snapshotValue(document.clientSnapshot, "email") },
      { label: "PHONE", value: snapshotValue(document.clientSnapshot, "phone") },
      { label: "ADDRESS", value: snapshotValue(document.clientSnapshot, "address") },
      {
        label: "BUSINESS ID",
        value: snapshotValue(document.clientSnapshot, "abnOrBusinessId"),
      },
      {
        label: "CONTACT NAME",
        value: snapshotValue(document.clientSnapshot, "name") || clientDisplayName(document.clientSnapshot),
      },
    ],
    { columns: 2 },
  );
}

function drawCommercialDetails(ctx: PdfContext, document: BusinessDocumentPdfInput) {
  drawSectionTitle(ctx, "Payment Terms");
  drawInfoCard(ctx, [
    { label: "AMOUNT", value: formatAmount(document.totalAmount, document.currency) },
    { label: "CURRENCY", value: document.currency || "AUD" },
    { label: "PERIOD", value: `${formatDate(document.startDate)} - ${formatDate(document.endDate)}` },
  ]);
  drawWrappedText(ctx, richText(document.paymentTerms), MARGIN_X, TEXT_WIDTH, {
    size: 10.4,
    lineHeight: 16,
  });
  ctx.y -= 8;
}

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/png;base64,") &&
    value.length <= MAX_SIGNATURE_DATA_URL_LENGTH
  );
}

function signatureDataUrl(signatures: unknown, key: string) {
  return isRecord(signatures) && isValidImageDataUrl(signatures[key])
    ? signatures[key]
    : "";
}

async function drawSignatureImage(ctx: PdfContext, dataUrl: string, x: number, y: number) {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    return false;
  }

  try {
    const image = await ctx.doc.embedPng(Buffer.from(base64, "base64"));
    const maxWidth = 170;
    const maxHeight = 50;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;

    ctx.page.drawImage(image, {
      x,
      y: y + 8,
      width,
      height,
    });
    return true;
  } catch {
    return false;
  }
}

async function drawSignatures(ctx: PdfContext, document: BusinessDocumentPdfInput) {
  drawSectionTitle(ctx, "Signatures");

  const height = 94;
  const columnGap = 28;
  const columnWidth = (TEXT_WIDTH - columnGap) / 2;
  ensureSpace(ctx, height + 12);

  const ownerX = MARGIN_X;
  const clientX = MARGIN_X + columnWidth + columnGap;
  const boxY = ctx.y - height;
  const ownerSignature = signatureDataUrl(document.signatures, "ownerSignature");
  const clientSignature = signatureDataUrl(document.signatures, "clientSignature");

  for (const [x, label, caption, dataUrl] of [
    [ownerX, "Business signature", ownerDisplayName(document.ownerSnapshot), ownerSignature],
    [clientX, "Client signature", clientDisplayName(document.clientSnapshot), clientSignature],
  ] as const) {
    ctx.page.drawRectangle({
      x,
      y: boxY,
      width: columnWidth,
      height,
      color: COLORS.white,
      borderColor: COLORS.line,
      borderWidth: 0.7,
    });

    const rendered = dataUrl ? await drawSignatureImage(ctx, dataUrl, x + 14, boxY + 28) : false;

    if (!rendered) {
      ctx.page.drawLine({
        start: { x: x + 14, y: boxY + 45 },
        end: { x: x + columnWidth - 14, y: boxY + 45 },
        thickness: 0.8,
        color: COLORS.line,
      });
    }

    drawRawText(ctx, label, x + 14, boxY + 22, {
      font: ctx.bold,
      size: 9,
      color: COLORS.ink,
    });
    drawRawText(ctx, caption, x + 14, boxY + 9, {
      size: 8,
      color: COLORS.muted,
    });
  }

  ctx.y -= height + 12;
}

function drawFooter(ctx: PdfContext) {
  const pages = ctx.doc.getPages();
  const showFormOsCredit = ctx.logo.source !== "workspace";

  pages.forEach((page, index) => {
    const pageText = `Page ${index + 1} of ${pages.length}`;
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN_X - ctx.regular.widthOfTextAtSize(pageText, 8.5),
      y: 30,
      size: 8.5,
      font: ctx.regular,
      color: COLORS.muted,
    });

    if (showFormOsCredit) {
      page.drawText("Created using FormOS", {
        x: MARGIN_X,
        y: 30,
        size: 8.5,
        font: ctx.regular,
        color: COLORS.muted,
      });
    }
  });
}

function fileNameFor(document: BusinessDocumentPdfInput) {
  const safeTitle =
    document.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "business-document";

  return `${safeTitle}-${document.id.slice(0, 8)}.pdf`;
}

export async function generateBusinessDocumentPdf(document: BusinessDocumentPdfInput) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: PdfContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    regular,
    bold,
    y: PAGE_HEIGHT - TOP_MARGIN,
    logo: await loadDocumentLogo(doc, document.ownerId),
  };

  drawHeader(ctx, document);
  drawParties(ctx, document);
  drawParagraphSection(
    ctx,
    document.type === "CONTRACT" ? "Work Scope" : "Agreement Scope",
    document.scopeOfWork,
  );
  drawParagraphSection(ctx, "Terms & Conditions", document.terms);
  drawCommercialDetails(ctx, document);
  await drawSignatures(ctx, document);
  drawFooter(ctx);

  const bytes = await doc.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: fileNameFor(document),
    mimeType: "application/pdf",
  };
}
