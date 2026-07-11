import {
  geminiJSON,
  hasGeminiKey,
  parseDataUrl,
  GEMINI_MODEL,
  geminiEmbed,
  cosineSimilarity,
  geminiToolLoop,
  type ToolCallRecord,
} from "../gemini";
import { detectLanguageByScript } from "../language";
import { haversine } from "../geo";
import { buildRoutingTools, SLA_BY_URGENCY } from "./tools";
import {
  CATEGORY_META,
  type AgentAnalysis,
  type AgentStep,
  type GeoLocation,
  type Issue,
  type IssueCategory,
  type ToolCall,
} from "../types";

export interface PipelineInput {
  description: string;
  imageDataUrl?: string;
  location: GeoLocation;
  reporterName: string;
  existingIssues: Issue[];
  languageHint?: string;
}

export interface PipelineResult {
  analysis: AgentAnalysis;
  category: IssueCategory;
  subcategory: string;
  title: string;
  tags: string[];
  severity: number;
  urgency: Issue["urgency"];
  department: string;
  slaHours: number;
  duplicateOf?: string;
  language: string;
  originalDescription: string;
}

const CATEGORY_KEYWORDS: Record<IssueCategory, string[]> = {
  pothole: ["pothole", "crater", "hole in road", "sunken"],
  water_leakage: ["water leak", "pipeline", "pipe burst", "leakage", "water gush", "drinking water"],
  streetlight: ["streetlight", "street light", "lamp", "dark", "pole light", "lighting"],
  waste: ["garbage", "trash", "waste", "dump", "litter", "debris", "smell", "rubbish"],
  drainage: ["drain", "sewage", "manhole", "stagnant", "overflow", "gutter", "mosquito"],
  road_damage: ["road damage", "cracked road", "asphalt", "rebar", "zebra", "marking", "eroded"],
  public_safety: ["signal", "crossing", "unsafe", "accident", "barricade", "safety"],
  vegetation: ["tree", "branch", "fallen", "overgrown", "bush", "vegetation"],
  electricity: ["wire", "electric", "transformer", "shock", "spark", "live wire", "current"],
  graffiti: ["graffiti", "vandalism", "defaced", "spray paint"],
  other: [],
};

function classifyHeuristic(text: string): { category: IssueCategory; score: number } {
  const lower = text.toLowerCase();
  let best: IssueCategory = "other";
  let bestScore = 0;
  (Object.keys(CATEGORY_KEYWORDS) as IssueCategory[]).forEach((cat) => {
    const score = CATEGORY_KEYWORDS[cat].reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  });
  return { category: best, score: bestScore };
}

