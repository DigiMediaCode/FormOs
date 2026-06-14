import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
  isOfficeField,
  normalizeFormFields,
  type FormBuilderField,
} from "@/lib/forms/fields";
import { isFieldVisible } from "@/lib/forms/conditional-logic";

type CompletedSubmissionPdfInput = {
  formTitle: string;
  submissionId: string;
  formVersion: number;
  formSnapshot: unknown;
  data: unknown;
  officeData: unknown;
  signatures: unknown;
  files: unknown;
  submittedAt: Date;
  completedAt: Date | null;
};

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
  pageStarted: boolean;
  logo: PDFImage | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const TOP_MARGIN = 44;
const BOTTOM_MARGIN = 72;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const MAX_SIGNATURE_DATA_URL_LENGTH = 750_000;
const FOOTER_TEXT = "Form Created using FormOS";
const LOGO_PATH = path.join(process.cwd(), "public", "pdf-logo.png");
const COLORS = {
  ink: rgb(0.06, 0.1, 0.16),
  muted: rgb(0.4, 0.45, 0.52),
  teal: rgb(0.02, 0.37, 0.36),
  tealSoft: rgb(0.9, 0.97, 0.96),
  line: rgb(0.83, 0.87, 0.91),
  fieldBg: rgb(0.985, 0.99, 0.995),
  white: rgb(1, 1, 1),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function snapshotFields(value: unknown) {
  const snapshot = isRecord(value) ? value : {};
  return normalizeFormFields(snapshot.fields);
}

function fieldLabel(field: FormBuilderField) {
  return safeText(field.label || field.content || field.id);
}

function fileNameFor(title: string, submissionId: string) {
  const safeTitle =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "completed-form";

  return `${safeTitle}-${submissionId.slice(0, 8)}.pdf`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = String(text || "").split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = safeText(paragraph).split(/\s+/).filter(Boolean);
    let current = "";

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

async function loadLogo(doc: PDFDocument) {
  try {
    const logoBytes = await readFile(LOGO_PATH);
    return await doc.embedPng(logoBytes);
  } catch {
    return null;
  }
}

function addPage(context: PdfContext) {
  context.page = context.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - TOP_MARGIN;
  context.pageStarted = false;
}

function ensureSpace(context: PdfContext, height: number) {
  if (context.y - height < BOTTOM_MARGIN) {
    addPage(context);
  }
}

function drawText(
  context: PdfContext,
  text: string,
  options: {
    x?: number;
    size?: number;
    font?: PDFFont;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
    lineHeight?: number;
  } = {},
) {
  const x = options.x ?? MARGIN_X;
  const size = options.size ?? 10.5;
  const font = options.font ?? context.regular;
  const maxWidth = options.maxWidth ?? TEXT_WIDTH;
  const lineHeight = options.lineHeight ?? 15;
  const lines = wrapText(text, font, size, maxWidth);

  ensureSpace(context, lines.length * lineHeight);

  for (const line of lines) {
    context.page.drawText(line, {
      x,
      y: context.y,
      size,
      font,
      color: options.color ?? COLORS.ink,
    });
    context.y -= lineHeight;
  }
}

function drawHeader(context: PdfContext, title: string) {
  const headerTop = context.y;
  const logoBoxHeight = 70;
  const uppercaseTitle = safeText(title).toUpperCase();
  const titleLines = wrapText(uppercaseTitle, context.bold, 21, TEXT_WIDTH - 36);
  const titleBlockHeight = titleLines.length * 25;
  const headerHeight = logoBoxHeight + 22 + titleBlockHeight + 22;

  ensureSpace(context, headerHeight);

  if (context.logo) {
    const maxWidth = 92;
    const maxHeight = 56;
    const scale = Math.min(maxWidth / context.logo.width, maxHeight / context.logo.height, 1);
    const width = context.logo.width * scale;
    const height = context.logo.height * scale;

    context.page.drawImage(context.logo, {
      x: MARGIN_X,
      y: headerTop - height,
      width,
      height,
    });
  } else {
    context.page.drawRectangle({
      x: MARGIN_X,
      y: headerTop - 44,
      width: 60,
      height: 44,
      color: COLORS.white,
      borderColor: COLORS.line,
      borderWidth: 0.6,
    });
    context.page.drawText("FormOS", {
      x: MARGIN_X + 9,
      y: headerTop - 27,
      size: 10,
      font: context.bold,
      color: COLORS.teal,
    });
  }

  let titleY = headerTop - logoBoxHeight - 20;

  for (const line of titleLines) {
    const lineWidth = context.bold.widthOfTextAtSize(line, 21);
    context.page.drawText(line, {
      x: (PAGE_WIDTH - lineWidth) / 2,
      y: titleY,
      size: 21,
      font: context.bold,
      color: COLORS.teal,
    });
    titleY -= 25;
  }

  context.page.drawLine({
    start: { x: MARGIN_X, y: titleY + 7 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: titleY + 7 },
    thickness: 0.8,
    color: COLORS.line,
  });

  context.y = titleY - 16;
}

function drawSectionHeading(context: PdfContext, text: string) {
  context.y -= context.pageStarted ? 12 : 0;
  ensureSpace(context, 42);
  context.pageStarted = true;

  drawText(context, text, {
    size: 16,
    font: context.bold,
    color: COLORS.teal,
    lineHeight: 22,
  });
  context.page.drawLine({
    start: { x: MARGIN_X, y: context.y + 6 },
    end: { x: MARGIN_X + 92, y: context.y + 6 },
    thickness: 1.2,
    color: COLORS.teal,
  });
  context.y -= 10;
}

function drawDisplayText(context: PdfContext, text: string) {
  if (!safeText(text)) {
    return;
  }

  context.pageStarted = true;
  drawText(context, text, {
    size: 10.2,
    color: COLORS.muted,
    lineHeight: 15.5,
  });
  context.y -= 8;
}

function drawFieldValue(context: PdfContext, label: string, value: string) {
  const cleanLabel = safeText(label);
  const cleanValue = safeText(value) || "No answer";
  const valueX = MARGIN_X + 198;
  const valueWidth = PAGE_WIDTH - valueX - MARGIN_X;
  const valueLines = wrapText(cleanValue, context.regular, 10.4, valueWidth);
  const rowHeight = Math.max(34, valueLines.length * 15.5 + 15);

  ensureSpace(context, rowHeight);
  context.pageStarted = true;

  context.page.drawRectangle({
    x: MARGIN_X,
    y: context.y - rowHeight,
    width: TEXT_WIDTH,
    height: rowHeight,
    color: COLORS.fieldBg,
    borderColor: COLORS.line,
    borderWidth: 0.4,
  });

  context.page.drawText(cleanLabel, {
    x: MARGIN_X + 14,
    y: context.y - 20,
    size: 10,
    font: context.bold,
    color: COLORS.ink,
    maxWidth: 176,
  });

  let valueY = context.y - 20;

  for (const line of valueLines) {
    context.page.drawText(line, {
      x: valueX,
      y: valueY,
      size: 10.4,
      font: context.regular,
      color: COLORS.ink,
    });
    valueY -= 15.5;
  }

  context.y -= rowHeight + 7;
}

function answerFor(field: FormBuilderField, data: Record<string, unknown>) {
  const rawValue = data[field.id];

  if (field.type === "checkbox") {
    return rawValue === true ? "Yes" : "No";
  }

  if (field.type === "select") {
    const value = safeText(rawValue);
    return field.options.find((option) => option === value) ?? value;
  }

  return safeText(rawValue) || "No answer";
}

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/png;base64,") &&
    value.length <= MAX_SIGNATURE_DATA_URL_LENGTH
  );
}

