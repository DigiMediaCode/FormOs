import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = safeAppUrl();
  const now = new Date();
  const publicRoutes = [
    "",
    "/pricing",
    "/privacy-policy",
    "/terms-of-service",
    "/data-security",
    "/contact",
    "/signup",
    "/login",
  ];

  return publicRoutes.map((route) => ({
    url: `${appUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
