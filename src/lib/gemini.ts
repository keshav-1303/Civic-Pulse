import { GoogleGenAI, type FunctionDeclaration, type Schema } from "@google/genai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!hasGeminiKey()) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  return client;
}

export interface ImageInput {
  mimeType: string;
  data: string; // base64 (no data: prefix)
}

export function parseDataUrl(dataUrl?: string): ImageInput | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function extractJSON<T>(text: string): T | null {
  if (!text) return null;
  // Strip code fences if present
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

interface JSONArgs {
  system: string;
  prompt: string;
  image?: ImageInput | null;
  temperature?: number;
  /** Optional structured-output schema. When provided, Gemini is constrained to this shape. */
  responseSchema?: Schema;
}

/** Calls Gemini expecting a JSON object. Returns null on any failure (callers fall back to heuristics). */
export async function geminiJSON<T>(args: JSONArgs): Promise<T | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const parts: Array<Record<string, unknown>> = [{ text: args.prompt }];
    if (args.image) {
      parts.push({ inlineData: { mimeType: args.image.mimeType, data: args.image.data } });
    }
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: args.system,
        responseMimeType: "application/json",
        ...(args.responseSchema ? { responseSchema: args.responseSchema } : {}),
        temperature: args.temperature ?? 0.4,
      },
    });
    return extractJSON<T>(response.text ?? "");
  } catch (err) {
    console.error("[gemini] JSON call failed:", (err as Error).message);
    return null;
  }
}

/** A single tool invocation recorded during an agentic tool-calling loop (for UI/trace). */
export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

/** A tool the model can autonomously call: a Gemini function declaration + its handler. */
export interface ToolDef {
  declaration: FunctionDeclaration;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface ToolLoopArgs {
  system: string;
  prompt: string;
  tools: Record<string, ToolDef>;
  image?: ImageInput | null;
  temperature?: number;
  maxTurns?: number;
}

/**
 * Runs an agentic function-calling loop: Gemini decides which tools to call, we execute
 * them, feed results back, and repeat until the model returns a final JSON answer.
 * Returns the parsed answer plus the full trace of tool calls. Null on any failure.
 */
export async function geminiToolLoop<T>(
  args: ToolLoopArgs,
): Promise<{ data: T | null; toolCalls: ToolCallRecord[] } | null> {
  const ai = getClient();
  if (!ai) return null;
  const toolCalls: ToolCallRecord[] = [];
  try {
    const functionDeclarations = Object.values(args.tools).map((t) => t.declaration);
    const userParts: Array<Record<string, unknown>> = [{ text: args.prompt }];
    if (args.image) userParts.push({ inlineData: { mimeType: args.image.mimeType, data: args.image.data } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any[] = [{ role: "user", parts: userParts }];
    const maxTurns = args.maxTurns ?? 4;

    for (let turn = 0; turn < maxTurns; turn++) {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: args.system,
          temperature: args.temperature ?? 0.3,
          tools: [{ functionDeclarations }],
        },
      });

      const calls = response.functionCalls;
      if (calls && calls.length > 0) {
        contents.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseParts: any[] = [];
        for (const call of calls) {
          const tool = args.tools[call.name ?? ""];
          let result: unknown = { error: `Unknown tool: ${call.name}` };
          if (tool) {
            try {
              result = await tool.handler(call.args ?? {});
            } catch (e) {
              result = { error: (e as Error).message };
            }
          }
          toolCalls.push({ name: call.name ?? "", args: call.args ?? {}, result });
          responseParts.push({ functionResponse: { name: call.name, response: { result } } });
        }
        contents.push({ role: "user", parts: responseParts });
        continue;
      }

      return { data: extractJSON<T>(response.text ?? ""), toolCalls };
    }
    return { data: null, toolCalls };
  } catch (err) {
    console.error("[gemini] tool loop failed:", (err as Error).message);
    return null;
  }
}

interface TextArgs {
  system: string;
  prompt: string;
  history?: Array<{ role: "user" | "model"; text: string }>;
  temperature?: number;
}

/** Embeds one or more texts with Gemini. Returns null on failure so callers can fall back. */
export async function geminiEmbed(texts: string[]): Promise<number[][] | null> {
  const ai = getClient();
  if (!ai || texts.length === 0) return null;
  try {
    const response = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: texts,
    });
    const vectors = response.embeddings?.map((e) => e.values ?? []).filter((v) => v.length > 0);
    return vectors && vectors.length === texts.length ? (vectors as number[][]) : null;
  } catch (err) {
    console.error("[gemini] embed call failed:", (err as Error).message);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function geminiText(args: TextArgs): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const contents = [
      ...(args.history?.map((h) => ({ role: h.role, parts: [{ text: h.text }] })) ?? []),
      { role: "user" as const, parts: [{ text: args.prompt }] },
    ];
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: args.system,
        temperature: args.temperature ?? 0.6,
      },
    });
    return response.text ?? null;
  } catch (err) {
    console.error("[gemini] text call failed:", (err as Error).message);
    return null;
  }
}
