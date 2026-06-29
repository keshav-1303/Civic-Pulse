import { NextRequest, NextResponse } from "next/server";
import {
  awardPoints,
  CURRENT_USER_ID,
  getIssue,
  getUser,
  newId,
  setStatus,
  updateIssue,
} from "@/lib/store";
import { POINTS } from "@/lib/gamification";
import type { IssueStatus } from "@/lib/types";
import { getServerSession } from "@/lib/session";
import { canManageIssues } from "@/lib/roles";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Record<IssueStatus, IssueStatus | null> = {
  reported: "verified",
  verified: "in_progress",
  in_progress: "resolved",
  resolved: null,
  rejected: null,
};

const ADVANCE_NOTE: Record<string, string> = {
  verified: "Confirmed by the community. Marked as verified.",
  in_progress: "Work order issued - field team has been assigned.",
  resolved: "Issue resolved and verified on-site. Loop closed.",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as "confirm" | "upvote" | "advance" | undefined;

  if (action === "confirm" || action === "upvote") {
    const user = await getUser(CURRENT_USER_ID);
    const confirmations = issue.confirmations + 1;
    const upvotes = issue.upvotes + 1;
    await updateIssue(id, { confirmations, upvotes });
    issue.timeline.push({
      id: newId("t"),
      status: "comment",
      note: `${user?.name ?? "A citizen"} confirmed they're also affected by this issue.`,
      at: new Date().toISOString(),
      by: user?.name ?? "Citizen",
    });
    // Auto-verify once enough community confirmations arrive.
    if (issue.status === "reported" && confirmations >= 5) {
      await setStatus(id, "verified", "Reached the community verification threshold (5+ confirmations).", "Community");
    }
    await awardPoints(CURRENT_USER_ID, POINTS.confirmation, { verify: true });
    return NextResponse.json({ issue: await getIssue(id), pointsAwarded: POINTS.confirmation });
  }

  if (action === "advance") {
    // Advancing the municipal workflow is a privileged staff action.
    const session = await getServerSession();
    if (!canManageIssues(session?.role)) {
      return NextResponse.json({ error: "Municipal staff access required" }, { status: 403 });
    }
    const next = NEXT_STATUS[issue.status];
    if (!next) return NextResponse.json({ error: "No further status" }, { status: 400 });
    await setStatus(id, next, ADVANCE_NOTE[next] ?? `Status updated to ${next}.`, session?.name ?? "Municipal Dept.");
    return NextResponse.json({ issue: await getIssue(id) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
