import { NextRequest, NextResponse } from "next/server";
import { verifyResolution } from "@/lib/agents/resolutionVerify";
import { getIssue, newId, setStatus, updateIssue } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const afterImageDataUrl = body.afterImageDataUrl as string | undefined;

  const result = await verifyResolution(issue, afterImageDataUrl);
  const at = new Date().toISOString();

  if (result.verified) {
    await updateIssue(id, {
      afterImageUrl: afterImageDataUrl,
      resolutionVerification: { ...result, at, afterImageUrl: afterImageDataUrl },
    });
    await setStatus(
      id,
      "resolved",
      `AI resolution verification passed (${Math.round(result.confidence * 100)}% confidence): ${result.observation}`,
      "AI Verifier",
    );
  } else {
    const cur = await getIssue(id);
    cur?.timeline.push({
      id: newId("t"),
      status: "comment",
      note: `AI resolution verification did not pass: ${result.observation}`,
      at,
      by: "AI Verifier",
    });
    await updateIssue(id, { resolutionVerification: { ...result, at, afterImageUrl: afterImageDataUrl } });
  }

  return NextResponse.json({ result, issue: await getIssue(id) });
}
