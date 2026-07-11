import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents/orchestrator";
import {
  addIssue,
  awardPoints,
  CURRENT_USER_ID,
  getIssue,
  getUser,
  listIssues,
  newId,
  updateIssue,
} from "@/lib/store";
import { POINTS } from "@/lib/gamification";
import { CATEGORY_META, type Issue } from "@/lib/types";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`report:${clientIp(req)}`, 10, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many reports. Please wait a moment and try again." },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const { description, imageDataUrl, location, language } = body as {
      description?: string;
      imageDataUrl?: string;
      location?: { lat: number; lng: number; address: string; ward?: string };
      language?: string;
    };

    if (!location) {
      return NextResponse.json({ error: "location is required" }, { status: 400 });
    }
    if ((!description || description.trim().length < 2) && !imageDataUrl) {
      return NextResponse.json({ error: "Please provide a description or a photo" }, { status: 400 });
    }

    const user = await getUser(CURRENT_USER_ID);
    const reporterName = user?.name ?? "You";

    const result = await runPipeline({
      description: description ?? "",
      imageDataUrl,
      location,
      reporterName,
      existingIssues: await listIssues(),
      languageHint: language,
    });

    // If it's a duplicate, boost the existing issue instead of creating noise.
    if (result.duplicateOf) {
      const existing = await getIssue(result.duplicateOf);
      if (existing) {
        await updateIssue(existing.id, {
          confirmations: existing.confirmations + 1,
          upvotes: existing.upvotes + 1,
        });
        existing.timeline.push({
          id: newId("t"),
          status: "comment",
          note: `${reporterName} independently reported the same issue - AI merged it as a confirmation (+1 confirmation).`,
          at: new Date().toISOString(),
          by: reporterName,
        });
        await awardPoints(CURRENT_USER_ID, POINTS.confirmation, { verify: true });
        return NextResponse.json({
          duplicate: true,
          mergedInto: existing,
          analysis: result.analysis,
          pointsAwarded: POINTS.confirmation,
        });
      }
    }

    const now = new Date().toISOString();
    const issue: Issue = {
      id: newId("iss"),
      title: result.title,
      description: description?.trim() || result.analysis.visionDescription || result.title,
      originalDescription: result.originalDescription,
      language: result.language,
      category: result.category,
      subcategory: result.subcategory,
      tags: result.tags,
      severity: result.severity,
      urgency: result.urgency,
      status: "reported",
      location,
      imageUrl: imageDataUrl || CATEGORY_META[result.category].icon,
      reporterId: CURRENT_USER_ID,
      reporterName,
      createdAt: now,
      updatedAt: now,
      upvotes: 1,
      confirmations: 1,
      department: result.department,
      slaHours: result.slaHours,
      timeline: [
        {
          id: newId("t"),
          status: "reported",
          note: "Issue reported by citizen and analyzed by the CivicPulse AI agent team.",
          at: now,
          by: reporterName,
        },
      ],
      analysis: result.analysis,
    };

    await addIssue(issue);
    const updatedUser = await awardPoints(CURRENT_USER_ID, POINTS.report, { report: true });

    return NextResponse.json({
      duplicate: false,
      issue,
      analysis: result.analysis,
      pointsAwarded: POINTS.report,
      user: updatedUser,
    });
  } catch (err) {
    console.error("[/api/report] error", err);
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
  }
}
