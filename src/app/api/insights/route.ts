import { NextResponse } from "next/server";
import { runInsights } from "@/lib/agents/insights";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const result = await runInsights();
  return NextResponse.json(result);
}
