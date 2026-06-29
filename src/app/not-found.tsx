import Link from "next/link";
import { Compass, Home, Plus } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Compass className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">This page took a wrong turn</h1>
      <p className="mt-2 max-w-md text-ink-500">
        The page you are looking for does not exist or may have moved. Let us get you back on track.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" /> Back home
        </Link>
        <Link href="/report" className="btn-ghost">
          <Plus className="h-4 w-4" /> Report an issue
        </Link>
      </div>
    </div>
  );
}
