import { CURRENT_USER_ID, listIssues } from "./store";
import { slaInfo } from "./sla";
import type { Issue, TimelineEvent } from "./types";

export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface Notification {
  id: string;
  issueId: string;
  issueTitle: string;
  kind: "status" | "verified" | "resolved" | "breach";
  title: string;
  body: string;
  icon: string;
  tone: NotificationTone;
  at: string; // ISO
}

function statusTitle(status: TimelineEvent["status"]): string {
  switch (status) {
    case "verified":
      return "Your report was community-verified";
    case "in_progress":
      return "Work has started on your report";
    case "resolved":
      return "Your report was resolved 🎉";
    default:
      return "Update on your report";
  }
}

/**
 * Derive citizen-facing notifications for a user from their reported issues:
 * status progress, resolutions, and SLA-breach accountability alerts.
 */
export async function buildNotifications(userId: string = CURRENT_USER_ID): Promise<Notification[]> {
  const mine = (await listIssues()).filter((i) => i.reporterId === userId);
  const notifs: Notification[] = [];

  for (const issue of mine) {
    for (const ev of issue.timeline) {
      if (ev.status === "reported" || ev.status === "comment" || ev.status === "agent") continue;
      notifs.push({
        id: `n_${issue.id}_${ev.id}`,
        issueId: issue.id,
        issueTitle: issue.title,
        kind: ev.status === "resolved" ? "resolved" : ev.status === "verified" ? "verified" : "status",
        title: statusTitle(ev.status),
        body: ev.note,
        icon: ev.status === "resolved" ? "✅" : ev.status === "verified" ? "👥" : "🛠️",
        tone: ev.status === "resolved" ? "success" : "info",
        at: ev.at,
      });
    }

    const sla = slaInfo(issue);
    if (sla.state === "breached") {
      notifs.push({
        id: `n_${issue.id}_breach`,
        issueId: issue.id,
        issueTitle: issue.title,
        kind: "breach",
        title: "SLA breached - auto-escalated",
        body: `Your report has passed its ${issue.slaHours}h municipal commitment (${sla.label}). The Co-pilot has escalated it to the top of the dispatch queue.`,
        icon: "⚠️",
        tone: "danger",
        at: sla.deadline,
      });
    }
  }

  return notifs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
}

export function unreadCount(notifs: Notification[]): number {
  // "Unread" = actionable items the citizen most likely hasn't seen: breaches + resolutions.
  return notifs.filter((n) => n.kind === "breach" || n.kind === "resolved").length;
}

export type { Issue };
