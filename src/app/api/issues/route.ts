import { NextResponse } from "next/server";
import { communityStats, listIssues } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    issues: await listIssues(),
    stats: await communityStats(),
  });
}
