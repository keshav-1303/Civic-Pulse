import { NextResponse } from "next/server";
import { hasGeminiKey, GEMINI_MODEL } from "@/lib/gemini";
import { CITY } from "@/lib/seed";
import { CURRENT_USER_ID, getUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    aiEnabled: hasGeminiKey(),
    model: hasGeminiKey() ? GEMINI_MODEL : "heuristic-fallback",
    city: CITY,
    currentUser: (await getUser(CURRENT_USER_ID)) ?? null,
  });
}
