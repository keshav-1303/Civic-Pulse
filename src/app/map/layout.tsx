import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live issue map",
  description: "An interactive map of civic issues across the city, color-coded by category, severity and resolution status.",
  alternates: { canonical: "/map" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
