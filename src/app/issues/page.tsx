"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import IssueCard from "@/components/IssueCard";
import { CATEGORY_META, STATUS_META, type Issue, type IssueCategory, type IssueStatus } from "@/lib/types";

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [sort, setSort] = useState<"recent" | "severity" | "votes">("recent");

  useEffect(() => {
    fetch("/api/issues")
      .then((r) => r.json())
      .then((d) => setIssues(d.issues))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = issues.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (status !== "all" && i.status !== status) return false;
      if (q && !`${i.title} ${i.description} ${i.location.address} ${i.location.ward}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "severity") return b.severity - a.severity;
      if (sort === "votes") return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [issues, q, cat, status, sort]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community issues</h1>
          <p className="mt-1 text-ink-500">{filtered.length} of {issues.length} reports</p>
        </div>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues, areas…"
            className="input pl-9"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value as IssueCategory | "all")} className="select">
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_META) as IssueCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].icon} {CATEGORY_META[c].label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus | "all")} className="select">
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="select">
          <option value="recent">Most recent</option>
          <option value="severity">Highest severity</option>
          <option value="votes">Most upvoted</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center text-ink-400">
          <SlidersHorizontal className="mb-3 h-8 w-8" />
          <p>No issues match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
