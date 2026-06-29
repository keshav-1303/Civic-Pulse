import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report an issue",
  description:
    "Snap a photo and describe a civic problem in any language. CivicPulse AI agents categorize, prioritize and route it to the right department in seconds.",
  alternates: { canonical: "/report" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
