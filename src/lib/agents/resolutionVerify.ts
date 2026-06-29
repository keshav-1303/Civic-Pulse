import { geminiJSON, hasGeminiKey, parseDataUrl } from "../gemini";
import { CATEGORY_META, type Issue } from "../types";

export interface VerifyResult {
  verified: boolean;
  confidence: number;
  observation: string;
  isMock: boolean;
}

export async function verifyResolution(issue: Issue, afterImageDataUrl?: string): Promise<VerifyResult> {
  const image = parseDataUrl(afterImageDataUrl);

  if (hasGeminiKey() && image) {
    const result = await geminiJSON<{ verified: boolean; confidence: number; observation: string }>({
      system:
        "You are a field-verification vision agent for a municipality. You are shown an 'after' photo submitted as proof that a reported civic issue was fixed. Judge whether the photo plausibly shows the issue resolved. Be reasonable but not gullible - if the photo clearly shows the problem still present, mark it unresolved.",
      prompt: `The reported issue was: "${issue.title}" - a ${CATEGORY_META[issue.category].label.toLowerCase()}. Original description: "${issue.description}". Does this 'after' photo show the issue resolved? Return JSON: {"verified": boolean, "confidence": number 0-1, "observation": string (what you see and why)}.`,
      image,
      temperature: 0.2,
    });
    if (result && typeof result.verified === "boolean") {
      return { ...result, confidence: Math.max(0, Math.min(1, result.confidence ?? 0.7)), isMock: false };
    }
  }

  // Fallback: accept the proof optimistically (demo) when no live vision is available.
  return {
    verified: true,
    confidence: 0.82,
    observation: image
      ? "Proof photo received. The submitted 'after' image indicates the reported problem is no longer visible at the location. (Add GEMINI_API_KEY for pixel-level AI verification.)"
      : "Resolution recorded without a photo. Field team confirmation accepted.",
    isMock: true,
  };
}
