import type { Issue } from "./types";

export type SlaState = "on_track" | "due_soon" | "breached" | "met" | "missed";

export interface SlaInfo {
  state: SlaState;
  isOpen: boolean;
  deadline: string; // ISO
  hoursElapsed: number;
  hoursRemaining: number; // negative once breached
  pctElapsed: number; // 0-100+
  label: string;
}

const MS_PER_HOUR = 3_600_000;
/** Once an open issue has burned this % of its SLA window it is "due soon". */
const DUE_SOON_PCT = 75;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function resolvedAtMs(issue: Issue): number | null {
  for (let i = issue.timeline.length - 1; i >= 0; i--) {
    if (issue.timeline[i].status === "resolved") return new Date(issue.timeline[i].at).getTime();
  }
  return null;
}

/** Human-friendly duration: "45m", "18h", "2d 4h". */
export function formatHours(hours: number): string {
  const abs = Math.abs(hours);
  if (abs < 1) return `${Math.max(1, Math.round(abs * 60))}m`;
  if (abs < 48) return `${Math.round(abs)}h`;
  const days = Math.floor(abs / 24);
  const rem = Math.round(abs % 24);
  return rem ? `${days}d ${rem}h` : `${days}d`;
}

/** Compute SLA status for an issue relative to `now`. Pure + dependency-free. */
export function slaInfo(issue: Issue, now: number = Date.now()): SlaInfo {
  const created = new Date(issue.createdAt).getTime();
  const deadlineMs = created + issue.slaHours * MS_PER_HOUR;
  const deadline = new Date(deadlineMs).toISOString();
  const isOpen = issue.status !== "resolved" && issue.status !== "rejected";

  if (!isOpen) {
    const end =
      issue.status === "resolved"
        ? resolvedAtMs(issue) ?? new Date(issue.updatedAt).getTime()
        : now;
    const hoursElapsed = Math.max(0, (end - created) / MS_PER_HOUR);
    const within = end <= deadlineMs;
    const state: SlaState = issue.status === "resolved" ? (within ? "met" : "missed") : "met";
    return {
      state,
      isOpen: false,
      deadline,
      hoursElapsed: round1(hoursElapsed),
      hoursRemaining: round1((deadlineMs - end) / MS_PER_HOUR),
      pctElapsed: Math.round((hoursElapsed / issue.slaHours) * 100),
      label:
        issue.status !== "resolved"
          ? "Closed"
          : within
            ? `Resolved within SLA (${formatHours(hoursElapsed)})`
            : `Resolved ${formatHours(hoursElapsed - issue.slaHours)} past SLA`,
    };
  }

  const hoursElapsed = Math.max(0, (now - created) / MS_PER_HOUR);
  const hoursRemaining = (deadlineMs - now) / MS_PER_HOUR;
  const pctElapsed = Math.round((hoursElapsed / issue.slaHours) * 100);

  let state: SlaState;
  let label: string;
  if (hoursRemaining < 0) {
    state = "breached";
    label = `SLA breached ${formatHours(hoursRemaining)} ago`;
  } else if (pctElapsed >= DUE_SOON_PCT) {
    state = "due_soon";
    label = `Due in ${formatHours(hoursRemaining)}`;
  } else {
    state = "on_track";
    label = `${formatHours(hoursRemaining)} left`;
  }

  return {
    state,
    isOpen: true,
    deadline,
    hoursElapsed: round1(hoursElapsed),
    hoursRemaining: round1(hoursRemaining),
    pctElapsed,
    label,
  };
}

export function isBreached(issue: Issue, now?: number): boolean {
  return slaInfo(issue, now).state === "breached";
}

export const SLA_STATE_META: Record<SlaState, { label: string; color: string; chip: string }> = {
  on_track: { label: "On track", color: "#16b783", chip: "bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30" },
  due_soon: { label: "Due soon", color: "#ca8a04", chip: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30" },
  breached: { label: "SLA breached", color: "#dc2626", chip: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30" },
  met: { label: "Met SLA", color: "#16b783", chip: "bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30" },
  missed: { label: "Missed SLA", color: "#dc2626", chip: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30" },
};
