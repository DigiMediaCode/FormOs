import "server-only";

import { Prisma } from "@prisma/client";
import {
  PRIVACY_POLICY_EXCERPT,
  PRIVACY_POLICY_HTML,
} from "@/lib/legal/privacy-policy";
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
      excerpt: PRIVACY_POLICY_EXCERPT,
      content: PRIVACY_POLICY_HTML,
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
