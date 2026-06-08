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

const DEFAULT_BLOG_POSTS = [
  {
    category: "Getting Started",
    title: "How to create your first online form in FormOS",
    slug: "how-to-create-your-first-online-form-in-formos",
    excerpt:
      "A practical first-form checklist covering fields, publishing, QR codes, and the first test submission.",
    featuredImage: "/blog/create-first-form.svg",
    metaDescription:
      "Learn how to create, publish, and test your first FormOS online form.",
    content: `
      <p>FormOS is designed to help you move from a blank form to a working public workflow quickly. Start with the outcome you need: a booking request, intake form, signed agreement, file collection form, or internal office workflow.</p>
      <h2>Start with the required fields</h2>
      <p>Add the fields you must collect first, such as name, email, phone, address, uploaded files, signatures, or initials. Keep optional fields separate so public users can finish the form without confusion.</p>
      <h2>Preview before publishing</h2>
      <p>Use the builder preview to check labels, required fields, placeholders, and office-only fields. Office-only fields stay hidden from the public form and can be completed after a submission arrives.</p>
      <h2>Publish and test</h2>
      <p>After publishing, open the public link or QR code and submit one test response. This confirms validation, uploads, signatures, storage routing, and submission notifications are all working as expected.</p>
    `,
  },
  {
    category: "Document Automation",
    title: "Collect signatures and send completed PDFs automatically",
    slug: "collect-signatures-and-send-completed-pdfs-automatically",
    excerpt:
      "How signature fields, office-use fields, and final PDF delivery work together in FormOS.",
    featuredImage: "/blog/signatures-pdf-delivery.svg",
    metaDescription:
      "Use FormOS signatures, office-only fields, and PDF delivery for signed document workflows.",
    content: `
      <p>Many forms do not end when a customer presses submit. They need internal review, office-only details, and a finished document that can be sent back to the right people.</p>
      <h2>Use signature and initials fields</h2>
      <p>Add signature or initials fields where the public user needs to confirm agreement. These fields are captured with the submission and can be included in the completed PDF.</p>
      <h2>Keep internal details private</h2>
      <p>Office Use Only fields let your team complete internal notes, approval details, reference numbers, or final conditions after the public submission has arrived.</p>
      <h2>Finalize once</h2>
      <p>When the submission is ready, finalize it to generate and email the completed PDF. FormOS keeps the flow simple so your team can process submissions without rebuilding documents manually.</p>
    `,
  },
  {
    category: "Integrations",
    title: "How Google Drive and Dropbox uploads work in FormOS",
    slug: "how-google-drive-and-dropbox-uploads-work-in-formos",
    excerpt:
      "A guide to routing public form uploads into the storage provider connected by the form owner.",
    featuredImage: "/blog/storage-integrations.svg",
    metaDescription:
      "Understand how FormOS sends uploaded files to Google Drive or Dropbox.",
    content: `
      <p>FormOS can collect files from public users while keeping file storage under the form owner's control. The public user uploads through the form, and FormOS routes the file to the connected provider.</p>
      <h2>Connect storage before publishing</h2>
      <p>Choose Google Drive or Dropbox in your integrations settings, then select the active upload provider. If a form has file upload fields but no active provider, users will not be able to upload files successfully.</p>
      <h2>Keep paths controlled by the owner</h2>
      <p>Public submitters cannot choose your storage folder or path. The owner controls the destination, which keeps uploads predictable and avoids exposing storage credentials.</p>
      <h2>Use clear file instructions</h2>
      <p>Tell users what to upload, which file types are accepted, and whether a scan or photo is enough. Clear instructions reduce failed submissions and support requests.</p>
    `,
  },
  {
    category: "Sharing",
    title: "Share forms with public links, QR codes, and website embeds",
    slug: "share-forms-with-public-links-qr-codes-and-website-embeds",
    excerpt:
      "Choose the right sharing method for customers, staff, printed material, and external websites.",
    featuredImage: "/blog/share-forms.svg",
    metaDescription:
      "Learn how to share FormOS forms using links, QR codes, and embeds.",
    content: `
      <p>Once a form is published, FormOS gives you multiple ways to share it. Use the method that best fits where your customer or staff member will find the form.</p>
      <h2>Use public links for direct sharing</h2>
      <p>Public links are best for email, SMS, website buttons, and customer portals. Anyone with the link can open the published form.</p>
      <h2>Use QR codes for physical workflows</h2>
      <p>QR codes work well on counters, printed forms, vehicles, posters, and site signage. A customer can scan the code and submit from their phone.</p>
      <h2>Use embeds for your website</h2>
      <p>Embedded forms let visitors complete a FormOS form without leaving your website. Submissions still appear inside your FormOS dashboard and follow the same validation, uploads, and PDF workflow.</p>
    `,
  },
];

export async function seedDefaultBlogContentIfMissing(authorId?: string) {
  for (const item of DEFAULT_BLOG_POSTS) {
    const category = await findOrCreateBlogCategory(item.category);
    const existing = await prisma.blogPost.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    await prisma.blogPost.create({
      data: {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content.trim(),
        status: "PUBLISHED",
        featuredImage: item.featuredImage,
        metaDescription: item.metaDescription,
        publishedAt: new Date(),
        authorId,
        categoryId: category?.id,
      },
    });
  }
}

export async function seedDefaultBlogPostIfMissing(authorId?: string) {
  await seedDefaultBlogContentIfMissing(authorId);
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
