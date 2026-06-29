"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Map, ListChecks, Trophy, Plus, Menu, X, Shield, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { canViewCopilot, ROLE_LABEL, type SessionUser } from "@/lib/roles";

const LINKS = [
  { href: "/map", label: "Live Map", icon: Map, staffOnly: false },
  { href: "/issues", label: "Issues", icon: ListChecks, staffOnly: false },
  { href: "/dashboard", label: "Impact", icon: LayoutDashboard, staffOnly: false },
  { href: "/leaderboard", label: "Heroes", icon: Trophy, staffOnly: false },
  { href: "/admin", label: "Co-pilot", icon: Shield, staffOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ai, setAi] = useState<{ aiEnabled: boolean; model: string } | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => setAi({ aiEnabled: d.aiEnabled, model: d.model }))
      .catch(() => {});
  }, []);

  // Refetch session on navigation so login/logout is reflected without a full reload.
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setSession(d.session ?? null))
      .catch(() => {});
  }, [pathname]);

  const isStaff = canViewCopilot(session?.role);
  const links = LINKS.filter((l) => !l.staffOnly || isStaff);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    setSession(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="glass-bar sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_8px_20px_-6px_rgba(10,147,107,0.7)]">
            <Activity className="h-5 w-5" />
            <span className="absolute inset-0 rounded-xl ring-2 ring-brand-400/40 animate-pulse-ring" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Civic<span className="text-brand-600">Pulse</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                }`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {ai && (
            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium lg:inline-flex ${
                ai.aiEnabled ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              }`}
              title={ai.aiEnabled ? `Gemini live: ${ai.model}` : "Demo mode - add GEMINI_API_KEY for live Gemini"}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${ai.aiEnabled ? "bg-brand-500" : "bg-amber-500"}`} />
              {ai.aiEnabled ? "Gemini live" : "Demo AI"}
            </span>
          )}

          {session ? (
            <span className="hidden items-center gap-1.5 rounded-full glass-control py-1 pl-2.5 pr-1 text-xs font-medium text-ink-600 sm:inline-flex" title={session.name}>
              <span className={`h-1.5 w-1.5 rounded-full ${isStaff ? "bg-brand-500" : "bg-ink-400"}`} />
              {ROLE_LABEL[session.role]}
              <button onClick={signOut} aria-label="Sign out" title="Sign out" className="ml-0.5 rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <Link href="/login" className="hidden items-center gap-1.5 rounded-full glass-control px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-700 sm:inline-flex">
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}

          <ThemeToggle />
          <NotificationBell />
          <Link href="/report" className="btn-primary hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Report Issue
          </Link>
          <button className="md:hidden rounded-lg p-2 text-ink-600" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-bar border-x-0 border-b-0 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <Link href="/report" onClick={() => setOpen(false)} className="btn-primary mt-1">
              <Plus className="h-4 w-4" /> Report Issue
            </Link>
            {session ? (
              <button onClick={signOut} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100">
                <LogOut className="h-4 w-4" /> Sign out ({ROLE_LABEL[session.role]})
              </button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
