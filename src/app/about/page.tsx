import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Bot, Languages, ShieldCheck, MapPin, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "CivicPulse is an agentic civic platform that turns citizen reports into resolved community issues using a team of Google Gemini AI agents.",
  alternates: { canonical: "/about" },
};

const HIGHLIGHTS = [
  { icon: Bot, title: "9 AI agents", text: "A coordinated pipeline analyzes, prioritizes, routes and verifies every report." },
  { icon: Languages, title: "Multilingual + voice", text: "Report in your own language by typing or speaking. The AI understands and translates." },
  { icon: MapPin, title: "Hyperlocal", text: "Issues are mapped, clustered and tracked down to the ward level." },
  { icon: ShieldCheck, title: "Verified resolutions", text: "AI compares before and after photos to confirm a fix actually happened." },
  { icon: Trophy, title: "Community powered", text: "Gamified recognition turns engaged citizens into local heroes." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Activity className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About CivicPulse</h1>
          <p className="text-ink-500">AI Community Hero, Hyperlocal Problem Solver</p>
        </div>
      </div>

      <div className="card space-y-4 p-6 text-ink-600">
        <p>
          CivicPulse is an agentic civic platform that closes the loop between citizens and
          local government. A citizen snaps a photo and describes a problem in any language, and a
          team of Google Gemini AI agents takes it from there: understanding the report, assessing
          severity and safety, detecting duplicates, routing it to the right department, and later
          verifying that the fix really happened.
        </p>
        <p>
          The goal is simple: make it effortless to report a civic issue, and make it transparent to
          watch it get resolved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <h.icon className="h-5 w-5" />
            </div>
            <h2 className="font-semibold">{h.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{h.text}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Ready to make a difference?</h2>
          <p className="text-sm text-ink-500">Report your first issue and watch the agents work.</p>
        </div>
        <Link href="/report" className="btn-primary">Report an issue</Link>
      </div>
    </div>
  );
}
