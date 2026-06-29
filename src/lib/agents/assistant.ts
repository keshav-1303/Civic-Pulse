import { geminiText, hasGeminiKey } from "../gemini";
import { communityStats, listIssues } from "../store";
import { CATEGORY_META, STATUS_META, type ChatMessage } from "../types";

async function buildContext(): Promise<string> {
  const issues = await listIssues();
  const stats = await communityStats();
  const lines = issues.slice(0, 20).map(
    (i) =>
      `- [${i.id}] "${i.title}" | ${CATEGORY_META[i.category].label} | severity ${i.severity}/5 | status ${STATUS_META[i.status].label} | ${i.location.ward ?? ""} | ${i.upvotes} upvotes`,
  );
  return `Community snapshot - total reports: ${stats.total}, resolved: ${stats.resolved} (${stats.resolutionRate}% resolution rate), in progress: ${stats.inProgress}, open critical: ${stats.critical}.
Recent issues:
${lines.join("\n")}`;
}

const SYSTEM = `You are "Hero", the friendly AI civic assistant inside CivicPulse - a hyperlocal community problem-solving platform.
You help citizens: report issues, check the status of reports, understand which department handles what, give safety advice, and explain civic processes.
Be concise, warm and practical. Use the live community data provided. If asked about a specific issue id or area, use the snapshot. Encourage civic participation. If you don't know, say so and suggest filing a report. Keep answers under ~120 words unless asked for detail.`;

export async function runAssistant(message: string, history: ChatMessage[]): Promise<{ reply: string; isMock: boolean }> {
  const context = await buildContext();
  if (hasGeminiKey()) {
    const reply = await geminiText({
      system: `${SYSTEM}\n\nLIVE DATA:\n${context}`,
      history: history.slice(-6).map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.content })),
      prompt: message,
      temperature: 0.6,
    });
    if (reply) return { reply, isMock: false };
  }
  const stats = await communityStats();
  const issues = await listIssues();
  return { reply: mockReply(message, stats, issues), isMock: true };
}

function mockReply(message: string, stats: any, issues: any[]): string {
  const m = message.toLowerCase();
  if (m.includes("status") || m.includes("update")) {
    const inProg = issues.filter((i) => i.status === "in_progress").slice(0, 2);
    return `Here's the latest: ${stats.total} reports filed, ${stats.resolved} resolved (${stats.resolutionRate}% resolution rate) and ${stats.inProgress} in progress. Currently being worked on: ${inProg.map((i) => `"${i.title}"`).join(", ") || "-"}. You can open any issue to see its full timeline.`;
  }
  if (m.includes("report") || m.includes("file") || m.includes("complain")) {
    return `Reporting takes 30 seconds: tap "Report an Issue", add a photo and a line about the problem, and my agent team will auto-categorize it, score the risk, check for duplicates and route it to the right department. Want me to point you to the report page?`;
  }
  if (m.includes("pothole")) return `Potholes are handled by the Roads & Highways Dept. We have ${issues.filter((i) => i.category === "pothole").length} pothole report(s) right now. Snap a photo on the report page and I'll get it logged and routed.`;
  if (m.includes("water")) return `Water leakages go to the Water Supply Board. If it's a burst main, it's treated as critical with a 12-hour SLA. Report it with a photo and I'll prioritize it.`;
  if (m.includes("hotspot") || m.includes("area") || m.includes("ward")) {
    return `The most active areas right now have clusters of road and drainage issues. Check the live Map or the Impact Dashboard for ward-level hotspots and predicted risk zones.`;
  }
  if (m.includes("hi") || m.includes("hello") || m.includes("hey")) {
    return `Hi! I'm Hero, your civic assistant. I can help you report a problem, track a report's status, or tell you what's happening in your neighbourhood. What's on your mind?`;
  }
  return `I'm Hero, your civic assistant. I can help you report issues, track their status, find the right department, or surface neighbourhood hotspots. Right now the community has ${stats.total} reports with a ${stats.resolutionRate}% resolution rate. How can I help?`;
}
