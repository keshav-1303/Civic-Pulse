import { NextRequest, NextResponse } from "next/server";
import { getIssue, newId, setStatus, updateIssue } from "@/lib/store";
import { crewFor } from "@/lib/agents/tools";
import { getServerSession } from "@/lib/session";
import { canManageIssues } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Co-pilot action endpoint: the AI chief-of-staff dispatches a field crew.
 * This actually mutates the issue (assigns a crew + moves it to in_progress),
 * turning the Co-pilot from an advisor into an actor.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!canManageIssues(session?.role)) {
    return NextResponse.json({ error: "Municipal staff access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const issueId = body.issueId as string | undefined;
  const crewOverride = typeof body.crew === "string" ? body.crew : undefined;
  if (!issueId) return NextResponse.json({ error: "issueId required" }, { status: 400 });

  const issue = await getIssue(issueId);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (issue.status === "resolved" || issue.status === "rejected") {
    return NextResponse.json({ error: "Issue is already closed" }, { status: 400 });
  }

  const crew = crewOverride || crewFor(issue.category);
  const now = new Date().toISOString();

  await updateIssue(issueId, { assignedCrew: crew, dispatchedAt: now });
  issue.timeline.push({
    id: newId("t"),
    status: "agent",
    note: `🤖 Municipal Co-pilot dispatched ${crew} and issued a work order (SLA ${issue.slaHours}h).`,
    at: now,
    by: "Municipal Co-pilot (AI)",
  });

  if (issue.status !== "in_progress") {
    await setStatus(issueId, "in_progress", `Work order issued by the AI Co-pilot - ${crew} assigned.`, "Municipal Co-pilot (AI)");
  }

  return NextResponse.json({ issue: await getIssue(issueId), crew });
}
