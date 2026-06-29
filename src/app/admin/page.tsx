"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Sparkles, Target, ArrowRight, Building2, Siren, AlertTriangle, Truck, CheckCircle2, Clock } from "lucide-react";
import { AiBadge } from "@/components/ui";
import { SLA_STATE_META } from "@/lib/sla";
import { timeAgo } from "@/lib/format";
import type { ActionPlan } from "@/lib/agents/copilot";

// Module-level caches survive in-app navigation so returning to this tab is
// instant (no refetch, no loader, no re-running the agent).
let cachedPlan: ActionPlan | null = null;
let cachedDispatched: Record<string, string> = {};

export default function AdminPage() {
  const [plan, setPlan] = useState<ActionPlan | null>(cachedPlan);
  const [loading, setLoading] = useState(!cachedPlan);
  const [refreshing, setRefreshing] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState<Record<string, string>>(cachedDispatched);

  async function load(force = false) {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/copilot${force ? "?refresh=1" : ""}`);
      const data: ActionPlan = await res.json();
      cachedPlan = data;
      setPlan(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function dispatch(issueId: string, crew: string) {
    setDispatching(issueId);
    try {
      const res = await fetch("/api/copilot/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, crew }),
      });
      if (res.ok) {
        setDispatched((d) => {
          const next = { ...d, [issueId]: crew };
          cachedDispatched = next;
          return next;
        });
      }
    } finally {
      setDispatching(null);
    }
  }

  useEffect(() => {
    // Only fetch on first ever visit; later visits reuse the cached plan.
    if (!cachedPlan) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxLoad = plan?.departmentLoad.reduce((m, d) => Math.max(m, d.open), 0) ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Municipal Co-pilot</h1>
            <span className="chip bg-slate-800 text-white">Admin</span>
          </div>
          <p className="mt-1 text-ink-500">An AI chief-of-staff that triages the whole queue and builds today's action plan.</p>
        </div>
        <div className="flex items-center gap-3">
          {plan && (
            <span className="hidden items-center gap-1.5 text-xs text-ink-400 sm:flex">
              <Clock className="h-3.5 w-3.5" /> Generated {timeAgo(plan.generatedAt)}
            </span>
          )}
          <button onClick={() => load(true)} disabled={loading || refreshing} className="btn-ghost">
            {loading || refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {refreshing ? "Regenerating…" : "Regenerate plan"}
          </button>
        </div>
      </div>

      {loading || !plan ? (
        <div className="flex items-center justify-center py-24 text-ink-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* Hero plan card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-brand-300">
                  <Sparkles className="h-4 w-4" /> AI Action Plan
                </span>
                <AiBadge mock={plan.isMock} model={plan.isMock ? "heuristic" : "gemini"} />
              </div>
              <p className="text-lg leading-relaxed text-ink-100">{plan.summary}</p>
              {plan.slaBreaches > 0 && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm text-red-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span><span className="font-semibold">{plan.slaBreaches} issue(s) past SLA</span> - auto-escalated to the top of the dispatch queue.</span>
                </div>
              )}
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-white/10 p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-300">Today's #1 focus</div>
                  <p className="mt-0.5 text-white">{plan.focusToday}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Priority queue */}
            <div className="lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 font-bold"><Siren className="h-4 w-4 text-red-500" /> AI-prioritized dispatch queue</h2>
              <div className="space-y-3">
                {plan.priorities.map((p) => (
                  <div key={p.issueId} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-white">
                        {p.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/issues/${p.issueId}`} className="font-semibold leading-snug text-ink-900 hover:text-brand-700">
                            {p.title}
                          </Link>
                          <span className="shrink-0 rounded-lg bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">{p.priorityScore}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{p.reason}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                          <span className="chip bg-ink-50 text-ink-600">{p.department}</span>
                          <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">👷 {p.recommendedCrew}</span>
                          <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">⏱ ETA {p.etaHours}h</span>
                          {p.slaState && (
                            <span className={`chip ${SLA_STATE_META[p.slaState].chip}`}>⏳ {p.slaLabel}</span>
                          )}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400" style={{ width: `${p.priorityScore}%` }} />
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          {dispatched[p.issueId] ? (
                            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" /> Crew dispatched - work order issued
                            </span>
                          ) : (
                            <button
                              onClick={() => dispatch(p.issueId, p.recommendedCrew)}
                              disabled={dispatching === p.issueId}
                              className="btn-primary px-3 py-1.5 text-xs"
                            >
                              {dispatching === p.issueId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Truck className="h-4 w-4" />
                              )}
                              Dispatch crew
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department workload */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-bold"><Building2 className="h-4 w-4 text-sky-600" /> Department workload</h2>
              <div className="card space-y-4 p-5">
                {plan.departmentLoad.map((d) => (
                  <div key={d.department}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-700">{d.department}</span>
                      <span className="text-ink-500">{d.open} open{d.critical > 0 && <span className="ml-1 text-red-600">· {d.critical} crit</span>}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${(d.open / maxLoad) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {plan.departmentLoad.length === 0 && <p className="text-sm text-ink-400">No open issues - great work! 🎉</p>}
              </div>
              <Link href="/dashboard" className="btn-ghost mt-3 w-full">
                View impact dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
