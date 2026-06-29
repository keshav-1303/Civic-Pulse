"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUp,
  CheckCircle2,
  MapPin,
  Clock,
  Loader2,
  FileText,
  Copy,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  IndianRupee,
  ArrowLeft,
  Camera,
  BadgeCheck,
} from "lucide-react";
import { CATEGORY_META, STATUS_META, type Issue, type IssueStatus } from "@/lib/types";
import { AiBadge, CategoryChip, SeverityDots, SlaBadge, StatusPill, UrgencyChip } from "@/components/ui";
import { timeAgo, fileToDataUrl } from "@/lib/format";
import { slaInfo, SLA_STATE_META } from "@/lib/sla";

const IssuesMap = dynamic(() => import("@/components/IssuesMap"), { ssr: false });

const STATUS_FLOW: IssueStatus[] = ["reported", "verified", "in_progress", "resolved"];

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [canManage, setCanManage] = useState(false);

  async function load() {
    const res = await fetch(`/api/issues/${id}`);
    if (res.ok) {
      const d = await res.json();
      setIssue(d.issue);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setCanManage(d.session?.role === "staff"))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: "confirm" | "advance") {
    setBusy(true);
    const res = await fetch(`/api/issues/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const d = await res.json();
      setIssue(d.issue);
      if (action === "confirm") {
        setToast(`Confirmed! +${d.pointsAwarded ?? 10} points`);
        setTimeout(() => setToast(""), 2000);
      }
    }
    setBusy(false);
  }

  async function submitProof() {
    setVerifying(true);
    setVerifyMsg("");
    const res = await fetch(`/api/issues/${id}/verify-resolution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ afterImageDataUrl: afterImage || undefined }),
    });
    if (res.ok) {
      const d = await res.json();
      setIssue(d.issue);
      setVerifyMsg(d.result.verified ? "✅ Verified & resolved!" : "⚠️ Could not verify - issue still appears unresolved.");
      setAfterImage("");
    }
    setVerifying(false);
  }

  async function onAfterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterImage(await fileToDataUrl(file));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!issue) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <p className="text-ink-500">Issue not found.</p>
        <Link href="/issues" className="btn-ghost mt-4">Back to issues</Link>
      </div>
    );
  }

  const isDataImage = issue.imageUrl?.startsWith("data:");
  const currentStep = STATUS_META[issue.status].step;
  const analysis = issue.analysis;
  const sla = slaInfo(issue);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/issues" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> All issues
      </Link>

      {sla.state === "breached" && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">SLA breached.</span> This issue has been open {sla.label.replace("SLA breached ", "").replace(" ago", "")} past its {issue.slaHours}h target and has been auto-escalated to the Municipal Co-pilot.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="card overflow-hidden">
            <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-ink-100 to-ink-50">
              {isDataImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover" />
              ) : (
                <span className="text-7xl opacity-80">{issue.imageUrl}</span>
              )}
              <div className="absolute left-4 top-4 flex gap-2">
                <StatusPill status={issue.status} />
                <UrgencyChip urgency={issue.urgency} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={issue.category} />
                <span className="chip bg-ink-50 text-ink-500">{issue.subcategory}</span>
                <span className="flex items-center gap-1.5 text-xs text-ink-500">
                  Severity <SeverityDots value={issue.severity} /> {issue.severity}/5
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-ink-900">{issue.title}</h1>
              <p className="mt-2 text-ink-600">{issue.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-400">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {issue.location.address}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {timeAgo(issue.createdAt)}</span>
                <span>by {issue.reporterName}</span>
                {issue.language && !issue.language.toLowerCase().startsWith("english") && (
                  <span className="chip bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">🌐 Reported in {issue.language}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {issue.tags.map((t) => (
                  <span key={t} className="chip bg-ink-50 text-ink-500">#{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AI analysis */}
          {analysis && (
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">AI agent analysis</h2>
                <AiBadge mock={analysis.isMock} model={analysis.model} />
              </div>
              <p className="rounded-xl bg-brand-50/60 p-3 text-sm text-ink-700 dark:bg-brand-500/10">{analysis.summary}</p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                  <div className="label flex items-center gap-1 text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> Risk to public</div>
                  <p className="mt-1 text-sm text-ink-700">{analysis.riskToPublic}</p>
                </div>
                <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                  <div className="label flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Est. repair cost</div>
                  <p className="mt-1 text-sm font-semibold text-ink-800">{analysis.estimatedCost ?? "-"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="label">Agent reasoning trace</div>
                {analysis.steps.map((s, i) => (
                  <div key={i} className="glass-control rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-50 text-sm">{s.icon}</span>
                      <span className="text-sm font-semibold text-ink-900">{s.agent}</span>
                      <span className="ml-auto text-[11px] text-ink-300">{s.durationMs}ms</span>
                    </div>
                    <p className="mt-1.5 border-l-2 border-brand-200 pl-3 text-xs leading-relaxed text-ink-600">{s.reasoning}</p>
                  </div>
                ))}
              </div>

              {analysis.recommendedActions?.length > 0 && (
                <div className="mt-4">
                  <div className="label">Recommended actions</div>
                  <ul className="mt-1.5 space-y-1">
                    {analysis.recommendedActions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-600"><span className="mt-0.5 text-brand-600">▸</span> {a}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={() => setShowComplaint((v) => !v)} className="btn-ghost mt-4 w-full">
                <FileText className="h-4 w-4" /> {showComplaint ? "Hide" : "View"} auto-drafted complaint letter
              </button>
              {showComplaint && (
                <div className="relative mt-2">
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-100 bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-700 scrollbar-thin">
                    {analysis.draftedComplaint}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysis.draftedComplaint);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="glass-control absolute right-2 top-2 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-600 shadow-sm hover:text-brand-700"
                  >
                    <Copy className="mr-1 inline h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resolution proof / before-after */}
          {issue.resolutionVerification && (
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold"><BadgeCheck className="h-5 w-5 text-brand-600" /> Resolution verification</h2>
                <AiBadge mock={issue.resolutionVerification.isMock} model="vision" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="label mb-1">Before</div>
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-ink-50">
                    {issue.imageUrl?.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={issue.imageUrl} alt="before" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl opacity-70">{issue.imageUrl}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="label mb-1">After</div>
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-ink-50">
                    {issue.afterImageUrl?.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={issue.afterImageUrl} alt="after" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl opacity-70">✅</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-sm text-ink-700 dark:border-brand-500/30 dark:bg-brand-500/10">
                <span className="font-semibold text-brand-700">{Math.round(issue.resolutionVerification.confidence * 100)}% confidence · {issue.resolutionVerification.verified ? "Verified" : "Not verified"}</span>
                <p className="mt-1">{issue.resolutionVerification.observation}</p>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="card p-2">
            <div className="h-64">
              <IssuesMap issues={[issue]} center={[issue.location.lat, issue.location.lng]} zoom={15} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium text-ink-700"><ArrowUp className="h-4 w-4 text-brand-600" /> {issue.upvotes} upvotes</span>
              <span className="flex items-center gap-1.5 font-medium text-ink-700"><CheckCircle2 className="h-4 w-4 text-sky-600" /> {issue.confirmations} confirmed</span>
            </div>
            <button onClick={() => act("confirm")} disabled={busy} className="btn-primary mt-4 w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              I'm affected too - Confirm
            </button>
            {toast && <p className="mt-2 text-center text-xs font-medium text-brand-600">{toast}</p>}
          </div>

          {/* Status progress */}
          <div className="card p-5">
            <div className="label mb-3">Resolution progress</div>
            <ol className="relative space-y-4 border-l-2 border-ink-100 pl-5">
              {STATUS_FLOW.map((s) => {
                const meta = STATUS_META[s];
                const reached = currentStep >= meta.step && currentStep >= 0;
                return (
                  <li key={s} className="relative">
                    <span
                      className="absolute -left-[1.6rem] flex h-4 w-4 items-center justify-center rounded-full border-2"
                      style={{ borderColor: reached ? meta.color : "#d4d9e2", backgroundColor: reached ? meta.color : "#fff" }}
                    />
                    <div className={`text-sm font-semibold ${reached ? "text-ink-900" : "text-ink-300"}`}>{meta.label}</div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Routing info */}
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="label">Routed to</div>
              <SlaBadge issue={issue} />
            </div>
            <div className="font-semibold text-ink-900">{issue.department}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-ink-50 p-2"><div className="label">SLA target</div><div className="mt-0.5 font-semibold text-ink-800">{issue.slaHours}h</div></div>
              <div className="rounded-lg bg-ink-50 p-2"><div className="label">Ward</div><div className="mt-0.5 font-semibold text-ink-800">{issue.location.ward}</div></div>
            </div>
            {sla.isOpen && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-ink-400">
                  <span>SLA window</span>
                  <span style={{ color: SLA_STATE_META[sla.state].color }}>{Math.min(100, sla.pctElapsed)}% elapsed</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, sla.pctElapsed)}%`, backgroundColor: SLA_STATE_META[sla.state].color }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <div className="label mb-3">Activity timeline</div>
            <ol className="space-y-3">
              {issue.timeline.map((t) => (
                <li key={t.id} className="flex gap-2.5 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-ink-700">{t.note}</p>
                    <p className="text-xs text-ink-400">{t.by} · {timeAgo(t.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Resolution proof upload */}
          {issue.status !== "resolved" && (
            <div className="card p-5">
              <div className="label mb-2 flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-brand-600" /> Submit proof of fix</div>
              <p className="mb-3 text-xs text-ink-400">Upload an &ldquo;after&rdquo; photo - an AI vision agent verifies the fix and auto-resolves the issue.</p>
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 text-ink-400 hover:border-brand-300">
                {afterImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={afterImage} alt="after preview" className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <>
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Add &ldquo;after&rdquo; photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={onAfterFile} />
              </label>
              <button onClick={submitProof} disabled={verifying} className="btn-primary mt-3 w-full text-sm">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Verify fix with AI
              </button>
              {verifyMsg && <p className="mt-2 text-center text-xs font-medium text-ink-600">{verifyMsg}</p>}

              {canManage && (
                <button onClick={() => act("advance")} disabled={busy} className="btn-ghost mt-3 w-full text-xs">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Advance municipal status (staff)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
