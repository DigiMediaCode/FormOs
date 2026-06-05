import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export default function robots(): MetadataRoute.Robots {
  const appUrl = safeAppUrl();
  const publicCrawlers = [
    "*",
    "Googlebot",
    "Mediapartners-Google",
    "AdsBot-Google",
    "Bingbot",
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "PerplexityBot",
    "ClaudeBot",
    "Claude-SearchBot",
  ];

  return {
    rules: publicCrawlers.map((userAgent) => ({
      userAgent,
      allow: ["/", "/Ads.txt", "/ads.txt"],
      disallow: ["/admin", "/dashboard", "/api"],
    })),
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
