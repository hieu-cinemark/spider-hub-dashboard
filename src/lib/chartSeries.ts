import type { TimeseriesPoint } from "@/lib/types";

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// cinemark-api's /stats/*timeseries only returns days that actually have
// rows - a day with zero posts is simply missing, which made line charts
// silently bridge the gap (Sep 26 vanished from the x-axis instead of
// reading as a 0). Every chart over these series goes through this so the
// axis always shows the full window, ending today.
export function dayWindow(days: number, points: TimeseriesPoint[] = []): string[] {
  const out = new Set<string>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.add(isoDay(d));
  }
  for (const row of points) out.add(row.day);
  return Array.from(out).sort();
}

export function sumByDay(points: TimeseriesPoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of points) {
    totals.set(row.day, (totals.get(row.day) ?? 0) + row.count);
  }
  return totals;
}

// Chart-only platform colors. PLATFORM_META's brand colors are fine for
// icons, but TikTok's #00F2EA cyan has almost no contrast against the cream
// card background and Threads' #000 disappears in dark mode - both matter
// a lot more for a filled area/line than for a 14px icon.
export function platformChartColor(platform: string, isDark: boolean): string {
  switch (platform) {
    case "facebook":
      return isDark ? "#60a5fa" : "#1d4ed8";
    case "threads":
      return isDark ? "#e5e7eb" : "#334155";
    case "tiktok":
      return isDark ? "#22d3ee" : "#0891b2";
    case "instagram":
      return isDark ? "#f472b6" : "#c026d3";
    default:
      return "#8c8c8c";
  }
}

export const METRIC_CHART_COLOR = {
  posts: "#4f46e5",
  comments: "#d97706",
} as const;
