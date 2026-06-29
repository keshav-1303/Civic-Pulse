export function timeAgo(iso: string): string {
  const date = new Date(iso).getTime();
  const diff = Date.now() - date;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  high: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  medium: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  low: "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
};
