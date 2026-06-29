/**
 * Canonical site URL. Prefers a runtime-settable SITE_URL (great for Cloud Run,
 * no rebuild needed), then the build-time NEXT_PUBLIC_SITE_URL, then localhost.
 */
export function siteUrl(): string {
  const raw =
    process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
