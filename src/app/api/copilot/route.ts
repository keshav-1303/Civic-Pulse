import { NextRequest, NextResponse } from "next/server";
import { runCopilot } from "@/lib/agents/copilot";
import { getServerSession } from "@/lib/session";
import { canViewCopilot } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!canViewCopilot(session?.role)) {
    return NextResponse.json({ error: "Municipal staff access required" }, { status: 403 });
  }
  const force = req.nextUrl.searchParams.get("refresh") === "1";
  const plan = await runCopilot(force);
  return NextResponse.json(plan);
}
