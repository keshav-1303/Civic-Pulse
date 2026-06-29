import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Eye,
  Tag,
  Siren,
  Search,
  Send,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Trophy,
  Globe,
  Mic,
  BadgeCheck,
  Shield,
  Sparkles,
} from "lucide-react";
import { communityStats, listIssues } from "@/lib/store";
import { hasGeminiKey, GEMINI_MODEL } from "@/lib/gemini";
import IssueCard from "@/components/IssueCard";

const AGENTS = [
  { icon: Globe, title: "Language Agent", desc: "Understands reports in Hindi, Kannada, Tamil & more - typed or spoken.", color: "#7c3aed" },
  { icon: Eye, title: "Vision Intake Agent", desc: "Reads the photo + text to understand what's wrong on the ground.", color: "#0284c7" },
  { icon: Tag, title: "Categorization Agent", desc: "Classifies the issue, assigns a subcategory and smart tags.", color: "#16b783" },
  { icon: Siren, title: "Severity & Safety Agent", desc: "Scores risk 1-5, flags who's in danger, estimates cost.", color: "#dc2626" },
  { icon: Search, title: "Deduplication Agent", desc: "Uses Gemini embeddings to merge duplicate reports into one signal.", color: "#0a936b" },
  { icon: Send, title: "Routing & Action Agent", desc: "Picks the department and auto-drafts a formal complaint.", color: "#b45309" },
];

const FEATURES = [
  { icon: Mic, title: "Multilingual & voice reporting", desc: "Report by speaking or typing in your own language - Gemini understands it all." },
  { icon: Shield, title: "Municipal Co-pilot", desc: "An AI chief-of-staff triages the whole queue into a prioritized daily action plan." },
  { icon: BadgeCheck, title: "AI resolution verification", desc: "Upload an 'after' photo - a vision agent confirms the fix and closes the loop." },
  { icon: MapPin, title: "Geo-mapping & hotspots", desc: "Every issue pinned on a live map with ward-level clustering." },
  { icon: TrendingUp, title: "Predictive insights", desc: "An analytics agent forecasts monsoon risk and recurring hotspots." },
  { icon: Trophy, title: "Gamified engagement", desc: "Earn points, badges and climb the Community Hero leaderboard." },
];

export default async function HomePage() {
  const stats = await communityStats();
  const recent = (await listIssues()).slice(0, 3);
  const ai = hasGeminiKey();

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="glass relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="chip mx-auto mb-5 border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> {ai ? `Live agents on ${GEMINI_MODEL}` : "Agentic AI · Google Gemini"}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-6xl">
            Turn citizens into <span className="gradient-text">Community Heroes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
            Report a pothole, leak or hazard with one photo. A team of AI agents categorizes it, scores the danger,
            removes duplicates and routes it to the right department - so your neighbourhood actually gets fixed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/report" className="btn-primary px-6 py-3 text-base">
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/map" className="btn-ghost px-6 py-3 text-base">
              Explore the Live Map
            </Link>
          </div>
        </div>

        {/* Live stats */}
        <div className="relative mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Issues reported", value: stats.total, color: undefined as string | undefined },
            { label: "Resolved", value: stats.resolved, color: "#16b783" },
            { label: "Resolution rate", value: `${stats.resolutionRate}%`, color: "#0284c7" },
            { label: "Open critical", value: stats.critical, color: "#dc2626" },
          ].map((s) => (
            <div key={s.label} className="glass-control rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-ink-900" style={s.color ? { color: s.color } : undefined}>
                {s.value}
              </div>
              <div className="mt-1 text-xs font-medium text-ink-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent pipeline */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Not a form - a team of AI agents</h2>
          <p className="mt-3 text-ink-500">
            Every report is processed by a transparent, multi-step agent pipeline. You can watch each agent reason in
            real time.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {AGENTS.map((a, i) => (
            <div key={a.title} className="relative card p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: a.color }}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-300">Step {i + 1}</div>
              <h3 className="mt-0.5 font-semibold leading-snug text-ink-900">{a.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything a modern civic platform needs</h2>
          <p className="mt-3 text-ink-500">Reporting, verification, mapping, tracking, insights and engagement - in one place.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Latest from your community</h2>
            <p className="mt-1 text-ink-500">Real reports, tracked transparently.</p>
          </div>
          <Link href="/issues" className="btn-ghost">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-14 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See something? Fix something.</h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-50">
          It takes 30 seconds to make your neighbourhood safer. Become a Community Hero today.
        </p>
        <Link href="/report" className="btn mt-7 bg-white px-7 py-3 text-base text-brand-700 hover:bg-brand-50">
          Report an Issue <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
