import { NextRequest, NextResponse } from "next/server";
import { parseDataUrl, geminiTranscribe } from "@/lib/gemini";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`transcribe:${clientIp(req)}`, 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many transcription requests. Please wait a moment." },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const { audio, language } = body as { audio?: string; language?: string };

    if (!audio) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    const parsed = parseDataUrl(audio);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
    }

    const transcription = await geminiTranscribe(parsed.data, parsed.mimeType, language || "English");

    if (transcription === null) {
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    return NextResponse.json({ text: transcription });
  } catch (err) {
    console.error("[api/transcribe] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
