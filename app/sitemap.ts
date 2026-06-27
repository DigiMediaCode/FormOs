import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { getTemplateLandingPages } from "@/lib/forms/templates/template-landing-pages";
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
  const [cmsPages, blogPosts, kbCategories, kbArticles] = await Promise.all([
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
    prisma.kbCategory.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.kbArticle.findMany({
      where: {
        status: "PUBLISHED",
        category: {
          status: "PUBLISHED",
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    }),
  ]);
  const publicRoutes = [
    "",
    "/pricing",
    "/templates",
    "/use-cases/healthcare-forms",
    "/privacy-policy",
    "/terms-of-service",
    "/data-security",
    "/contact",
    "/blog",
    "/help",
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
    ...getTemplateLandingPages().map((page) => ({
      url: `${appUrl}/templates/${page.routeSlug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...kbCategories.map((category) => ({
      url: `${appUrl}/help/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...kbArticles.map((article) => ({
      url: `${appUrl}/help/${article.category?.slug}/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
