"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { CATEGORY_META, type Issue, type IssueCategory } from "@/lib/types";
import { CategoryChip, SeverityDots, StatusPill } from "@/components/ui";
import { timeAgo } from "@/lib/format";

const IssuesMap = dynamic(() => import("@/components/IssuesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-2xl border border-ink-100 bg-ink-50">
      <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
    </div>
  ),
});

export default function MapPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [city, setCity] = useState<[number, number]>([12.9716, 77.5946]);
  const [cat, setCat] = useState<IssueCategory | "all">("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/issues").then((r) => r.json()).then((d) => setIssues(d.issues)).finally(() => setLoading(false));
    fetch("/api/meta").then((r) => r.json()).then((d) => d.city && setCity([d.city.lat, d.city.lng])).catch(() => {});
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCity([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }
  }, []);

  const filtered = useMemo(
    () =>
      issues.filter((i) => {
        if (cat !== "all" && i.category !== cat) return false;
        if (openOnly && i.status === "resolved") return false;
        return true;
      }),
    [issues, cat, openOnly],
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Live issue map</h1>
        <p className="mt-1 text-ink-500">Every report, pinned and colour-coded. Pulsing pins are critical & unresolved.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCat("all")}
          className={`chip border ${cat === "all" ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "glass-control text-ink-500"}`}
        >
          All ({issues.length})
        </button>
        {(Object.keys(CATEGORY_META) as IssueCategory[])
          .filter((c) => issues.some((i) => i.category === c))
          .map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`chip border ${cat === c ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "glass-control text-ink-500"}`}
            >
              {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
            </button>
          ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="accent-brand-600" />
          Open only
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-[32rem]">
            {loading ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-ink-100 bg-ink-50">
                <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
              </div>
            ) : (
              <IssuesMap issues={filtered} center={city} />
            )}
          </div>
        </div>

        <div className="h-[32rem] space-y-3 overflow-y-auto scrollbar-thin pr-1">
          {filtered.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="card block p-3.5 transition hover:border-brand-200 hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <StatusPill status={issue.status} />
                <SeverityDots value={issue.severity} />
              </div>
              <h3 className="mt-2 line-clamp-1 font-semibold text-ink-900">{issue.title}</h3>
              <div className="mt-1 flex items-center justify-between">
                <CategoryChip category={issue.category} />
                <span className="text-xs text-ink-400">{timeAgo(issue.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
