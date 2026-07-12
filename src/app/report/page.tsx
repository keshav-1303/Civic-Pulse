"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Crosshair,
  FileText,
  AlertTriangle,
  Copy,
  Sparkles,
  Layers,
  Mic,
  Languages,
  X,
} from "lucide-react";
import { fileToDataUrl } from "@/lib/format";
import { LANGUAGES } from "@/lib/language";
import type { AgentAnalysis, AgentStep, Issue } from "@/lib/types";
import { AiBadge, CategoryChip, SeverityDots, UrgencyChip } from "@/components/ui";
import { BENGALURU_LOCATIONS, haversine } from "@/lib/geo";

type Phase = "form" | "analyzing" | "done";

interface ReportResponse {
  duplicate: boolean;
  issue?: Issue;
  mergedInto?: Issue;
  analysis: AgentAnalysis;
  pointsAwarded: number;
}

const EXAMPLES = [
  "Huge pothole in the middle of the road, bikes keep skidding especially after rain.",
  "Streetlight has been off for a week, the whole lane is pitch dark and unsafe at night.",
  "Garbage pile overflowing for days, terrible smell and stray dogs everywhere.",
  "Open manhole on the footpath with no cover - someone could fall in.",
];

export default function ReportPage() {
  const [phase, setPhase] = useState<Phase>("form");
  const [description, setDescription] = useState("");
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [ward, setWard] = useState("");
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [locating, setLocating] = useState(false);

  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [visible, setVisible] = useState(0);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => d.city && setCity({ lat: d.city.lat, lng: d.city.lng }))
      .catch(() => {});
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(Boolean(SR));
    }
  }, []);

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = lang.code;
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = description ? description + " " : "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setDescription((finalText + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      console.warn("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access in your browser's address bar settings.");
      } else if (e.error === "no-speech") {
        setError("No speech was detected. Please try speaking closer to your microphone.");
      } else if (e.error === "network") {
        setError("Network error: Google speech recognition service could not be reached.");
      } else {
        setError(`Voice recognition failed: ${e.error}`);
      }
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setError("");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newUrls.push(await fileToDataUrl(files[i]));
    }
    setImageDataUrls((prev) => [...prev, ...newUrls]);
    // Reset input so re-selecting the same file works
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageDataUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function detectLocation() {
    setLocating(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter your area manually.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detectedCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const res = await fetch(`/api/geocode?lat=${detectedCoords.lat}&lng=${detectedCoords.lng}`);
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Failed to resolve location.");
            setLocating(false);
            return;
          }
          setCoords(detectedCoords);
          setWard(data.area);
          if (data.address && !address) {
            setAddress(data.address);
          }
        } catch (err) {
          setError("Failed to resolve location. Please choose manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Failed to detect location. Please verify browser location permissions or choose manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  const PLACEHOLDER_AGENTS = [
    { agent: "Planner Agent", icon: "🧭", title: "Routing the analysis" },
    { agent: "Language Understanding Agent", icon: "🌐", title: "Detecting language & normalizing" },
    { agent: "Vision Intake Agent", icon: "👁️", title: "Analyzing photo & description" },
    { agent: "Categorization Agent", icon: "🏷️", title: "Classifying issue type" },
    { agent: "Severity & Safety Agent", icon: "🚨", title: "Scoring risk & urgency" },
    { agent: "Quality Review Agent", icon: "🕵️", title: "Cross-checking the team's output" },
    { agent: "Deduplication Agent", icon: "🔍", title: "Checking for nearby duplicates" },
    { agent: "Routing & Action Agent", icon: "📨", title: "Assigning dept & drafting complaint" },
  ];

  async function submit() {
    setError("");
    if (description.trim().length < 8 && imageDataUrls.length === 0) {
      setError("Please describe the issue or add a photo so our AI can identify the problem.");
      return;
    }
    if (!ward.trim()) {
      setError("Please specify a ward or area.");
      return;
    }
    const location = {
      lat: coords?.lat ?? city.lat + (Math.random() - 0.5) * 0.02,
      lng: coords?.lng ?? city.lng + (Math.random() - 0.5) * 0.02,
      address: address.trim() || ward,
      ward,
    };

    setPhase("analyzing");
    setVisible(0);
    setSteps([]);

    // Visual: cycle through placeholder agents while the real pipeline runs.
    let i = 0;
    cycleRef.current = setInterval(() => {
      i = Math.min(i + 1, PLACEHOLDER_AGENTS.length);
      setVisible(i);
    }, 650);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          imageDataUrl: imageDataUrls[0] || undefined,
          imageDataUrls: imageDataUrls.length > 0 ? imageDataUrls : undefined,
          location,
          language: lang.label,
        }),
      });
      const data: ReportResponse = await res.json();
      if (cycleRef.current) clearInterval(cycleRef.current);

      const realSteps = data.analysis.steps;
      setSteps(realSteps);
      // Reveal real steps one-by-one for the "watch agents reason" effect.
      for (let s = 0; s <= realSteps.length; s++) {
        setVisible(s);
        await new Promise((r) => setTimeout(r, 520));
      }
      setResult(data);
      setPhase("done");
    } catch {
      if (cycleRef.current) clearInterval(cycleRef.current);
      setError("Something went wrong analyzing your report. Please try again.");
      setPhase("form");
    }
  }

  function reset() {
    setPhase("form");
    setDescription("");
    setImageDataUrls([]);
    setAddress("");
    setCoords(null);
    setResult(null);
    setSteps([]);
    setVisible(0);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Report a community issue</h1>
        <p className="mt-2 text-ink-500">
          Add a photo and a short description. Our AI agent team handles categorization, risk scoring, duplicate
          detection and routing - automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: form */}
        <div className={`card p-6 ${phase !== "form" ? "opacity-60 pointer-events-none" : ""}`}>
          <label className="label">Photos or Videos (a file alone is enough — AI auto-describes the issue)</label>
          {imageDataUrls.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {imageDataUrls.map((url, i) => {
                const isVideo = url.startsWith("data:video/");
                return (
                  <div key={i} className="relative shrink-0">
                    {isVideo ? (
                      <video src={url} className="h-24 w-24 rounded-xl object-cover border border-ink-200" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`preview ${i + 1}`} className="h-24 w-24 rounded-xl object-cover border border-ink-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/60 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/40">
            <Camera className="h-7 w-7" />
            <span className="text-sm font-medium">{imageDataUrls.length > 0 ? "Add more files" : "Tap to add photos/videos"}</span>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFile} />
          </label>

          <div className="mt-5 flex items-center justify-between">
            <label className="label">Describe the issue</label>
            <div className="flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-ink-400" />
              <select
                value={lang.code}
                onChange={(e) => setLang(LANGUAGES.find((l) => l.code === e.target.value) ?? LANGUAGES[0])}
                className="glass-control rounded-lg px-2 py-1 text-xs font-medium text-ink-600 focus:border-brand-400 focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.native}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative mt-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={lang.code === "en-IN" ? "e.g. There's a deep pothole near the bus stop that fills with water…" : `Type or speak in ${lang.native}…`}
              className="input resize-none pr-12"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                title={`Speak in ${lang.native}`}
                className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  listening ? "bg-red-500 text-white animate-pulse" : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
          {listening && <p className="mt-1 text-xs font-medium text-red-500">🎙️ Listening in {lang.native}… tap the mic to stop.</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="glass-control rounded-full px-2.5 py-1 text-[11px] text-ink-500 hover:border-brand-300 hover:text-brand-700"
              >
                {ex.slice(0, 34)}…
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ward / Area</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru"
                className="input mt-2"
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <button onClick={detectLocation} className="btn-ghost mt-2 w-full">
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                {coords ? "Located ✓" : "Detect"}
              </button>
            </div>
          </div>
          <label className="label mt-4 block">Address / landmark</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 4th Main, near the metro station"
            className="input mt-2"
          />

          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}

          <button onClick={submit} className="btn-primary mt-6 w-full py-3 text-base">
            <Sparkles className="h-4 w-4" /> Run AI agents & submit
          </button>
        </div>

        {/* Right: agent console / result */}
        <div className="card flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-ink-900">
              <Layers className="h-4 w-4 text-brand-600" /> Agent Console
            </h2>
            {result && <AiBadge mock={result.analysis.isMock} model={result.analysis.model} />}
          </div>

          {phase === "form" && (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-ink-400">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="max-w-xs text-sm">
                Submit a report to watch a team of specialized AI agents plan, reason and act on it step-by-step in
                real time.
              </p>
            </div>
          )}

          {(phase === "analyzing" || phase === "done") && (
            <div className="space-y-3">
              {(steps.length ? steps : PLACEHOLDER_AGENTS).map((s, idx) => {
                const real = steps.length > 0 ? (s as AgentStep) : null;
                const isVisible = idx < visible;
                const isActive = idx === visible && phase === "analyzing";
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isVisible
                        ? "border-brand-200 bg-brand-50/40 dark:border-brand-500/20 dark:bg-brand-500/10"
                        : isActive
                        ? "border-brand-300 glass-strong shadow-glow"
                        : "border-ink-100 bg-ink-50/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="glass-control flex h-8 w-8 items-center justify-center rounded-lg text-base shadow-sm">
                        {(s as { icon: string }).icon}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink-900">{(s as { agent: string }).agent}</div>
                        <div className="text-xs text-ink-400">{(s as { title: string }).title}</div>
                      </div>
                      {isVisible ? (
                        <CheckCircle2 className="h-5 w-5 text-brand-600" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-ink-200" />
                      )}
                    </div>
                    {real && isVisible && (
                      <p className="mt-2 border-l-2 border-brand-200 pl-3 text-xs leading-relaxed text-ink-600 animate-fade-up">
                        {real.reasoning}
                      </p>
                    )}
                    {real && isVisible && real.toolCalls && real.toolCalls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pl-3 animate-fade-up">
                        {real.toolCalls.map((tc, ti) => (
                          <span
                            key={ti}
                            title={`args: ${JSON.stringify(tc.args)}`}
                            className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[10px] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300"
                          >
                            🔧 {tc.name}()
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {phase === "done" && result && <ResultPanel result={result} onReset={reset} />}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: ReportResponse; onReset: () => void }) {
  const [showComplaint, setShowComplaint] = useState(false);
  const [copied, setCopied] = useState(false);
  const issue = result.issue ?? result.mergedInto;
  if (!issue) return null;

  return (
    <div className="mt-5 border-t border-ink-100 pt-5 animate-fade-up">
      {result.duplicate ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <strong>Smart merge:</strong> our Deduplication Agent found this matches an existing nearby report, so we
          added your voice as a confirmation instead of creating a duplicate. <strong>+{result.pointsAwarded} points</strong>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
          <strong>Report filed & routed!</strong> You earned <strong>+{result.pointsAwarded} impact points</strong>. 🎉
        </div>
      )}

      <h3 className="font-bold leading-snug text-ink-900">{issue.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CategoryChip category={issue.category} />
        <UrgencyChip urgency={issue.urgency} />
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          Severity <SeverityDots value={issue.severity} />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-ink-50 p-2.5">
          <div className="label">Routed to</div>
          <div className="mt-0.5 font-semibold text-ink-800">{issue.department}</div>
        </div>
        <div className="rounded-lg bg-ink-50 p-2.5">
          <div className="label">Target SLA</div>
          <div className="mt-0.5 font-semibold text-ink-800">{issue.slaHours} hours</div>
        </div>
      </div>

      {result.analysis.recommendedActions?.length > 0 && (
        <div className="mt-3">
          <div className="label">Recommended actions</div>
          <ul className="mt-1.5 space-y-1">
            {result.analysis.recommendedActions.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink-600">
                <span className="mt-0.5 text-brand-600">▸</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setShowComplaint((v) => !v)} className="btn-ghost mt-4 w-full text-sm">
        <FileText className="h-4 w-4" /> {showComplaint ? "Hide" : "View"} auto-drafted complaint letter
      </button>
      {showComplaint && (
        <div className="relative mt-2">
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-100 bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-700 scrollbar-thin">
            {result.analysis.draftedComplaint}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.analysis.draftedComplaint);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="glass-control absolute right-2 top-2 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-600 shadow-sm hover:text-brand-700"
          >
            <Copy className="mr-1 inline h-3 w-3" /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Link href={`/issues/${issue.id}`} className="btn-primary flex-1">
          View issue <ArrowRight className="h-4 w-4" />
        </Link>
        <button onClick={onReset} className="btn-ghost">
          Report another
        </button>
      </div>
    </div>
  );
}
