"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  assertKbArticleSlugAvailable,
  assertKbCategorySlugAvailable,
  kbArticleDataFromForm,
  kbCategoryDataFromForm,
  seedDefaultKbCategoriesIfMissing,
} from "@/lib/knowledge-base/articles";
import { prisma } from "@/lib/prisma";

const ADMIN_KB_PATH = "/admin/knowledge-base";

function redirectTo(
  path: string,
  type: "success" | "error",
  message: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function revalidateKbPaths(slug?: string, categorySlug?: string) {
  revalidatePath(ADMIN_KB_PATH);
  revalidatePath(`${ADMIN_KB_PATH}/categories`);
  revalidatePath("/help");

  if (slug && categorySlug) {
    revalidatePath(`/help/${categorySlug}/${slug}`);
  }

  if (categorySlug) {
    revalidatePath(`/help/${categorySlug}`);
  }
}

export async function seedKbCategoriesAction() {
  await requireSuperAdmin();
  await seedDefaultKbCategoriesIfMissing();

  revalidateKbPaths();
  redirectTo(ADMIN_KB_PATH, "success", "Default knowledge base categories checked.");
}

export async function createKbCategoryAction(formData: FormData) {
  await requireSuperAdmin();
  let categoryId = "";

  try {
    const data = kbCategoryDataFromForm(formData);
    await assertKbCategorySlugAvailable(data.slug);

    const category = await prisma.kbCategory.create({
      data,
      select: { id: true },
    });
    categoryId = category.id;
  } catch (error) {
    redirectTo(
      `${ADMIN_KB_PATH}/categories/new`,
      "error",
      error instanceof Error ? error.message : "Unable to create category.",
    );
  }

  revalidateKbPaths();
  redirectTo(
    `${ADMIN_KB_PATH}/categories/${categoryId}`,
    "success",
    "Category created.",
  );
}

export async function updateKbCategoryAction(
  categoryId: string,
  formData: FormData,
) {
  await requireSuperAdmin();
  let savedSlug = "";

  try {
    const data = kbCategoryDataFromForm(formData);
    await assertKbCategorySlugAvailable(data.slug, categoryId);

    await prisma.kbCategory.update({
      where: { id: categoryId },
      data,
    });
    savedSlug = data.slug;
  } catch (error) {
    redirectTo(
      `${ADMIN_KB_PATH}/categories/${categoryId}`,
      "error",
      error instanceof Error ? error.message : "Unable to save category.",
    );
  }

  revalidateKbPaths(undefined, savedSlug);
  redirectTo(
    `${ADMIN_KB_PATH}/categories/${categoryId}`,
    "success",
    "Category saved.",
  );
}

export async function archiveKbCategoryAction(categoryId: string) {
  await requireSuperAdmin();

  const category = await prisma.kbCategory.update({
    where: { id: categoryId },
    data: { status: "ARCHIVED" },
    select: { slug: true },
  });

  revalidateKbPaths(undefined, category.slug);
  redirectTo(`${ADMIN_KB_PATH}/categories`, "success", "Category archived.");
}

export async function createKbArticleAction(formData: FormData) {
  const user = await requireSuperAdmin();
  let articleId = "";

  try {
    const { data, slug } = kbArticleDataFromForm(formData, user.id);
    await assertKbArticleSlugAvailable(slug);

    const article = await prisma.kbArticle.create({
      data,
      select: { id: true },
    });
    articleId = article.id;
  } catch (error) {
    redirectTo(
      `${ADMIN_KB_PATH}/articles/new`,
      "error",
      error instanceof Error ? error.message : "Unable to create article.",
    );
  }

  revalidateKbPaths();
  redirectTo(
    `${ADMIN_KB_PATH}/articles/${articleId}`,
    "success",
    "Article created.",
  );
}

export async function updateKbArticleAction(
  articleId: string,
  formData: FormData,
) {
  const user = await requireSuperAdmin();
  let savedSlug = "";
  let categorySlug: string | undefined;

  try {
    const { data, slug } = kbArticleDataFromForm(formData, user.id, articleId);
    await assertKbArticleSlugAvailable(slug, articleId);

    const article = await prisma.kbArticle.update({
      where: { id: articleId },
      data,
      select: {
        category: {
          select: {
            slug: true,
          },
        },
      },
    });
    savedSlug = slug;
    categorySlug = article.category?.slug;
  } catch (error) {
    redirectTo(
      `${ADMIN_KB_PATH}/articles/${articleId}`,
      "error",
      error instanceof Error ? error.message : "Unable to save article.",
    );
  }

  revalidateKbPaths(savedSlug, categorySlug);
  redirectTo(
    `${ADMIN_KB_PATH}/articles/${articleId}`,
    "success",
    "Article saved.",
  );
}

export async function archiveKbArticleAction(articleId: string) {
  await requireSuperAdmin();

  const article = await prisma.kbArticle.update({
    where: { id: articleId },
    data: {
      status: "ARCHIVED",
      publishedAt: null,
    },
    select: {
      slug: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
  });

  revalidateKbPaths(article.slug, article.category?.slug);
  redirectTo(ADMIN_KB_PATH, "success", "Article archived.");
}
