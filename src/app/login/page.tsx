"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, User, Loader2, LogIn } from "lucide-react";
import { PERSONAS, type Role } from "@/lib/roles";

const ROLE_ICON: Record<Role, typeof User> = {
  citizen: User,
  staff: ShieldCheck,
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const reason = params.get("reason");
  const [loading, setLoading] = useState<string | null>(null);

  async function pick(personaId: string) {
    setLoading(personaId);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personaId }),
      });
      router.push(next);
      router.refresh();
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <LogIn className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Choose how to sign in</h1>
        <p className="mt-2 text-ink-500">
          CivicPulse uses role-based access control. Pick a demo persona to explore the matching
          permissions.
        </p>
      </div>

      {reason === "staff" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          The Municipal Co-pilot is restricted to municipal staff. Sign in as Staff or Admin to continue.
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {PERSONAS.map((p) => {
          const Icon = ROLE_ICON[p.role];
          const isStaff = p.role !== "citizen";
          return (
            <button
              key={p.sub}
              onClick={() => pick(p.sub)}
              disabled={loading !== null}
              className="card flex items-center gap-4 p-5 text-left transition hover:border-brand-300 hover:shadow-glow disabled:opacity-60"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isStaff
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                    : "bg-ink-100 text-ink-600"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className="chip bg-ink-100 text-[10px] uppercase tracking-wide text-ink-500">{p.role}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">{p.description}</p>
              </div>
              {loading === p.sub ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              ) : (
                <span className="text-sm font-semibold text-brand-600">Continue</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Demo authentication only. In production this would be a real identity provider.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
