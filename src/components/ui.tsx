import { CATEGORY_META, STATUS_META, type Issue, type IssueCategory, type IssueStatus } from "@/lib/types";
import { URGENCY_STYLES } from "@/lib/format";
import { slaInfo, SLA_STATE_META } from "@/lib/sla";
import { Clock, Sparkles } from "lucide-react";

export function SeverityDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Severity ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${
            n <= value ? (value >= 4 ? "bg-red-500" : value >= 3 ? "bg-amber-500" : "bg-brand-500") : "bg-ink-200"
          }`}
        />
      ))}
    </span>
  );
}

export function StatusPill({ status }: { status: IssueStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="chip"
      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

export function UrgencyChip({ urgency }: { urgency: string }) {
  return <span className={`chip capitalize ${URGENCY_STYLES[urgency] ?? URGENCY_STYLES.low}`}>{urgency}</span>;
}

export function CategoryChip({ category }: { category: IssueCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="chip" style={{ backgroundColor: `${meta.color}14`, color: meta.color }}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function SlaBadge({ issue, showIcon = true }: { issue: Issue; showIcon?: boolean }) {
  const info = slaInfo(issue);
  const meta = SLA_STATE_META[info.state];
  return (
    <span className={`chip ${meta.chip}`} title={`SLA target ${issue.slaHours}h · ${meta.label}`}>
      {showIcon && <Clock className="h-3 w-3" />}
      {info.label}
    </span>
  );
}

export function AiBadge({ mock, model }: { mock?: boolean; model?: string }) {
  return (
    <span
      className={`chip ${mock ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" : "bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30"}`}
      title={mock ? "Running with heuristic fallback. Add GEMINI_API_KEY for live Gemini reasoning." : `Powered by ${model}`}
    >
      <Sparkles className="h-3 w-3" />
      {mock ? "Demo AI" : `Gemini · ${model?.replace("gemini-", "") ?? "live"}`}
    </span>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="label">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}
