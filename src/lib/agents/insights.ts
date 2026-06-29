import { geminiJSON, hasGeminiKey } from "../gemini";
import { listIssues } from "../store";
import { CATEGORY_META, type IssueCategory } from "../types";

export interface Insight {
  type: "hotspot" | "prediction" | "trend" | "recommendation";
  icon: string;
  title: string;
  detail: string;
  severity: "info" | "watch" | "urgent";
}

export interface InsightsResult {
  insights: Insight[];
  isMock: boolean;
  generatedAt: string;
}

async function aggregate() {
  const issues = await listIssues();
  const byCategory: Record<string, number> = {};
  const byWard: Record<string, number> = {};
  const openByWard: Record<string, number> = {};
  let critical = 0;
  for (const i of issues) {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    const ward = i.location.ward ?? "Unknown";
    byWard[ward] = (byWard[ward] || 0) + 1;
    if (i.status !== "resolved") openByWard[ward] = (openByWard[ward] || 0) + 1;
    if (i.urgency === "critical" && i.status !== "resolved") critical += 1;
  }
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const topWard = Object.entries(openByWard).sort((a, b) => b[1] - a[1])[0];
  return { issues, byCategory, byWard, openByWard, topCategory, topWard, critical };
}

export async function runInsights(): Promise<InsightsResult> {
  const agg = await aggregate();
  const generatedAt = new Date().toISOString();

  if (hasGeminiKey()) {
    const dataSummary = `Total reports: ${agg.issues.length}. By category: ${JSON.stringify(agg.byCategory)}. Open by ward: ${JSON.stringify(agg.openByWard)}. Open critical: ${agg.critical}.`;
    const result = await geminiJSON<{ insights: Insight[] }>({
      system:
        "You are a predictive civic-analytics agent for a city municipality. From the aggregated issue data, produce 4-5 actionable insights: identify hotspots, predict likely upcoming problems (e.g. monsoon drainage, recurring potholes), spot trends, and recommend proactive municipal actions. Each insight: {type: hotspot|prediction|trend|recommendation, icon: an emoji, title: short, detail: 1-2 sentences, severity: info|watch|urgent}.",
      prompt: `Aggregated data: ${dataSummary}. Categories available: ${Object.keys(CATEGORY_META).join(", ")}. Return JSON: {"insights": Insight[]}.`,
      temperature: 0.6,
    });
    if (result?.insights?.length) {
      return { insights: result.insights, isMock: false, generatedAt };
    }
  }

  return { insights: mockInsights(agg), isMock: true, generatedAt };
}

function mockInsights(agg: Awaited<ReturnType<typeof aggregate>>): Insight[] {
  const insights: Insight[] = [];
  if (agg.topWard) {
    insights.push({
      type: "hotspot",
      icon: "📍",
      title: `${agg.topWard[0]} is the current hotspot`,
      detail: `${agg.topWard[0]} has ${agg.topWard[1]} open reports - the highest in the city. Consider a focused field-inspection drive this week.`,
      severity: agg.topWard[1] >= 3 ? "urgent" : "watch",
    });
  }
  if (agg.topCategory) {
    const cat = agg.topCategory[0] as IssueCategory;
    insights.push({
      type: "trend",
      icon: "📈",
      title: `${CATEGORY_META[cat].label} reports are trending`,
      detail: `${CATEGORY_META[cat].label} is the most reported category (${agg.topCategory[1]} reports). Routing capacity at ${CATEGORY_META[cat].department} should be reinforced.`,
      severity: "watch",
    });
  }
  insights.push({
    type: "prediction",
    icon: "🌧️",
    title: "Monsoon will amplify drainage & pothole risk",
    detail: "Based on category clustering, expect a 30-40% spike in waterlogging, potholes and drainage complaints during rains. Pre-monsoon de-silting of drains in hotspot wards is advised.",
    severity: "watch",
  });
  if (agg.critical > 0) {
    insights.push({
      type: "recommendation",
      icon: "🚑",
      title: `${agg.critical} critical issue(s) need immediate dispatch`,
      detail: "These are flagged life-safety risks (open manholes, live wires, accident-prone potholes). Recommend same-day field response to avoid liability.",
      severity: "urgent",
    });
  }
  insights.push({
    type: "recommendation",
    icon: "🤝",
    title: "Engage top citizens as ward champions",
    detail: "A handful of highly active reporters drive most verified reports. Onboard them as ward champions to crowd-verify issues faster and improve data quality.",
    severity: "info",
  });
  return insights;
}
