import { NextRequest, NextResponse } from "next/server";
import { verifyResolution } from "@/lib/agents/resolutionVerify";
import { getIssue, newId, setStatus, updateIssue } from "@/lib/store";
import { haversine } from "@/lib/geo";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const afterImageDataUrl = body.afterImageDataUrl as string | undefined;
  const userLat = body.userLat as number | undefined;
  const userLng = body.userLng as number | undefined;

  if (userLat === undefined || userLng === undefined) {
    return NextResponse.json({ error: "Location permissions are required to verify the fix." }, { status: 400 });
  }

  const distance = haversine(
    { lat: userLat, lng: userLng },
    { lat: issue.location.lat, lng: issue.location.lng }
  );

  const maxDistance = 250; // 250 meters
  if (distance > maxDistance) {
    return NextResponse.json(
      { error: `Location mismatch: You must be near the reported issue (within ${maxDistance}m) to verify. You are currently ${Math.round(distance)}m away.` },
      { status: 400 }
    );
  }

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
