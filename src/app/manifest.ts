import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivicPulse - AI Community Hero",
    short_name: "CivicPulse",
    description:
      "Report, verify, track and resolve hyperlocal civic issues with a team of Google Gemini AI agents.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c1220",
    theme_color: "#16b783",
    lang: "en",
    categories: ["government", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Report an issue", short_name: "Report", url: "/report" },
      { name: "Live map", short_name: "Map", url: "/map" },
      { name: "Impact dashboard", short_name: "Dashboard", url: "/dashboard" },
    ],
  };
}
