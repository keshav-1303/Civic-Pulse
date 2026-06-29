"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-500">
        An unexpected error occurred. You can try again, or head back to safety.
      </p>
      {error?.digest && <p className="mt-2 font-mono text-xs text-ink-400">Ref: {error.digest}</p>}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="btn-ghost">
          <Home className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
