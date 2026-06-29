import type { Badge, User } from "./types";

export const POINTS = {
  report: 50,
  verifiedReport: 30,
  confirmation: 10,
  resolved: 100,
} as const;

export const BADGES: Record<string, Badge> = {
  first_report: { id: "first_report", label: "First Responder", icon: "🚀", description: "Filed your first community report" },
  watchdog: { id: "watchdog", label: "Neighborhood Watchdog", icon: "🐕", description: "Verified 5+ community reports" },
  fixer: { id: "fixer", label: "City Fixer", icon: "🔧", description: "Had 3+ reports resolved" },
  hotspot_hunter: { id: "hotspot_hunter", label: "Hotspot Hunter", icon: "🎯", description: "Reported in 3+ different wards" },
  guardian: { id: "guardian", label: "Civic Guardian", icon: "🛡️", description: "Reached Level 5" },
  hero: { id: "hero", label: "Community Hero", icon: "🦸", description: "Earned 1000+ impact points" },
};

const LEVELS = [0, 100, 300, 600, 1000, 1600, 2400, 3400, 4600, 6000];

export function levelForPoints(points: number): number {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i]) level = i + 1;
  }
  return level;
}

export function levelProgress(points: number): {
  level: number;
  current: number;
  next: number | null;
  pct: number;
} {
  const level = levelForPoints(points);
  const floor = LEVELS[level - 1] ?? 0;
  const next = LEVELS[level] ?? null;
  const pct = next === null ? 100 : Math.round(((points - floor) / (next - floor)) * 100);
  return { level, current: points - floor, next: next === null ? null : next - floor, pct };
}

export function recomputeUser(user: User): User {
  const level = levelForPoints(user.points);
  return { ...user, level };
}
