import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impact dashboard",
  description: "Real-time analytics on community health, response performance, SLA breaches and AI-predicted civic risk hotspots.",
  alternates: { canonical: "/dashboard" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
