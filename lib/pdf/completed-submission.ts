import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  isOfficeField,
  normalizeFormFields,
  type FormBuilderField,
} from "@/lib/forms/fields";

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
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 54;
const TOP_MARGIN = 56;
const BOTTOM_MARGIN = 72;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const MAX_SIGNATURE_DATA_URL_LENGTH = 750_000;
const FOOTER_TEXT = "Form Created using FormOS";

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

function addPage(context: PdfContext) {
  context.page = context.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - TOP_MARGIN;
}

function ensureSpace(context: PdfContext, height: number) {
  if (context.y - height < BOTTOM_MARGIN) {
    addPage(context);
  }
}

function drawCenteredText(
  context: PdfContext,
  text: string,
  options: {
    y?: number;
    size: number;
    font: PDFFont;
    color?: ReturnType<typeof rgb>;
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  context.page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: options.y ?? context.y,
    size: options.size,
    font: options.font,
    color: options.color ?? rgb(0.05, 0.09, 0.16),
  });
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
      color: options.color ?? rgb(0.16, 0.19, 0.25),
    });
    context.y -= lineHeight;
  }
}

function drawRule(context: PdfContext) {
  ensureSpace(context, 12);
  context.page.drawLine({
    start: { x: MARGIN_X, y: context.y },
    end: { x: PAGE_WIDTH - MARGIN_X, y: context.y },
    thickness: 0.7,
    color: rgb(0.82, 0.86, 0.91),
  });
  context.y -= 16;
}

function drawTitle(context: PdfContext, title: string) {
  const lines = wrapText(title, context.bold, 24, TEXT_WIDTH);

  ensureSpace(context, lines.length * 30 + 28);

  for (const line of lines) {
    drawCenteredText(context, line, {
      size: 24,
      font: context.bold,
      color: rgb(0.02, 0.37, 0.36),
    });
    context.y -= 30;
  }

  context.y -= 8;
  drawRule(context);
}

function drawSectionHeading(context: PdfContext, text: string) {
  context.y -= 6;
  ensureSpace(context, 34);
  drawText(context, text, {
    size: 15,
    font: context.bold,
    color: rgb(0.02, 0.37, 0.36),
    lineHeight: 20,
  });
  context.y -= 4;
}

function drawDisplayText(context: PdfContext, text: string) {
  if (!safeText(text)) {
    return;
  }

  drawText(context, text, {
    size: 10.5,
    color: rgb(0.29, 0.33, 0.39),
    lineHeight: 15,
  });
  context.y -= 5;
}

function drawFieldValue(context: PdfContext, label: string, value: string) {
  const cleanLabel = safeText(label);
  const cleanValue = safeText(value) || "No answer";
  const labelWidth = Math.min(context.bold.widthOfTextAtSize(cleanLabel, 10.5), 185);
  const valueX = MARGIN_X + 205;
  const valueWidth = PAGE_WIDTH - valueX - MARGIN_X;
  const valueLines = wrapText(cleanValue, context.regular, 10.5, valueWidth);
  const rowHeight = Math.max(24, valueLines.length * 15 + 8);

  ensureSpace(context, rowHeight);

  context.page.drawRectangle({
    x: MARGIN_X,
    y: context.y - rowHeight + 4,
    width: TEXT_WIDTH,
    height: rowHeight,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.88, 0.91, 0.95),
    borderWidth: 0.4,
  });

  context.page.drawText(cleanLabel, {
    x: MARGIN_X + 12,
    y: context.y - 12,
    size: 10.5,
    font: context.bold,
    color: rgb(0.05, 0.09, 0.16),
    maxWidth: labelWidth,
  });

  let valueY = context.y - 12;

  for (const line of valueLines) {
    context.page.drawText(line, {
      x: valueX,
      y: valueY,
      size: 10.5,
      font: context.regular,
      color: rgb(0.16, 0.19, 0.25),
    });
    valueY -= 15;
  }

  context.y -= rowHeight + 5;
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
    const maxHeight = 92;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const boxHeight = height + 44;

    ensureSpace(context, boxHeight);

    context.page.drawRectangle({
      x: MARGIN_X,
      y: context.y - boxHeight + 4,
      width: TEXT_WIDTH,
      height: boxHeight,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.88, 0.91, 0.95),
      borderWidth: 0.4,
    });
    context.page.drawText(safeText(label), {
      x: MARGIN_X + 12,
      y: context.y - 14,
      size: 10.5,
      font: context.bold,
      color: rgb(0.05, 0.09, 0.16),
    });
    context.page.drawImage(image, {
      x: MARGIN_X + 12,
      y: context.y - height - 32,
      width,
      height,
    });
    context.y -= boxHeight + 6;
  } catch {
    drawFieldValue(context, label, "Signature image could not be rendered");
  }
}

function drawFooter(context: PdfContext) {
  for (const page of context.doc.getPages()) {
    const width = context.regular.widthOfTextAtSize(FOOTER_TEXT, 9);
    page.drawText(FOOTER_TEXT, {
      x: (PAGE_WIDTH - width) / 2,
      y: 32,
      size: 9,
      font: context.regular,
      color: rgb(0.45, 0.5, 0.58),
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
  };
  const fields = snapshotFields(input.formSnapshot);
  const publicData = isRecord(input.data) ? input.data : {};
  const officeData = isRecord(input.officeData) ? input.officeData : {};
  const signatures = isRecord(input.signatures) ? input.signatures : {};

  drawTitle(context, input.formTitle);

  for (const field of fields) {
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
