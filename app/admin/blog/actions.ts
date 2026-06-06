"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  assertBlogSlugAvailable,
  blogPostDataFromForm,
  seedDefaultBlogPostIfMissing,
} from "@/lib/blog/posts";
import { prisma } from "@/lib/prisma";

const ADMIN_BLOG_PATH = "/admin/blog";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_BLOG_PATH}?${type}=${encodeURIComponent(message)}`);
}

function redirectToPost(
  postId: string,
  type: "success" | "error",
  message: string,
): never {
  redirect(`${ADMIN_BLOG_PATH}/${postId}?${type}=${encodeURIComponent(message)}`);
}

export async function createBlogPostAction(formData: FormData) {
  const user = await requireSuperAdmin();
  let createdPostId = "";

  try {
    const { data, slug } = await blogPostDataFromForm(formData, user.id);
    await assertBlogSlugAvailable(slug);

    const post = await prisma.blogPost.create({
      data,
      select: { id: true },
    });
    createdPostId = post.id;
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to create blog post.",
    );
  }

  revalidatePath(ADMIN_BLOG_PATH);
  revalidatePath("/blog");
  redirectToPost(createdPostId, "success", "Blog post created.");
}

export async function updateBlogPostAction(postId: string, formData: FormData) {
  const user = await requireSuperAdmin();
  let savedSlug = "";

  try {
    const { data, slug } = await blogPostDataFromForm(formData, user.id, postId);
    await assertBlogSlugAvailable(slug, postId);

    await prisma.blogPost.update({
      where: { id: postId },
      data,
    });
    savedSlug = slug;
  } catch (error) {
    redirectToPost(
      postId,
      "error",
      error instanceof Error ? error.message : "Unable to save blog post.",
    );
  }

  revalidatePath(ADMIN_BLOG_PATH);
  revalidatePath(`${ADMIN_BLOG_PATH}/${postId}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${savedSlug}`);
  redirectToPost(postId, "success", "Blog post saved.");
}

export async function archiveBlogPostAction(postId: string) {
  await requireSuperAdmin();

  const post = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      status: "ARCHIVED",
      publishedAt: null,
    },
    select: {
      slug: true,
    },
  });

  revalidatePath(ADMIN_BLOG_PATH);
  revalidatePath(`${ADMIN_BLOG_PATH}/${postId}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  redirectWith("success", "Blog post archived.");
}

export async function seedDefaultBlogPostAction() {
  const user = await requireSuperAdmin();

  await seedDefaultBlogPostIfMissing(user.id);

  revalidatePath(ADMIN_BLOG_PATH);
  redirectWith("success", "Default draft blog post checked.");
}
