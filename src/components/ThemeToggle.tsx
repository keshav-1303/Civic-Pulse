"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getTheme, toggleTheme, THEME_EVENT, type Theme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(getTheme());
    const handler = () => setTheme(getTheme());
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(toggleTheme())}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`glass-control flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 ${className}`}
    >
      {/* Avoid hydration mismatch: render a stable icon until mounted */}
      {!mounted ? <Sun className="h-4 w-4" /> : isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
