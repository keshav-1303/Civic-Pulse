export interface LangOption {
  code: string; // BCP-47 for speech recognition
  label: string;
  native: string;
}

// Common languages for a hyperlocal Indian deployment.
export const LANGUAGES: LangOption[] = [
  { code: "en-IN", label: "English", native: "English" },
  { code: "hi-IN", label: "Hindi", native: "हिन्दी" },
  { code: "kn-IN", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta-IN", label: "Tamil", native: "தமிழ்" },
  { code: "te-IN", label: "Telugu", native: "తెలుగు" },
  { code: "mr-IN", label: "Marathi", native: "मराठी" },
  { code: "bn-IN", label: "Bengali", native: "বাংলা" },
  { code: "gu-IN", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ml-IN", label: "Malayalam", native: "മലയാളം" },
  { code: "pa-IN", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

interface ScriptRange {
  name: string;
  re: RegExp;
}

const SCRIPTS: ScriptRange[] = [
  { name: "Hindi", re: /[\u0900-\u097F]/ },
  { name: "Bengali", re: /[\u0980-\u09FF]/ },
  { name: "Gurmukhi (Punjabi)", re: /[\u0A00-\u0A7F]/ },
  { name: "Gujarati", re: /[\u0A80-\u0AFF]/ },
  { name: "Tamil", re: /[\u0B80-\u0BFF]/ },
  { name: "Telugu", re: /[\u0C00-\u0C7F]/ },
  { name: "Kannada", re: /[\u0C80-\u0CFF]/ },
  { name: "Malayalam", re: /[\u0D00-\u0D7F]/ },
];

/** Heuristic script-based language detection (used as a fallback when Gemini isn't available). */
export function detectLanguageByScript(text: string): string {
  for (const s of SCRIPTS) {
    if (s.re.test(text)) return s.name;
  }
  return "English";
}
