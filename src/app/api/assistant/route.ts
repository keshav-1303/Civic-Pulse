import { NextRequest, NextResponse } from "next/server";
import { runAssistant } from "@/lib/agents/assistant";
import type { ChatMessage } from "@/lib/types";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`assistant:${clientIp(req)}`, 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "You are sending messages too quickly. Please slow down." },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const message = (body.message as string) || "";
    const history = (body.history as ChatMessage[]) || [];
    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const { reply, isMock } = await runAssistant(message, history);
    return NextResponse.json({ reply, isMock });
  } catch (err) {
    console.error("[/api/assistant] error", err);
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}
