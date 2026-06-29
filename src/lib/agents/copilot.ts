import { geminiJSON, hasGeminiKey } from "../gemini";
import { getDataVersion, listIssues } from "../store";
import { CATEGORY_META, type Issue } from "../types";
import { slaInfo, type SlaState } from "../sla";

export interface PriorityItem {
  issueId: string;
  title: string;
  rank: number;
  priorityScore: number;
  reason: string;
  department: string;
  recommendedCrew: string;
  etaHours: number;
  slaState?: SlaState;
  slaLabel?: string;
}

export interface DepartmentLoad {
  department: string;
  open: number;
  critical: number;
}

export interface ActionPlan {
  generatedAt: string;
  summary: string;
  focusToday: string;
  priorities: PriorityItem[];
  departmentLoad: DepartmentLoad[];
  slaBreaches: number;
  isMock: boolean;
}

function ageDays(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86400000);
}

const URGENCY_WEIGHT: Record<string, number> = { critical: 6, high: 4, medium: 2, low: 1 };
/** SLA pressure escalates priority so breaches surface to the top of the queue. */
const SLA_ESCALATION: Partial<Record<SlaState, number>> = { breached: 8, due_soon: 3 };

function scoreIssue(i: Issue): number {
  const base = i.severity * 2 + (URGENCY_WEIGHT[i.urgency] ?? 1) + i.confirmations * 0.15 + Math.min(ageDays(i.createdAt), 10) * 0.5;
  const escalation = SLA_ESCALATION[slaInfo(i).state] ?? 0;
  return Math.round((base + escalation) * 10) / 10;
}

function crewFor(i: Issue): string {
  const map: Record<string, string> = {
    pothole: "Road repair crew + hot-mix unit",
    road_damage: "Road repair crew",
    water_leakage: "Water board rapid-response team",
    drainage: "Desilting & sewerage crew",
    streetlight: "Electrical maintenance team",
    electricity: "High-voltage safety team",
    waste: "Sanitation truck + cleanup crew",
    vegetation: "Tree-cutting / horticulture crew",
    public_safety: "Traffic & safety unit",
    graffiti: "Public works cleanup crew",
    other: "General field inspector",
  };
  return map[i.category] ?? "General field inspector";
}

function departmentLoad(open: Issue[]): DepartmentLoad[] {
  const map: Record<string, DepartmentLoad> = {};
  for (const i of open) {
    const d = i.department;
    if (!map[d]) map[d] = { department: d, open: 0, critical: 0 };
    map[d].open += 1;
    if (i.urgency === "critical") map[d].critical += 1;
  }
  return Object.values(map).sort((a, b) => b.open - a.open);
}

interface CopilotCache {
  plan: ActionPlan;
  version: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __CIVICPULSE_COPILOT_CACHE__: CopilotCache | undefined;
}

/**
 * Returns the Co-pilot action plan. The plan is cached on the server so that
 * navigating back to the admin tab does NOT re-run the (potentially expensive)
 * agent. The cache auto-invalidates when issue data changes (new report,
 * status update, crew dispatch). Pass `force: true` to regenerate on demand.
 */
export async function runCopilot(force = false): Promise<ActionPlan> {
  const cache = global.__CIVICPULSE_COPILOT_CACHE__;
  if (!force && cache && cache.version === getDataVersion()) {
    return cache.plan;
  }
  const plan = await computeCopilot();
  global.__CIVICPULSE_COPILOT_CACHE__ = { plan, version: getDataVersion() };
  return plan;
}

