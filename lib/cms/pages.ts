import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CMS_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type CmsStatus = (typeof CMS_STATUSES)[number];

export const RESERVED_CMS_SLUGS = new Set([
  "admin",
  "dashboard",
  "login",
  "signup",
  "api",
  "f",
  "p",
  "pricing",
  "privacy-policy",
  "terms-of-service",
]);

const BLOCKED_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
];

export function slugifyCmsTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeCmsSlug(input: string, title: string) {
  return slugifyCmsTitle(input.trim() || title);
}

export function validateCmsSlug(slug: string) {
  if (!slug) {
    return "Slug is required.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug can only use lowercase letters, numbers, and hyphens.";
  }

  if (slug.includes("--")) {
    return "Slug cannot contain repeated hyphens.";
  }

  if (RESERVED_CMS_SLUGS.has(slug)) {
    return "This slug is reserved. Please choose another slug.";
  }

  return null;
}

export async function assertCmsSlugAvailable(slug: string, pageId?: string) {
  const existing = await prisma.cmsPage.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== pageId) {
    throw new Error("A page with this slug already exists.");
  }
}

export function sanitizeCmsHtml(content: string) {
  let safe = content;

  for (const tag of BLOCKED_TAGS) {
    safe = safe.replace(
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"),
      "",
    );
    safe = safe.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  safe = safe
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]*/gi, "");

  return safe;
}

export function renderCmsContent(content: string | null | undefined) {
  const source = content?.trim();

  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return sanitizeCmsHtml(source);
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export async function getPublishedCmsPage(slug: string) {
  return prisma.cmsPage.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

export async function getCmsHeaderPages() {
  return prisma.cmsPage.findMany({
    where: {
      status: "PUBLISHED",
      showInHeader: true,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      menuLabel: true,
    },
  });
}

export async function getCmsFooterPages() {
  return prisma.cmsPage.findMany({
    where: {
      status: "PUBLISHED",
      showInFooter: true,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      menuLabel: true,
    },
  });
}

export async function seedDefaultCmsPagesIfMissing(createdById?: string) {
  const defaultPages = [
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      excerpt: "How FormOS handles account data, submissions, uploads, integrations, and advertising.",
      content: `<p>This editable privacy policy should be reviewed before publishing. FormOS handles account data, form submissions, connected storage metadata, integrations, and advertising disclosures.</p>
<h2>Google User Data and Google Drive Integration</h2>
<h3>Google Data We Access</h3>
<p>When a FormOS user connects Google Drive, FormOS may access basic Google account information such as the connected Google account email address or profile identifier, Google Drive folder information selected or created by the user for FormOS storage, Google Drive file and folder metadata needed to create folders, upload files, organize submissions, and display upload status, files uploaded through FormOS forms that the form owner chooses to store in their connected Google Drive, and generated FormOS documents such as completed PDFs when saved or sent as part of a form workflow.</p>
<h3>How We Use Google User Data</h3>
<p>FormOS uses Google user data only to connect the user's Google Drive account, let the user select or configure a Google Drive storage folder, create organized folders for forms and submissions, upload respondent files into the connected Drive folder, store generated PDFs or documents related to submissions, display integration status, upload status, and submission file metadata, and troubleshoot Drive upload issues when support is requested.</p>
<h3>What We Do Not Do</h3>
<p>FormOS does not sell Google user data, does not use Google user data for advertising, does not use Google user data to train AI models, does not transfer Google user data to third parties except as necessary to provide the requested FormOS service, comply with law, or protect platform security, and does not expose Google Drive OAuth tokens to public form submitters.</p>
<h3>Storage and Retention</h3>
<p>Uploaded files are stored in the connected user's Google Drive account. FormOS may store limited metadata such as file name, Google Drive file ID, file URL or reference, upload time, form ID, submission ID, and upload status. FormOS stores OAuth connection data and tokens securely server-side to keep the integration working. Disconnecting Google Drive stops future uploads through FormOS. Files already stored in the user's Google Drive remain under the user's control.</p>
<h3>User Control and Revocation</h3>
<p>Users can disconnect Google Drive from FormOS. Users can also revoke FormOS access from their Google Account permissions page. After revocation, FormOS cannot upload files to that Drive account unless the user reconnects it.</p>
<h3>Data Protection</h3>
<p>Dashboard and integration pages require authentication. Ownership checks protect forms and submissions. OAuth tokens are not exposed to public users. FormOS uses reasonable technical and organizational safeguards to protect connected storage metadata and integration credentials.</p>
<p>FormOS may display third-party advertising on public pages or free-plan public forms. Ad providers may use cookies or similar technologies subject to their own policies. Contact staff@mediacode.com.au for privacy questions.</p>`,
      showInFooter: true,
      sortOrder: 10,
    },
    {
      title: "Terms of Service",
      slug: "terms-of-service",
      excerpt: "The terms that apply when using FormOS.",
      content:
        "This editable terms of service placeholder should be reviewed before publishing. FormOS provides software tools and templates, but does not provide legal advice.",
      showInFooter: true,
      sortOrder: 20,
    },
    {
      title: "Data Security",
      slug: "data-security",
      excerpt: "How FormOS approaches submissions, connected storage, and access control.",
      content:
        "This editable data security placeholder should be reviewed before publishing. FormOS routes uploaded files to connected owner storage and protects dashboard access with authentication and permission checks.",
      showInFooter: true,
      sortOrder: 30,
    },
    {
      title: "Contact",
      slug: "contact",
      excerpt: "Contact the FormOS team.",
      content:
        "This editable contact page placeholder should be reviewed before publishing. Add your support email, business details, and preferred support process.",
      showInFooter: true,
      sortOrder: 40,
    },
  ];

  for (const page of defaultPages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        ...page,
        status: "DRAFT",
        menuLabel: page.title,
        createdById,
        updatedById: createdById,
      },
    });
  }
}

export function cmsPageDataFromForm(
  formData: FormData,
  userId: string,
  existingPageId?: string,
) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = normalizeCmsSlug(String(formData.get("slug") ?? ""), title);
  const status = String(formData.get("status") ?? "DRAFT").toUpperCase();

  if (!title) {
    throw new Error("Title is required.");
  }

  const slugError = validateCmsSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!CMS_STATUSES.includes(status as CmsStatus)) {
    throw new Error("Invalid page status.");
  }

  return {
    data: {
      title,
      slug,
      excerpt: optionalString(formData.get("excerpt")),
      content: optionalString(formData.get("content")),
      status,
      metaTitle: optionalString(formData.get("metaTitle")),
      metaDescription: optionalString(formData.get("metaDescription")),
      showInHeader: formData.get("showInHeader") === "on",
      showInFooter: formData.get("showInFooter") === "on",
      menuLabel: optionalString(formData.get("menuLabel")),
      sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
      updatedById: userId,
      publishedAt:
        status === "PUBLISHED"
          ? new Date()
          : status === "ARCHIVED"
            ? null
            : undefined,
    } satisfies Prisma.CmsPageUpdateInput,
    slug,
    existingPageId,
  };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
