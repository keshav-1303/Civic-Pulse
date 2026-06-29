import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const SITE_URL = siteUrl();
  const now = new Date();
  const routes = ["", "/report", "/issues", "/map", "/dashboard", "/leaderboard", "/admin", "/about", "/privacy", "/terms"];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/issues" || route === "/map" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/report" ? 0.9 : 0.7,
  }));
}
