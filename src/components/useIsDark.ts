"use client";

import { useEffect, useState } from "react";
import { getTheme, THEME_EVENT } from "@/lib/theme";

/** Reactive boolean that tracks the current dark-mode state (for canvas/SVG that can't use CSS vars). */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getTheme() === "dark");
    const handler = () => setDark(getTheme() === "dark");
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  return dark;
}
