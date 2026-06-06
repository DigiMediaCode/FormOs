import "server-only";

import { prisma } from "@/lib/prisma";

export const KB_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type KbStatus = (typeof KB_STATUSES)[number];

export const DEFAULT_KB_CATEGORIES = [
  "Getting Started",
  "Forms & Builder",
  "File Uploads",
  "Signatures & PDFs",
  "Billing & Plans",
  "Account & Security",
  "Team & Staff",
] as const;

const RESERVED_KB_SLUGS = new Set([
  "admin",
  "dashboard",
  "login",
  "signup",
  "api",
  "f",
  "p",
  "blog",
  "pricing",
  "privacy-policy",
  "terms-of-service",
  "data-security",
  "contact",
  "help",
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

export function slugifyKbTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeKbSlug(input: string, fallback: string) {
  return slugifyKbTitle(input.trim() || fallback);
}

export function validateKbSlug(slug: string) {
  if (!slug) {
    return "Slug is required.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug can only use lowercase letters, numbers, and hyphens.";
  }

  if (slug.includes("--")) {
    return "Slug cannot contain repeated hyphens.";
  }

  if (RESERVED_KB_SLUGS.has(slug)) {
    return "This slug is reserved. Please choose another slug.";
  }

  return null;
}

export async function assertKbCategorySlugAvailable(
  slug: string,
  categoryId?: string,
) {
  const existing = await prisma.kbCategory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== categoryId) {
    throw new Error("A knowledge base category with this slug already exists.");
  }
}

export async function assertKbArticleSlugAvailable(
  slug: string,
  articleId?: string,
) {
  const existing = await prisma.kbArticle.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== articleId) {
    throw new Error("A knowledge base article with this slug already exists.");
  }
}

export function sanitizeKbHtml(content: string) {
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

export function renderKbContent(content: string | null | undefined) {
  const source = content?.trim();

  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return sanitizeKbHtml(source);
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export async function seedDefaultKbCategoriesIfMissing() {
  for (const name of DEFAULT_KB_CATEGORIES) {
    const slug = slugifyKbTitle(name);

    await prisma.kbCategory.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        status: "PUBLISHED",
      },
    });
  }
}

export async function getPublishedKbCategories() {
  return prisma.kbCategory.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
  });
}

export async function getPublishedKbArticles({
  categorySlug,
  featured,
  q,
  take,
}: {
  categorySlug?: string;
  featured?: boolean;
  q?: string;
  take?: number;
} = {}) {
  const search = q?.trim();

  return prisma.kbArticle.findMany({
    where: {
      status: "PUBLISHED",
      ...(featured ? { isFeatured: true } : {}),
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug,
              status: "PUBLISHED",
            },
          }
        : {
            category: {
              is: {
                status: "PUBLISHED",
              },
            },
          }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { excerpt: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { updatedAt: "desc" },
    ],
    take,
    include: {
      category: true,
    },
  });
}

export async function getPublishedKbCategory(slug: string) {
  return prisma.kbCategory.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

export async function getPublishedKbArticle(
  categorySlug: string,
  articleSlug: string,
) {
  return prisma.kbArticle.findFirst({
    where: {
      slug: articleSlug,
      status: "PUBLISHED",
      category: {
        slug: categorySlug,
        status: "PUBLISHED",
      },
    },
    include: {
      category: true,
    },
  });
}

export function kbCategoryDataFromForm(
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeKbSlug(String(formData.get("slug") ?? ""), name);
  const status = String(formData.get("status") ?? "PUBLISHED").toUpperCase();
  const sortOrder = parseInteger(formData.get("sortOrder"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const slugError = validateKbSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!KB_STATUSES.includes(status as KbStatus)) {
    throw new Error("Invalid category status.");
  }

  return {
    name,
    slug,
    description: optionalString(formData.get("description")),
    status,
    sortOrder,
  };
}

export function kbArticleDataFromForm(
  formData: FormData,
  userId: string,
  existingArticleId?: string,
) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = normalizeKbSlug(String(formData.get("slug") ?? ""), title);
  const status = String(formData.get("status") ?? "DRAFT").toUpperCase();
  const categoryId = optionalString(formData.get("categoryId"));
  const sortOrder = parseInteger(formData.get("sortOrder"));
  const isFeatured = formData.get("isFeatured") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  const slugError = validateKbSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!KB_STATUSES.includes(status as KbStatus)) {
    throw new Error("Invalid article status.");
  }

  const publishedAtInput = optionalString(formData.get("publishedAt"));
  const publishedAt =
    status === "PUBLISHED"
      ? publishedAtInput
        ? new Date(publishedAtInput)
        : new Date()
      : null;

  if (publishedAtInput && Number.isNaN(publishedAt?.getTime())) {
    throw new Error("Published at must be a valid date/time.");
  }

  return {
    data: {
      title,
      slug,
      excerpt: optionalString(formData.get("excerpt")),
      content: optionalString(formData.get("content")),
      status,
      sortOrder,
      isFeatured,
      metaTitle: optionalString(formData.get("metaTitle")),
      metaDescription: optionalString(formData.get("metaDescription")),
      publishedAt,
      updatedById: userId,
      ...(existingArticleId ? {} : { createdById: userId }),
      category: categoryId
        ? {
            connect: {
              id: categoryId,
            },
          }
        : existingArticleId
          ? {
              disconnect: true,
            }
          : undefined,
    },
    slug,
  };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseInteger(value: FormDataEntryValue | null) {
  const number = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(number) ? number : 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
