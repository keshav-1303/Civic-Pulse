"use client";

import Link from "next/link";
import { ArrowUp, CheckCircle2, MapPin } from "lucide-react";
import { CategoryChip, SeverityDots, SlaBadge, StatusPill, UrgencyChip } from "./ui";
import { timeAgo } from "@/lib/format";
import { slaInfo } from "@/lib/sla";
import type { Issue } from "@/lib/types";

export default function IssueCard({ issue }: { issue: Issue }) {
  const isDataImage = issue.imageUrl?.startsWith("data:");
  const sla = slaInfo(issue);
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-ink-100 to-ink-50">
        {isDataImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl opacity-80 transition-transform group-hover:scale-110">{issue.imageUrl}</span>
        )}
        <div className="absolute left-3 top-3">
          <StatusPill status={issue.status} />
        </div>
        {issue.urgency === "critical" && (
          <div className="absolute right-3 top-3">
            <UrgencyChip urgency={issue.urgency} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <CategoryChip category={issue.category} />
          <SeverityDots value={issue.severity} />
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink-900">{issue.title}</h3>
        <p className="line-clamp-2 text-sm text-ink-500">{issue.description}</p>

        {(sla.state === "breached" || sla.state === "due_soon") && (
          <SlaBadge issue={issue} />
        )}

        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {issue.location.ward ?? issue.location.address}
          </span>
          <span>{timeAgo(issue.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 border-t border-ink-100 pt-2 text-xs font-medium text-ink-500">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5 text-brand-600" /> {issue.upvotes}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" /> {issue.confirmations} confirmed
          </span>
        </div>
      </div>
    </Link>
  );
}
