import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Issue details",
  description: "Full AI analysis, status timeline, SLA tracking and resolution verification for a reported civic issue.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
