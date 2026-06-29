"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, Medal, Award, Flame } from "lucide-react";
import type { User } from "@/lib/types";
import { levelProgress } from "@/lib/gamification";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentId, setCurrentId] = useState("u_you");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users); setCurrentId(d.currentUserId); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-ink-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const me = users.find((u) => u.id === currentId);
  const podium = users.slice(0, 3);
  const rest = users.slice(3);
  const prog = me ? levelProgress(me.points) : null;

  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
  const heights = ["h-24", "h-32", "h-20"];
  const medals = ["#c0c0c0", "#ffd700", "#cd7f32"];
  const rankOf = (u: User) => users.findIndex((x) => x.id === u.id) + 1;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Community Heroes</h1>
        <p className="mt-1 text-ink-500">Earn impact points for reporting, verifying and resolving issues.</p>
      </div>

      {/* Your card */}
      {me && prog && (
        <div className="card mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                {me.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm text-brand-50">Your rank</div>
                <div className="text-2xl font-bold">#{rankOf(me)} · {me.name}</div>
                <div className="mt-1 text-sm text-brand-50">Level {me.level} · {me.points} impact points</div>
              </div>
              <Trophy className="h-10 w-10 text-white/70" />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-brand-50">
                <span>Level {me.level}</span>
                <span>{prog.next === null ? "Max level" : `${prog.next - prog.current} pts to Level ${me.level + 1}`}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${prog.pct}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="label">Badges</span>
            <div className="flex flex-wrap gap-2">
              {me.badges.map((b) => (
                <span key={b.id} className="chip border border-ink-100 bg-ink-50 text-ink-600" title={b.description}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      <div className="mb-8 flex items-end justify-center gap-3 sm:gap-6">
        {podiumOrder.map((u, idx) => {
          const actualRank = rankOf(u);
          return (
            <div key={u.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg" style={{ backgroundColor: u.avatarColor }}>
                  {u.name.charAt(0)}
                </div>
                <span className="glass-strong absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow" style={{ color: medals[idx] }}>
                  {actualRank}
                </span>
              </div>
              <div className="text-sm font-semibold text-ink-900">{u.name}</div>
              <div className="text-xs text-ink-400">{u.points} pts</div>
              <div className={`mt-2 w-20 rounded-t-xl ${heights[idx]} flex items-start justify-center pt-2`} style={{ background: `linear-gradient(180deg, ${medals[idx]}40, ${medals[idx]}10)` }}>
                <Medal className="h-6 w-6" style={{ color: medals[idx] }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest */}
      <div className="card divide-y divide-ink-100">
        {rest.map((u) => (
          <div key={u.id} className={`flex items-center gap-4 p-4 ${u.id === currentId ? "bg-brand-50/40 dark:bg-brand-500/10" : ""}`}>
            <span className="w-6 text-center font-bold text-ink-400">{rankOf(u)}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: u.avatarColor }}>
              {u.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink-900">{u.name}</div>
              <div className="flex items-center gap-3 text-xs text-ink-400">
                <span>Level {u.level}</span>
                <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {u.reportsCount} reports</span>
                <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {u.resolvedCount} resolved</span>
              </div>
            </div>
            <div className="flex -space-x-1">
              {u.badges.slice(0, 4).map((b) => (
                <span key={b.id} className="flex h-7 w-7 items-center justify-center rounded-full border border-surface bg-ink-50 text-sm" title={b.label}>
                  {b.icon}
                </span>
              ))}
            </div>
            <div className="w-16 text-right font-bold text-brand-600">{u.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