async function drawSignature(
  context: PdfContext,
  label: string,
  dataUrl: string,
) {
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    drawFieldValue(context, label, "No signature provided");
    return;
  }

  try {
    const image = await context.doc.embedPng(Buffer.from(base64, "base64"));
    const maxWidth = 260;
    const maxHeight = 96;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const boxHeight = height + 58;

    ensureSpace(context, boxHeight);
    context.pageStarted = true;

    context.page.drawRectangle({
      x: MARGIN_X,
      y: context.y - boxHeight,
      width: TEXT_WIDTH,
      height: boxHeight,
      color: COLORS.fieldBg,
      borderColor: COLORS.line,
      borderWidth: 0.4,
    });
    context.page.drawText(safeText(label), {
      x: MARGIN_X + 14,
      y: context.y - 20,
      size: 10,
      font: context.bold,
      color: COLORS.ink,
    });
    context.page.drawImage(image, {
      x: MARGIN_X + 14,
      y: context.y - height - 34,
      width,
      height,
    });
    context.page.drawLine({
      start: { x: MARGIN_X + 14, y: context.y - height - 40 },
      end: { x: MARGIN_X + 310, y: context.y - height - 40 },
      thickness: 0.7,
      color: rgb(0.72, 0.76, 0.82),
    });
    context.y -= boxHeight + 9;
  } catch {
    drawFieldValue(context, label, "Signature image could not be rendered");
  }
}

function drawFooter(context: PdfContext) {
  for (const page of context.doc.getPages()) {
    const width = context.regular.widthOfTextAtSize(FOOTER_TEXT, 8.5);
    page.drawText(FOOTER_TEXT, {
      x: (PAGE_WIDTH - width) / 2,
      y: 32,
      size: 8.5,
      font: context.regular,
      color: COLORS.muted,
    });
  }
}

export async function generateCompletedSubmissionPdf(
  input: CompletedSubmissionPdfInput,
) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const context: PdfContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    regular,
    bold,
    y: PAGE_HEIGHT - TOP_MARGIN,
    pageStarted: false,
    logo: await loadLogo(doc),
  };
  const fields = snapshotFields(input.formSnapshot);
  const publicData = isRecord(input.data) ? input.data : {};
  const officeData = isRecord(input.officeData) ? input.officeData : {};
  const signatures = isRecord(input.signatures) ? input.signatures : {};

  drawHeader(context, input.formTitle);

  for (const field of fields) {
    if (!isOfficeField(field) && !isFieldVisible(field, publicData)) {
      continue;
    }

    if (field.type === "image_upload") {
      continue;
    }

    if (field.type === "section_heading") {
      drawSectionHeading(context, field.content || field.label);
      continue;
    }

    if (field.type === "static_text") {
      drawDisplayText(context, field.content || field.label);
      continue;
    }

    if (field.type === "html") {
      drawDisplayText(context, stripHtml(field.content));
      continue;
    }

    if (field.type === "signature" || field.type === "initials") {
      const value = signatures[field.id];

      if (isValidImageDataUrl(value)) {
        await drawSignature(context, fieldLabel(field), value);
      } else {
        drawFieldValue(context, fieldLabel(field), "No signature provided");
      }

      continue;
    }

    drawFieldValue(
      context,
      fieldLabel(field),
      answerFor(field, isOfficeField(field) ? officeData : publicData),
    );
  }

  drawFooter(context);

  const bytes = await doc.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: fileNameFor(input.formTitle, input.submissionId),
    mimeType: "application/pdf",
  };
}
