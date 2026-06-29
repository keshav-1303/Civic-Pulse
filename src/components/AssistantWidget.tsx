"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "How do I report a pothole?",
  "What's the resolution rate?",
  "Which areas are hotspots?",
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Hero 🦸 - your civic AI assistant. Ask me to help report a problem, track a report, or surface what's happening in your neighbourhood.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    const next = [...messages, { role: "user" as const, content: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Sorry, I couldn't respond." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_12px_30px_-6px_rgba(10,147,107,0.7)] transition-transform hover:scale-105"
        aria-label="Open assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="glass-strong fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl shadow-2xl animate-fade-up">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">🦸</div>
            <div className="leading-tight">
              <div className="text-sm font-bold">Hero - Civic Assistant</div>
              <div className="flex items-center gap-1 text-[11px] text-white/80">
                <Sparkles className="h-3 w-3" /> Powered by Gemini
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-thin bg-ink-50/30 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm glass-control text-ink-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm glass-control px-3.5 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-300" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="glass-control rounded-full px-3 py-1.5 text-xs text-ink-600 hover:border-brand-300 hover:text-brand-700">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink-100 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Hero anything…"
              className="glass-control flex-1 rounded-xl px-3 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            />
            <button type="submit" disabled={loading} className="btn-primary !px-3 !py-2">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
