import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Municipal Co-pilot",
  description: "An AI co-pilot for municipal staff: a prioritized daily action plan, crew recommendations and one-click dispatch.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
