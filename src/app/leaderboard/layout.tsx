import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community heroes",
  description: "A gamified leaderboard celebrating the citizens who report and help resolve the most civic issues.",
  alternates: { canonical: "/leaderboard" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
