import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "civicpulse",
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
