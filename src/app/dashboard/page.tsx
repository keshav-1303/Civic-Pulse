"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Loader2, Sparkles, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { CATEGORY_META, STATUS_META, type Issue, type IssueCategory } from "@/lib/types";
import { AiBadge, Stat } from "@/components/ui";
import type { Insight, InsightsResult } from "@/lib/agents/insights";
import { useIsDark } from "@/components/useIsDark";

const SEVERITY_INFO = "info";

const INSIGHT_STYLE: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
  watch: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
  info: "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
};

export default function DashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<{ total: number; resolved: number; inProgress: number; critical: number; slaBreaches: number; resolutionRate: number } | null>(null);
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = useIsDark();
  const gridStroke = isDark ? "#2d3649" : "#eceef2";
  const axisTick = isDark ? "#8a98b0" : "#8190a8";
  const axisTickStrong = isDark ? "#aab4c6" : "#62718c";
  const cursorFill = isDark ? "rgba(148,163,184,0.12)" : "#f6f7f9";

  useEffect(() => {
    fetch("/api/issues").then((r) => r.json()).then((d) => { setIssues(d.issues); setStats(d.stats); }).finally(() => setLoading(false));
    fetch("/api/insights").then((r) => r.json()).then(setInsights).catch(() => {});
  }, []);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach((i) => (map[i.category] = (map[i.category] || 0) + 1));
    return Object.entries(map)
      .map(([k, v]) => ({ name: CATEGORY_META[k as IssueCategory].label, value: v, color: CATEGORY_META[k as IssueCategory].color }))
      .sort((a, b) => b.value - a.value);
  }, [issues]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach((i) => (map[i.status] = (map[i.status] || 0) + 1));
    return Object.entries(map).map(([k, v]) => ({ name: STATUS_META[k as keyof typeof STATUS_META].label, value: v, color: STATUS_META[k as keyof typeof STATUS_META].color }));
  }, [issues]);

  const byWard = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach((i) => { const w = i.location.ward ?? "Other"; if (i.status !== "resolved") map[w] = (map[w] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [issues]);

  const overTime = useMemo(() => {
    const days = 14;
    const buckets: { date: string; reports: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      buckets.push({ date: key, reports: 0 });
    }
    issues.forEach((i) => {
      const key = new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const b = buckets.find((x) => x.date === key);
      if (b) b.reports += 1;
    });
    return buckets;
  }, [issues]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-ink-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impact dashboard</h1>
        <p className="mt-1 text-ink-500">Real-time view of community health, response performance and predictive risk.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Total reports" value={stats?.total ?? 0} sub="all-time" />
        <Stat label="Resolved" value={stats?.resolved ?? 0} sub={`${stats?.resolutionRate ?? 0}% resolution rate`} accent="#16b783" />
        <Stat label="In progress" value={stats?.inProgress ?? 0} sub="being worked on" accent="#0284c7" />
        <Stat label="Open critical" value={stats?.critical ?? 0} sub="need urgent action" accent="#dc2626" />
        <Stat label="SLA breaches" value={stats?.slaBreaches ?? 0} sub="past committed window" accent="#dc2626" />
      </div>

      {/* AI insights */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-brand-600" /> Predictive insights</h2>
          {insights ? <AiBadge mock={insights.isMock} model={insights.isMock ? "heuristic" : "gemini"} /> : <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
        </div>
        {!insights ? (
          <div className="py-8 text-center text-sm text-ink-400">Generating insights…</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.insights.map((ins: Insight, i) => (
              <div key={i} className={`rounded-xl border p-4 ${INSIGHT_STYLE[ins.severity] ?? INSIGHT_STYLE[SEVERITY_INFO]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ins.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900">{ins.title}</h3>
                      <span className="chip bg-white/70 text-[10px] uppercase text-ink-500 dark:bg-white/10">{ins.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-600">{ins.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-1 font-bold">Reports over the last 14 days</h3>
          <p className="mb-4 text-xs text-ink-400">Daily reporting volume</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={overTime} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16b783" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#16b783" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisTick }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: axisTick }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="reports" stroke="#16b783" strokeWidth={2.5} fill="url(#g)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="mb-1 font-bold">Status distribution</h3>
          <p className="mb-4 text-xs text-ink-400">Where issues stand</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} isAnimationActive={false}>
                {byStatus.map((e, i) => (<Cell key={i} fill={e.color} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {byStatus.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-ink-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-1 font-bold">Issues by category</h3>
          <p className="mb-4 text-xs text-ink-400">Most common problems</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 30, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: axisTick }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: axisTickStrong }} width={90} />
              <Tooltip cursor={{ fill: cursorFill }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                {byCategory.map((e, i) => (<Cell key={i} fill={e.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="mb-1 font-bold">Open issues by ward (hotspots)</h3>
          <p className="mb-4 text-xs text-ink-400">Where attention is needed</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byWard} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisTick }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: axisTick }} allowDecimals={false} />
              <Tooltip cursor={{ fill: cursorFill }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0284c7" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance band */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"><CheckCircle2 className="h-6 w-6" /></div>
          <div><div className="text-2xl font-bold">{stats?.resolutionRate ?? 0}%</div><div className="text-xs text-ink-400">Resolution rate</div></div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"><Clock className="h-6 w-6" /></div>
          <div><div className="text-2xl font-bold">~28h</div><div className="text-xs text-ink-400">Avg. first response</div></div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"><TrendingUp className="h-6 w-6" /></div>
          <div><div className="text-2xl font-bold">{issues.reduce((a, i) => a + i.upvotes, 0)}</div><div className="text-xs text-ink-400">Total citizen votes</div></div>
        </div>
      </div>
    </div>
  );
}
