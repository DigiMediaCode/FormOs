import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BLOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const RESERVED_BLOG_SLUGS = new Set([
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

export function slugifyBlogTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeBlogSlug(input: string, title: string) {
  return slugifyBlogTitle(input.trim() || title);
}

export function validateBlogSlug(slug: string) {
  if (!slug) {
    return "Slug is required.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug can only use lowercase letters, numbers, and hyphens.";
  }

  if (slug.includes("--")) {
    return "Slug cannot contain repeated hyphens.";
  }

  if (RESERVED_BLOG_SLUGS.has(slug)) {
    return "This slug is reserved. Please choose another slug.";
  }

  return null;
}

export async function assertBlogSlugAvailable(slug: string, postId?: string) {
  const existing = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== postId) {
    throw new Error("A blog post with this slug already exists.");
  }
}

export function sanitizeBlogHtml(content: string) {
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

export function renderBlogContent(content: string | null | undefined) {
  const source = content?.trim();

  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return sanitizeBlogHtml(source);
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export async function getPublishedBlogPosts(take?: number) {
  return prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      category: true,
    },
  });
}

export async function getPublishedBlogPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      category: true,
    },
  });
}

export async function findOrCreateBlogCategory(input: string) {
  const name = input.trim();

  if (!name) {
    return null;
  }

  const slug = slugifyBlogTitle(name);

  if (!slug) {
    throw new Error("Category name must include letters or numbers.");
  }

  return prisma.blogCategory.upsert({
    where: { slug },
    update: {
      name,
    },
    create: {
      name,
      slug,
    },
  });
}

export async function seedDefaultBlogPostIfMissing(authorId?: string) {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: "welcome-to-formos" },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.blogPost.create({
    data: {
      title: "Welcome to FormOS",
      slug: "welcome-to-formos",
      excerpt:
        "A draft introduction to FormOS, online forms, signed agreements, and automated document workflows.",
      content:
        "<p>Welcome to FormOS. Use this draft post as a starting point for product updates, tutorials, and customer education.</p>",
      status: "DRAFT",
      authorId,
    },
  });
}

export async function blogPostDataFromForm(
  formData: FormData,
  authorId: string,
  existingPostId?: string,
) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = normalizeBlogSlug(String(formData.get("slug") ?? ""), title);
  const status = String(formData.get("status") ?? "DRAFT").toUpperCase();
  const categoryId = optionalString(formData.get("categoryId"));
  const newCategoryName = optionalString(formData.get("newCategoryName"));
  let finalCategoryId = categoryId;

  if (!title) {
    throw new Error("Title is required.");
  }

  const slugError = validateBlogSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!BLOG_STATUSES.includes(status as BlogStatus)) {
    throw new Error("Invalid blog status.");
  }

  if (newCategoryName) {
    const category = await findOrCreateBlogCategory(newCategoryName);
    finalCategoryId = category?.id ?? null;
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
      featuredImage: optionalString(formData.get("featuredImage")),
      metaTitle: optionalString(formData.get("metaTitle")),
      metaDescription: optionalString(formData.get("metaDescription")),
      publishedAt,
      category: finalCategoryId
        ? {
            connect: {
              id: finalCategoryId,
            },
          }
        : existingPostId
          ? {
              disconnect: true,
            }
          : undefined,
      authorId,
    } satisfies Prisma.BlogPostUpdateInput,
    slug,
    existingPostId,
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
