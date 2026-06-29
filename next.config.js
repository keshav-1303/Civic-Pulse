/** @type {import('next').NextConfig} */
const path = require("path");

const isDev = process.env.NODE_ENV !== "production";

// Next.js dev mode (HMR / React Refresh) needs 'unsafe-eval' and a websocket connection.
const scriptSrc = ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"];
if (isDev) scriptSrc.push("'unsafe-eval'");

const connectSrc = [
  "'self'",
  "https://www.google-analytics.com",
  "https://*.basemaps.cartocdn.com",
  "https://*.tile.openstreetmap.org",
];
if (isDev) connectSrc.push("ws://localhost:*", "ws://127.0.0.1:*", "http://localhost:*", "http://127.0.0.1:*");

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
];
if (!isDev) cspDirectives.push("upgrade-insecure-requests");

const ContentSecurityPolicy = cspDirectives.join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(), usb=()" },
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