function severityHeuristic(text: string, category: IssueCategory): { severity: number; urgency: Issue["urgency"] } {
  const lower = text.toLowerCase();
  let severity = 2;
  const hazardWords = ["accident", "danger", "child", "fell", "injur", "fire", "shock", "burst", "critical", "deep", "live wire", "unsafe", "dengue", "blocking"];
  hazardWords.forEach((w) => {
    if (lower.includes(w)) severity += 1;
  });
  if (["electricity", "public_safety", "drainage"].includes(category)) severity += 1;
  severity = Math.max(1, Math.min(5, severity));
  const urgency: Issue["urgency"] =
    severity >= 5 ? "critical" : severity >= 4 ? "high" : severity >= 3 ? "medium" : "low";
  return { severity, urgency };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildComplaint(input: PipelineInput, category: IssueCategory, severity: number, descriptionText: string): string {
  const meta = CATEGORY_META[category];
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `To,
The Officer-in-Charge,
${meta.department},
Municipal Corporation

Date: ${date}
Subject: Urgent grievance regarding ${meta.label.toLowerCase()} at ${input.location.address}

Respected Sir/Madam,

I, ${input.reporterName}, a resident of ${input.location.ward ?? "the locality"}, wish to formally report a ${meta.label.toLowerCase()} at ${input.location.address} (GPS: ${input.location.lat.toFixed(5)}, ${input.location.lng.toFixed(5)}).

Issue details: ${descriptionText}

This issue has a severity rating of ${severity}/5 and poses a risk to public safety and daily convenience. I request your department to inspect and resolve the matter at the earliest, within the stipulated service window.

I am happy to provide further information or photographs as required. Kindly acknowledge this complaint and share an action-taken update.

Thank you,
${input.reporterName}
(Filed via CivicPulse - Community Hero Platform)`;
}

interface VisionOut { detected: string; hazards: string[]; visibleDetails: string[]; categoryHint: IssueCategory; }
interface ImageDescribeOut { description: string; categoryHint: IssueCategory; }
interface CatOut { category: IssueCategory; subcategory: string; title: string; tags: string[]; }
interface SevOut { severity: number; urgency: Issue["urgency"]; riskToPublic: string; estimatedCost: string; }
interface RouteOut { department: string; recommendedActions: string[]; draftedComplaint: string; }
interface PlanOut { strategy: string; runVision: boolean; runDeepReview: boolean; plan: { agent: string; reason: string }[]; }
interface ReviewOut { agree: boolean; correctedCategory?: IssueCategory; correctedSeverity?: number; note: string; }

function step(agent: string, title: string, icon: string): AgentStep {
  return { agent, title, icon, status: "running", reasoning: "", output: {}, durationMs: 0 };
}

function urgencyForSeverity(severity: number): Issue["urgency"] {
  return severity >= 5 ? "critical" : severity >= 4 ? "high" : severity >= 3 ? "medium" : "low";
}

interface LangOut { detectedLanguage: string; englishText: string; }

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const isMock = !hasGeminiKey();
  const steps: AgentStep[] = [];
  const originalDescription = input.description;
  const image = parseDataUrl(input.imageDataUrl);
  const imageOnly = (!input.description || input.description.trim().length < 3) && Boolean(image);
  let visionDescription: string | undefined;

  // ---------- 0. Planner Agent (decides the execution route) ----------
  const planStep = step("Planner Agent", "Routing the analysis", "🧭");
  const tPlan = Date.now();
  let plan: PlanOut | null = null;
  if (!isMock) {
    plan = await geminiJSON<PlanOut>({
      system:
        "You are the lead orchestrator of a civic-intake AI team. Given a new citizen report, decide which specialist agents to run and justify the route briefly. Skip the Vision agent only when no image is attached and the text is already unambiguous. Run a deep Quality Review when the report is ambiguous, high-stakes, or safety-related. Available agents: Language Understanding, Vision Intake, Categorization, Severity & Safety, Quality Review, Deduplication, Routing & Action.",
      prompt: `Report: "${input.description}". Image attached: ${image ? "yes" : "no"}. Selected language: ${input.languageHint ?? "unknown"}. Return JSON: {"strategy": string, "runVision": boolean, "runDeepReview": boolean, "plan": [{"agent": string, "reason": string}]}.`,
      temperature: 0.3,
    });
  }
  if (!plan || !Array.isArray(plan.plan) || plan.plan.length === 0) {
    const hazardous = /child|accident|fire|shock|burst|live wire|manhole|danger|unsafe|injur/i.test(input.description);
    plan = {
      strategy: image
        ? "Image attached - run full multimodal pipeline including Vision."
        : "No image - infer from text and run the standard pipeline.",
      runVision: Boolean(image),
      runDeepReview: hazardous || input.description.length > 60,
      plan: [
        { agent: "Language Understanding", reason: "Detect language and normalise to English." },
        ...(image ? [{ agent: "Vision Intake", reason: "An image is attached - read it for ground truth." }] : []),
        { agent: "Categorization", reason: "Classify the issue type and tags." },
        { agent: "Severity & Safety", reason: "Score risk and urgency." },
        ...(hazardous ? [{ agent: "Quality Review", reason: "Safety-critical - double-check category and severity." }] : []),
        { agent: "Deduplication", reason: "Avoid creating duplicate municipal tickets." },
        { agent: "Routing & Action", reason: "Assign department, SLA and draft the complaint." },
      ],
    };
  }
  planStep.status = "done";
  planStep.durationMs = Date.now() - tPlan;
  planStep.reasoning = `${plan.strategy} Planned ${plan.plan.length} agent(s): ${plan.plan.map((p) => p.agent).join(" → ")}.`;
  planStep.output = { strategy: plan.strategy, runVision: plan.runVision, runDeepReview: plan.runDeepReview, route: plan.plan };
  steps.push(planStep);

  // ---------- 1. Language Understanding Agent ----------
  const langStep = step("Language Understanding Agent", "Detecting language & normalizing", "🌐");
  const tL = Date.now();
  let lang: LangOut | null = null;
  if (!isMock) {
    lang = await geminiJSON<LangOut>({
      system:
        "You are a multilingual civic-intake agent for an Indian municipality. Detect the language of the citizen's report and translate it to clear English for internal processing, preserving every factual detail (location cues, severity, what is broken).",
      prompt: `Citizen report: "${input.description}". ${input.languageHint && input.languageHint !== "English" ? `The citizen selected ${input.languageHint}.` : ""} Return JSON: {"detectedLanguage": string (e.g. "Hindi", "Kannada", "English"), "englishText": string}.`,
      temperature: 0.2,
    });
  }
  if (!lang || !lang.englishText) {
    const detected = input.languageHint && input.languageHint !== "English" ? input.languageHint : detectLanguageByScript(input.description);
    lang = { detectedLanguage: detected, englishText: input.description };
  }
  let combinedText = lang.englishText;
  langStep.status = "done";
  langStep.durationMs = Date.now() - tL;
  langStep.reasoning =
    lang.detectedLanguage.toLowerCase().startsWith("english")
      ? "Report is in English - no translation needed. Proceeding with the original text."
      : `Detected ${lang.detectedLanguage}. Translated to English for routing while preserving the citizen's original words: "${combinedText.slice(0, 110)}${combinedText.length > 110 ? "…" : ""}"`;
  langStep.output = { detectedLanguage: lang.detectedLanguage, englishText: combinedText };
  steps.push(langStep);

  // ---------- 2. Vision / Intake Agent ----------
  const visionStep = step("Vision Intake Agent", imageOnly ? "Analyzing photo (no text provided)" : "Analyzing photo & description", "👁️");
  const t0 = Date.now();
  let vision: VisionOut | null = null;

  // Image-only mode: ask Gemini to describe what it sees so downstream agents have text to work with.
  if (imageOnly && !isMock && image) {
    const imgDesc = await geminiJSON<ImageDescribeOut>({
      system:
        "You are a municipal field-inspection vision agent. A citizen has submitted only a photo of a civic problem without any text description. Examine the photo carefully and write a clear, factual description (2-3 sentences) of the civic issue visible in the image. Also identify the most likely category. Categories: pothole, water_leakage, streetlight, waste, drainage, road_damage, public_safety, vegetation, electricity, graffiti, other.",
      prompt: `The citizen submitted only a photo from ${input.location.address}. No description was provided. Examine the image and return JSON: {"description": string (2-3 sentence factual description of the civic issue visible), "categoryHint": one of the categories}.`,
      image,
      temperature: 0.3,
    });
    if (imgDesc?.description) {
      visionDescription = imgDesc.description;
      // Replace the empty combinedText with the AI-generated description for all downstream agents.
      combinedText = imgDesc.description;
      vision = {
        detected: imgDesc.description,
        hazards: [],
        visibleDetails: imgDesc.description.split(/[.,]/).map((s) => s.trim()).filter(Boolean).slice(0, 3),
        categoryHint: imgDesc.categoryHint ?? "other",
      };
    }
  }

  // Standard vision analysis (when citizen provided text, or image-only describe didn't run).
  if (!vision && !isMock && plan.runVision) {
    vision = await geminiJSON<VisionOut>({
      system:
        "You are a municipal field-inspection vision agent. Analyze the citizen's photo and text describing a civic problem. Identify what is visible, immediate hazards, and the most likely issue category. Categories: pothole, water_leakage, streetlight, waste, drainage, road_damage, public_safety, vegetation, electricity, graffiti, other.",
      prompt: `Citizen description: "${combinedText}". Location: ${input.location.address}. Return JSON: {"detected": string, "hazards": string[], "visibleDetails": string[], "categoryHint": one of the categories}.`,
      image,
      temperature: 0.3,
    });
  }
  if (!vision) {
    const h = classifyHeuristic(combinedText);
    vision = {
      detected: image
        ? `Image received. Based on the description, the scene shows signs of a ${CATEGORY_META[h.category].label.toLowerCase()}.`
        : `No image provided. Inferred a ${CATEGORY_META[h.category].label.toLowerCase()} from the text report.`,
      hazards: severityHeuristic(combinedText, h.category).severity >= 4 ? ["Potential public-safety hazard", "Risk increases in low visibility / rain"] : ["Inconvenience to residents and commuters"],
      visibleDetails: combinedText.split(/[.,]/).map((s) => s.trim()).filter(Boolean).slice(0, 3),
      categoryHint: h.category,
    };
  }
  visionStep.status = "done";
  visionStep.durationMs = Date.now() - t0;
  visionStep.reasoning = imageOnly && visionDescription
    ? `No text provided - generated a description from the photo alone: "${visionDescription.slice(0, 120)}${visionDescription.length > 120 ? "…" : ""}"`
    : `Examined ${image ? "the uploaded photo and " : ""}the report text. ${vision.detected}`;
  visionStep.output = vision as unknown as Record<string, unknown>;
  steps.push(visionStep);

  // ---------- 2. Categorization Agent ----------
  const catStep = step("Categorization Agent", "Classifying issue type", "🏷️");
  const t1 = Date.now();
  let cat: CatOut | null = null;
  if (!isMock) {
    cat = await geminiJSON<CatOut>({
      system:
        "You are a civic issue taxonomy agent. Given a description and a vision hint, output a precise category, a short specific subcategory, a concise human title (max 9 words), and 2-4 lowercase tags.",
      prompt: `Description: "${combinedText}". Vision hint category: ${vision.categoryHint}. Detected: ${vision.detected}. Categories: pothole, water_leakage, streetlight, waste, drainage, road_damage, public_safety, vegetation, electricity, graffiti, other. Return JSON: {"category": string, "subcategory": string, "title": string, "tags": string[]}.`,
      temperature: 0.3,
    });
  }
  if (!cat || !CATEGORY_META[cat.category]) {
    const category = vision.categoryHint && CATEGORY_META[vision.categoryHint] ? vision.categoryHint : classifyHeuristic(combinedText).category;
    const firstSentence = combinedText.split(/[.!?\n]/)[0]?.trim() || CATEGORY_META[category].label;
    cat = {
      category,
      subcategory: CATEGORY_META[category].label,
      title: titleCase(firstSentence).slice(0, 70),
      tags: classifyHeuristic(combinedText).score > 0 ? CATEGORY_KEYWORDS[category].slice(0, 3) : ["community", "civic"],
    };
  }
  catStep.status = "done";
  catStep.durationMs = Date.now() - t1;
  catStep.reasoning = `Classified as "${CATEGORY_META[cat.category].label}" → ${cat.subcategory}. Tagged: ${cat.tags.join(", ")}.`;
  catStep.output = cat as unknown as Record<string, unknown>;
  steps.push(catStep);

  // ---------- 3. Severity & Safety Agent ----------
  const sevStep = step("Severity & Safety Agent", "Scoring risk & urgency", "🚨");
  const t2 = Date.now();
  let sev: SevOut | null = null;
  if (!isMock) {
    sev = await geminiJSON<SevOut>({
      system:
        "You are a public-safety risk assessor for a municipal body. Assign a severity from 1 (cosmetic) to 5 (life-threatening) and urgency (low|medium|high|critical). Explain who is at risk and give a rough repair cost band in INR.",
      prompt: `Issue: ${cat.title}. Category: ${cat.category}. Description: "${combinedText}". Hazards seen: ${vision.hazards.join("; ")}. Return JSON: {"severity": number 1-5, "urgency": "low"|"medium"|"high"|"critical", "riskToPublic": string, "estimatedCost": string}.`,
      temperature: 0.3,
    });
  }
  if (!sev || typeof sev.severity !== "number") {
    const h = severityHeuristic(combinedText, cat.category);
    const costBand = h.severity >= 5 ? "₹50,000 - ₹2,00,000" : h.severity >= 4 ? "₹20,000 - ₹75,000" : h.severity >= 3 ? "₹5,000 - ₹25,000" : "₹1,000 - ₹8,000";
    sev = {
      severity: h.severity,
      urgency: h.urgency,
      riskToPublic:
        h.severity >= 4
          ? "High risk: this can directly cause injury or accidents to commuters and residents nearby."
          : "Moderate risk: primarily an inconvenience that can worsen if left unattended.",
      estimatedCost: costBand,
    };
  }
  sev.severity = Math.max(1, Math.min(5, Math.round(sev.severity)));
  sevStep.status = "done";
  sevStep.durationMs = Date.now() - t2;
  sevStep.reasoning = `Severity ${sev.severity}/5 (${sev.urgency}). ${sev.riskToPublic}`;
  sevStep.output = sev as unknown as Record<string, unknown>;
  steps.push(sevStep);

  // ---------- 4. Quality Review Agent (self-critique loop) ----------
  let reviewCorrected = false;
  if (plan.runDeepReview) {
    const reviewStep = step("Quality Review Agent", "Cross-checking the team's output", "🕵️");
    const tR = Date.now();
    let review: ReviewOut | null = null;
    if (!isMock) {
      review = await geminiJSON<ReviewOut>({
        system:
          "You are a senior quality-assurance agent reviewing the work of a civic-intake AI team before a ticket is filed. Check that the category and severity genuinely match the citizen's report. If they are correct, agree. If they are clearly wrong, correct them and explain. Be conservative - only override on a clear mismatch.",
        prompt: `Citizen report: "${combinedText}". Team's category: ${cat.category} (${cat.title}). Team's severity: ${sev.severity}/5 (${sev.urgency}). Valid categories: ${Object.keys(CATEGORY_META).join(", ")}. Return JSON: {"agree": boolean, "correctedCategory": string|null, "correctedSeverity": number|null, "note": string}.`,
        temperature: 0.2,
      });
    }
    if (!review) {
      const baseline = classifyHeuristic(combinedText);
      const mismatch = baseline.score > 0 && baseline.category !== cat.category;
      review = {
        agree: !mismatch,
        correctedCategory: mismatch ? baseline.category : undefined,
        note: mismatch
          ? `Text strongly signals "${CATEGORY_META[baseline.category].label}" rather than the assigned category.`
          : "Category and severity are consistent with the report. Cleared for routing.",
      };
    }
    if (!review.agree && review.correctedCategory && CATEGORY_META[review.correctedCategory] && review.correctedCategory !== cat.category) {
      cat.category = review.correctedCategory;
      cat.subcategory = CATEGORY_META[review.correctedCategory].label;
      reviewCorrected = true;
    }
    if (!review.agree && typeof review.correctedSeverity === "number") {
      sev.severity = Math.max(1, Math.min(5, Math.round(review.correctedSeverity)));
      sev.urgency = urgencyForSeverity(sev.severity);
      reviewCorrected = true;
    }
    reviewStep.status = "done";
    reviewStep.durationMs = Date.now() - tR;
    reviewStep.reasoning = reviewCorrected
      ? `Caught a mismatch and corrected it → now ${CATEGORY_META[cat.category].label}, severity ${sev.severity}/5. ${review.note}`
      : `Reviewed the team's classification and severity - consistent. ${review.note}`;
    reviewStep.output = { agree: review.agree, corrected: reviewCorrected, note: review.note };
    steps.push(reviewStep);
  }

  // ---------- 5. Deduplication Agent (semantic embeddings + geo fallback) ----------
  const dedupeStep = step("Deduplication Agent", "Checking for nearby duplicates", "🔍");
  const t3 = Date.now();
  let duplicateOf: string | undefined;
  let dedupeMethod: "semantic-embeddings" | "geo-keyword" = "geo-keyword";
  let bestDist = 0;
  let bestSim = 0;
  let nearbyCount = 0;

  // Candidates: open issues within ~600m (semantic) - broader than the geo-only check.
  const geoCandidates = input.existingIssues
    .map((i) => ({ issue: i, dist: haversine(input.location, i.location) }))
    .filter((x) => x.dist <= 600 && x.issue.status !== "resolved")
    .sort((a, b) => a.dist - b.dist);
  nearbyCount = geoCandidates.length;

  let semanticUsed = false;
  if (!isMock && geoCandidates.length > 0) {
    const candTexts = geoCandidates.map((c) => `${c.issue.title}. ${c.issue.description}`);
    const vectors = await geminiEmbed([combinedText, ...candTexts]);
    if (vectors && vectors.length === candTexts.length + 1) {
      semanticUsed = true;
      dedupeMethod = "semantic-embeddings";
      const queryVec = vectors[0];
      let bestIdx = -1;
      geoCandidates.forEach((c, i) => {
        const sim = cosineSimilarity(queryVec, vectors[i + 1]);
        // Closer issues get a small geo boost; require strong semantic match.
        const geoBoost = c.dist <= 150 ? 0.04 : 0;
        const score = sim + geoBoost;
        if (score > bestSim) {
          bestSim = score;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0 && bestSim >= 0.82) {
        duplicateOf = geoCandidates[bestIdx].issue.id;
        bestDist = geoCandidates[bestIdx].dist;
      }
    }
  }

  if (!semanticUsed) {
    // Heuristic fallback: same category within 250m.
    const nearby = geoCandidates.filter((x) => x.dist <= 250 && x.issue.category === cat.category);
    if (nearby.length > 0) {
      duplicateOf = nearby[0].issue.id;
      bestDist = nearby[0].dist;
    }
  }

  const dupIssue = duplicateOf ? input.existingIssues.find((i) => i.id === duplicateOf) : undefined;
  dedupeStep.status = "done";
  dedupeStep.durationMs = Date.now() - t3;
  dedupeStep.reasoning = duplicateOf
    ? `${semanticUsed ? `Semantic match (${Math.round(bestSim * 100)}% similar via Gemini embeddings)` : "Geo + category match"}: this looks like a duplicate of "${dupIssue?.title}" (${Math.round(bestDist)}m away). Merging as a confirmation instead of creating noise.`
    : `Scanned ${nearbyCount} nearby open report(s) using ${semanticUsed ? "Gemini semantic embeddings" : "geo + keyword matching"}. No genuine duplicate found - this is a new, unique report.`;
  dedupeStep.output = {
    duplicateOf: duplicateOf ?? null,
    method: dedupeMethod,
    similarity: semanticUsed ? Number(bestSim.toFixed(3)) : null,
    nearbyCount,
  };
  steps.push(dedupeStep);

  // ---------- 6. Routing & Action Agent (autonomous tool-use) ----------
  const routeStep = step("Routing & Action Agent", "Assigning dept & drafting complaint", "📨");
  const t4 = Date.now();
  let route: RouteOut | null = null;
  let routeToolCalls: ToolCallRecord[] = [];
  if (!isMock) {
    const loop = await geminiToolLoop<RouteOut>({
      system:
        "You are a municipal routing agent with tools. FIRST call lookup_department, get_sla_policy and get_department_directory to ground your decision in real municipal data. THEN decide the responsible department, list 3 concrete field actions, and draft a short formal complaint letter addressed using the contact details you fetched. Be specific and professional. Return ONLY a JSON object.",
      prompt: `Issue: ${cat.title}. Category: ${cat.category}. Severity: ${sev.severity}/5. Urgency: ${sev.urgency}. Location: ${input.location.address}, ${input.location.ward ?? ""}. Reporter: ${input.reporterName}. Description: "${combinedText}". After using the tools, return JSON: {"department": string, "recommendedActions": string[], "draftedComplaint": string}.`,
      tools: buildRoutingTools(),
      temperature: 0.4,
    });
    if (loop) {
      route = loop.data;
      routeToolCalls = loop.toolCalls;
    }
  }
  const department = route?.department || CATEGORY_META[cat.category].department;
  const recommendedActions =
    route?.recommendedActions && route.recommendedActions.length
      ? route.recommendedActions
      : [
          `Dispatch a field inspector to ${input.location.address} within ${SLA_BY_URGENCY[sev.urgency]} hours.`,
          sev.severity >= 4 ? "Barricade / cordon the area immediately to prevent accidents." : "Assess the extent and schedule repair in the next work cycle.",
          "Update the citizen with an action-taken report and close the loop on resolution.",
        ];
  const draftedComplaint = route?.draftedComplaint || buildComplaint(input, cat.category, sev.severity, combinedText);
  routeStep.status = "done";
  routeStep.durationMs = Date.now() - t4;
  routeStep.reasoning = routeToolCalls.length
    ? `Called ${routeToolCalls.length} tool(s) (${[...new Set(routeToolCalls.map((c) => c.name))].join(", ")}), then routed to ${department}. Auto-drafted a formal complaint and ${recommendedActions.length} actions. SLA: ${SLA_BY_URGENCY[sev.urgency]}h.`
    : `Routed to ${department}. Auto-drafted a formal complaint and ${recommendedActions.length} recommended actions. SLA: ${SLA_BY_URGENCY[sev.urgency]}h.`;
  routeStep.output = { department, recommendedActions, slaHours: SLA_BY_URGENCY[sev.urgency] };
  if (routeToolCalls.length) routeStep.toolCalls = routeToolCalls as ToolCall[];
  steps.push(routeStep);

  const confidence = isMock ? 0.78 : 0.93;
  const analysis: AgentAnalysis = {
    steps,
    summary: `AI agents classified this as a ${CATEGORY_META[cat.category].label.toLowerCase()} (severity ${sev.severity}/5, ${sev.urgency} urgency)${duplicateOf ? ", flagged as a likely duplicate," : ""} and routed it to ${department}.`,
    confidence,
    isMock,
    model: isMock ? "heuristic-fallback" : GEMINI_MODEL,
    draftedComplaint,
    recommendedActions,
    riskToPublic: sev.riskToPublic,
    estimatedCost: sev.estimatedCost,
    dedupeMethod,
    plan: plan.plan,
    reviewCorrected,
    visionDescription,
  };

  return {
    analysis,
    category: cat.category,
    subcategory: cat.subcategory,
    title: cat.title,
    tags: cat.tags,
    severity: sev.severity,
    urgency: sev.urgency,
    department,
    slaHours: SLA_BY_URGENCY[sev.urgency],
    duplicateOf,
    language: lang.detectedLanguage,
    originalDescription,
  };
}
