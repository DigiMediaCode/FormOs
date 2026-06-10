"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  assertCmsSlugAvailable,
  cmsPageDataFromForm,
  getCmsPublicPath,
  seedDefaultCmsPagesIfMissing,
} from "@/lib/cms/pages";
import { prisma } from "@/lib/prisma";

const ADMIN_PAGES_PATH = "/admin/pages";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_PAGES_PATH}?${type}=${encodeURIComponent(message)}`);
}

function redirectToPage(
  pageId: string,
  type: "success" | "error",
  message: string,
): never {
  redirect(`${ADMIN_PAGES_PATH}/${pageId}?${type}=${encodeURIComponent(message)}`);
}

export async function createCmsPageAction(formData: FormData) {
  const user = await requireSuperAdmin();
  let createdPageId = "";

  try {
    const { data, slug } = cmsPageDataFromForm(formData, user.id);
    await assertCmsSlugAvailable(slug);

    const page = await prisma.cmsPage.create({
      data: {
        ...data,
        createdById: user.id,
      },
      select: { id: true },
    });
    createdPageId = page.id;
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to create page.",
    );
  }

  revalidatePath(ADMIN_PAGES_PATH);
  revalidatePath("/");
  redirectToPage(createdPageId, "success", "Page created.");
}

export async function updateCmsPageAction(pageId: string, formData: FormData) {
  const user = await requireSuperAdmin();
  let savedSlug = "";

  try {
    const { data, slug } = cmsPageDataFromForm(formData, user.id, pageId);
    await assertCmsSlugAvailable(slug, pageId);

    await prisma.cmsPage.update({
      where: { id: pageId },
      data,
    });
    savedSlug = slug;
  } catch (error) {
    redirectToPage(
      pageId,
      "error",
      error instanceof Error ? error.message : "Unable to save page.",
    );
  }

  revalidatePath(ADMIN_PAGES_PATH);
  revalidatePath(`${ADMIN_PAGES_PATH}/${pageId}`);
  revalidatePath("/");
  revalidatePath(getCmsPublicPath(savedSlug));
  redirectToPage(pageId, "success", "Page saved.");
}

export async function archiveCmsPageAction(pageId: string) {
  const user = await requireSuperAdmin();

  const page = await prisma.cmsPage.update({
    where: { id: pageId },
    data: {
      status: "ARCHIVED",
      updatedById: user.id,
      publishedAt: null,
    },
    select: { slug: true },
  });

  revalidatePath(ADMIN_PAGES_PATH);
  revalidatePath(`${ADMIN_PAGES_PATH}/${pageId}`);
  revalidatePath("/");
  revalidatePath(getCmsPublicPath(page.slug));
  redirectWith("success", "Page archived.");
}

export async function deleteCmsPageAction(pageId: string) {
  await requireSuperAdmin();

  await prisma.cmsPage.delete({
    where: { id: pageId },
  });

  revalidatePath(ADMIN_PAGES_PATH);
  revalidatePath("/");
  redirectWith("success", "Page deleted.");
}

export async function seedDefaultCmsPagesAction() {
  const user = await requireSuperAdmin();

  await seedDefaultCmsPagesIfMissing(user.id);

  revalidatePath(ADMIN_PAGES_PATH);
  redirectWith("success", "Default CMS pages checked.");
}
