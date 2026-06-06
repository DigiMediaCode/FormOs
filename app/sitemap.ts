import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = safeAppUrl();
  const now = new Date();
  const [cmsPages, blogPosts] = await Promise.all([
    prisma.cmsPage.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  ]);
  const publicRoutes = [
    "",
    "/pricing",
    "/privacy-policy",
    "/terms-of-service",
    "/data-security",
    "/contact",
    "/blog",
    "/signup",
    "/login",
  ];

  return [
    ...publicRoutes.map((route) => ({
      url: `${appUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...cmsPages.map((page) => ({
      url: `${appUrl}/p/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...blogPosts.map((post) => ({
      url: `${appUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
