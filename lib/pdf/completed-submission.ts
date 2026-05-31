import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  DISPLAY_ONLY_FIELD_TYPES,
  isOfficeField,
  isPublicField,
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
const MARGIN = 48;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;
const MAX_SIGNATURE_DATA_URL_LENGTH = 750_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not completed";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(date);
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

function snapshotFields(value: unknown) {
  const snapshot = isRecord(value) ? value : {};
  return normalizeFormFields(snapshot.fields);
}

function fieldLabel(field: FormBuilderField) {
  return field.label || field.content || field.id;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
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

  return lines.length > 0 ? lines : [""];
}

function addPage(context: PdfContext) {
  context.page = context.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - MARGIN;
}

function ensureSpace(context: PdfContext, height: number) {
  if (context.y - height < MARGIN) {
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
  const x = options.x ?? MARGIN;
  const size = options.size ?? FONT_SIZE;
  const font = options.font ?? context.regular;
  const maxWidth = options.maxWidth ?? TEXT_WIDTH;
  const lineHeight = options.lineHeight ?? LINE_HEIGHT;
  const lines = wrapText(text, font, size, maxWidth);

  ensureSpace(context, lines.length * lineHeight);

  for (const line of lines) {
    context.page.drawText(line, {
      x,
      y: context.y,
      size,
      font,
      color: options.color ?? rgb(0.12, 0.16, 0.23),
    });
    context.y -= lineHeight;
  }
}

function sectionTitle(context: PdfContext, text: string) {
  context.y -= 10;
  ensureSpace(context, 30);
  drawText(context, text, {
    size: 14,
    font: context.bold,
    color: rgb(0.02, 0.37, 0.36),
    lineHeight: 18,
  });
  context.y -= 2;
}

function keyValue(context: PdfContext, label: string, value: string) {
  drawText(context, label, {
    size: 9,
    font: context.bold,
    color: rgb(0.05, 0.09, 0.16),
  });
  drawText(context, value || "No answer", {
    x: MARGIN + 14,
    size: 10,
    maxWidth: TEXT_WIDTH - 14,
  });
  context.y -= 3;
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
    keyValue(context, label, "No signature provided");
    return;
  }

  try {
    const image = await context.doc.embedPng(Buffer.from(base64, "base64"));
    const maxWidth = 240;
    const maxHeight = 90;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;

    ensureSpace(context, height + 32);
    drawText(context, label, {
      size: 9,
      font: context.bold,
      color: rgb(0.05, 0.09, 0.16),
    });
    context.page.drawImage(image, {
      x: MARGIN + 14,
      y: context.y - height,
      width,
      height,
    });
    context.y -= height + 12;
  } catch {
    keyValue(context, label, "Signature image could not be rendered");
  }
}

function fileMetadataLines(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((file) => {
      const provider =
        file.provider === "dropbox"
          ? "Dropbox"
          : file.provider === "google_drive"
            ? "Google Drive"
            : "Storage provider";
      const lines = [
        `File: ${safeText(file.fileName) || "Unnamed file"}`,
        `Type: ${safeText(file.mimeType) || "Unknown type"}`,
        `Size: ${typeof file.size === "number" ? formatFileSize(file.size) : "Unknown size"}`,
        `Provider: ${provider}`,
      ];

      if (typeof file.uploadedAt === "string" && file.uploadedAt) {
        lines.push(`Uploaded: ${file.uploadedAt}`);
      }

      if (file.provider === "dropbox" && typeof file.path === "string") {
        lines.push(`Path: ${file.path}`);
      }

      if (file.provider === "google_drive" && typeof file.submissionFolderName === "string") {
        lines.push(`Folder: ${file.submissionFolderName}`);
      }

      if (file.provider === "google_drive" && typeof file.parentFolderName === "string") {
        lines.push(`Parent folder: ${file.parentFolderName}`);
      }

      return lines.join("\n");
    });
}

function fileNameFor(title: string, submissionId: string) {
  const safeTitle =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "completed-submission";

  return `${safeTitle}-${submissionId.slice(0, 8)}.pdf`;
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
    y: PAGE_HEIGHT - MARGIN,
  };
  const fields = snapshotFields(input.formSnapshot);
  const publicData = isRecord(input.data) ? input.data : {};
  const officeData = isRecord(input.officeData) ? input.officeData : {};
  const signatures = isRecord(input.signatures) ? input.signatures : {};
  const files = isRecord(input.files) ? input.files : {};

  drawText(context, input.formTitle, {
    size: 20,
    font: bold,
    color: rgb(0.02, 0.37, 0.36),
    lineHeight: 24,
  });
  context.y -= 6;
  keyValue(context, "Submission ID", input.submissionId);
  keyValue(context, "Form version", `v${input.formVersion}`);
  keyValue(context, "Submitted", formatDateTime(input.submittedAt));
  keyValue(context, "Completed", formatDateTime(input.completedAt));

  sectionTitle(context, "Public Submitted Answers");
  for (const field of fields.filter(
    (field) =>
      isPublicField(field) &&
      !DISPLAY_ONLY_FIELD_TYPES.includes(field.type) &&
      field.type !== "signature" &&
      field.type !== "initials" &&
      field.type !== "image_upload",
  )) {
    keyValue(context, fieldLabel(field), answerFor(field, publicData));
  }

  sectionTitle(context, "Office Use Only Answers");
  const officeFields = fields.filter(isOfficeField);

  if (officeFields.length === 0) {
    drawText(context, "No office-use fields were included in this form.");
  } else {
    for (const field of officeFields) {
      if (DISPLAY_ONLY_FIELD_TYPES.includes(field.type)) {
        continue;
      }

      keyValue(context, fieldLabel(field), answerFor(field, officeData));
    }
  }

  sectionTitle(context, "Signatures and Initials");
  const signatureFields = fields.filter(
    (field) =>
      isPublicField(field) &&
      (field.type === "signature" || field.type === "initials"),
  );

  if (signatureFields.length === 0) {
    drawText(context, "No signature or initials fields were captured.");
  } else {
    for (const field of signatureFields) {
      const value = signatures[field.id];

      if (isValidImageDataUrl(value)) {
        await drawSignature(context, fieldLabel(field), value);
      } else {
        keyValue(context, fieldLabel(field), "No signature provided");
      }
    }
  }

  sectionTitle(context, "Uploaded File Metadata");
  const uploadFields = fields.filter(
    (field) => isPublicField(field) && field.type === "image_upload",
  );

  if (uploadFields.length === 0) {
    drawText(context, "No upload fields were included in this form.");
  } else {
    for (const field of uploadFields) {
      const metadata = fileMetadataLines(files[field.id]);

      if (metadata.length === 0) {
        keyValue(context, fieldLabel(field), "No file uploaded");
      } else {
        for (const file of metadata) {
          keyValue(context, fieldLabel(field), file);
        }
      }
    }
  }

  sectionTitle(context, "Footer");
  drawText(context, "Generated by FormOS.");
  drawText(context, `Generated at: ${new Date().toISOString()}`);
  drawText(context, "This PDF was generated from the submitted form snapshot.");

  const bytes = await doc.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: fileNameFor(input.formTitle, input.submissionId),
    mimeType: "application/pdf",
  };
}
