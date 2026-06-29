"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/notifications";

const TONE_BORDER: Record<string, string> = {
  info: "border-l-sky-400",
  success: "border-l-brand-500",
  warning: "border-l-amber-400",
  danger: "border-l-red-500",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const d = await res.json();
      setItems(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch {
      // ignore - bell stays empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setUnread(0);
        }}
        className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-strong absolute right-0 mt-2 w-80 overflow-hidden rounded-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-ink-800">Notifications</span>
            <span className="text-xs text-ink-400">Your reports</span>
          </div>
          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-ink-300">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-400">
                No updates yet. Report an issue to start tracking it here.
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={`/issues/${n.issueId}`}
                  onClick={() => setOpen(false)}
                  className={`flex gap-2.5 border-l-4 ${TONE_BORDER[n.tone] ?? TONE_BORDER.info} px-4 py-3 hover:bg-ink-50`}
                >
                  <span className="text-base leading-none">{n.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">{n.title}</p>
                    <p className="truncate text-xs text-ink-500">{n.issueTitle}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">{timeAgo(n.at)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