async function computeCopilot(): Promise<ActionPlan> {
  const open = (await listIssues()).filter((i) => i.status !== "resolved" && i.status !== "rejected");
  const generatedAt = new Date().toISOString();
  const loads = departmentLoad(open);
  const slaBreaches = open.filter((i) => slaInfo(i).state === "breached").length;

  const ranked = [...open].sort((a, b) => scoreIssue(b) - scoreIssue(a));
  const top = ranked.slice(0, 8);

  if (hasGeminiKey() && open.length > 0) {
    const lines = top.map((i) => {
      const sla = slaInfo(i);
      return `${i.id} | ${i.title} | ${CATEGORY_META[i.category].label} | severity ${i.severity}/5 | ${i.urgency} | ${i.confirmations} confirmations | ${Math.round(ageDays(i.createdAt))}d old | SLA ${i.slaHours}h (${sla.state}, ${sla.label}) | ${i.location.ward ?? ""} | dept: ${i.department}`;
    });
    const result = await geminiJSON<{ summary: string; focusToday: string; priorities: PriorityItem[] }>({
      system:
        "You are the Municipal Operations Co-pilot - an AI chief-of-staff for a city corporation. Given today's open civic issues, produce a prioritized action plan that maximizes public safety and efficient use of crews. Issues whose SLA is already breached or due soon MUST be escalated to the top. Rank issues, justify each priority (cite the SLA status when it drives the decision), assign a crew and a realistic ETA in hours. Be decisive and operational.",
      prompt: `Open issues:\n${lines.join("\n")}\n\n${slaBreaches} issue(s) have already breached their SLA. Return JSON: {"summary": string (2 sentences on the city's state today, mention SLA breaches), "focusToday": string (the single most important focus), "priorities": [{"issueId": string (must be from the list), "title": string, "rank": number, "priorityScore": number 0-100, "reason": string, "department": string, "recommendedCrew": string, "etaHours": number}]}. Rank the top ${Math.min(6, top.length)} only.`,
      temperature: 0.5,
    });
    if (result?.priorities?.length) {
      const valid = result.priorities
        .filter((p) => top.some((t) => t.id === p.issueId))
        .map((p) => {
          const issue = top.find((t) => t.id === p.issueId)!;
          const sla = slaInfo(issue);
          return { ...p, slaState: sla.state, slaLabel: sla.label };
        });
      if (valid.length) {
        return { generatedAt, summary: result.summary, focusToday: result.focusToday, priorities: valid, departmentLoad: loads, slaBreaches, isMock: false };
      }
    }
  }

  // Heuristic fallback
  const maxScore = top.length ? scoreIssue(top[0]) : 1;
  const priorities: PriorityItem[] = top.slice(0, 6).map((i, idx) => {
    const sla = slaInfo(i);
    const breached = sla.state === "breached";
    return {
      issueId: i.id,
      title: i.title,
      rank: idx + 1,
      priorityScore: Math.round((scoreIssue(i) / maxScore) * 100),
      reason: breached
        ? `⚠ SLA breached (${sla.label}) - escalated. Severity ${i.severity}/5 with ${i.confirmations} confirmations; the city is now past its ${i.slaHours}h commitment.`
        : i.urgency === "critical"
          ? `Critical safety risk (severity ${i.severity}/5) with ${i.confirmations} citizen confirmations - high liability if delayed. ${sla.label}.`
          : `Severity ${i.severity}/5, ${i.confirmations} confirmations, ${Math.round(ageDays(i.createdAt))} days open. ${sla.label}.`,
      department: i.department,
      recommendedCrew: crewFor(i),
      etaHours: i.slaHours,
      slaState: sla.state,
      slaLabel: sla.label,
    };
  });

  const criticalCount = open.filter((i) => i.urgency === "critical").length;
  const topWard = loads.length ? loads[0] : null;
  return {
    generatedAt,
    summary: `${open.length} issues are open across the city, ${criticalCount} of them critical${slaBreaches > 0 ? ` and ${slaBreaches} already past SLA` : ""}. ${topWard ? `${topWard.department} carries the heaviest load with ${topWard.open} open cases.` : ""}`,
    focusToday: slaBreaches > 0
      ? `Clear the ${slaBreaches} SLA-breached case(s) immediately - the city is past its public commitment and exposed to liability.`
      : criticalCount > 0
        ? `Dispatch crews to the ${criticalCount} critical life-safety issue(s) first - these carry the highest risk and liability.`
        : "Clear the oldest high-severity backlog and reinforce the busiest department.",
    priorities,
    departmentLoad: loads,
    slaBreaches,
    isMock: true,
  };
}
