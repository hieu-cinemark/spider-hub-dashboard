import {
  FacebookFilled,
  GlobalOutlined,
  InstagramFilled,
  ThreadsFilled,
  TikTokFilled,
} from "@ant-design/icons";
import type { CSSProperties } from "react";

// Display metadata for platforms that can show up in the `posts` table.
// facebook/threads/tiktok are fed by spider-hub itself (via Kafka ->
// cinemark-api's ingest consumer -> D1); instagram would only show up here
// because it shares the same D1 database with cinemark-scraper's own
// Worker. Anything not listed still renders fine (GlobalOutlined, neutral
// gray) - this is a display hint, not an allowlist.
export const PLATFORM_META: Record<string, { label: string; color: string; source: string }> = {
  facebook: { label: "Facebook", color: "#1877F2", source: "spider-hub" },
  threads: { label: "Threads", color: "#000000", source: "spider-hub" },
  // TikTok's real mark has no single brand color (it's a black/cyan/pink
  // duotone), but reusing Threads' black here made the two indistinguishable
  // wherever both show up side by side (the "all platforms" timeseries
  // chart, the Posts platform tag) - standing in with TikTok's cyan accent
  // instead keeps every platform visually distinct.
  tiktok: { label: "TikTok", color: "#00F2EA", source: "spider-hub" },
};

export function platformLabel(platform: string): string {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformColor(platform: string): string {
  return PLATFORM_META[platform]?.color ?? "#8c8c8c";
}

// Threads' mark is black. On dark cards/buttons that reads as "missing
// icon", so UI chrome uses --threads-ink (cream in dark mode). Charts
// still use the hex from platformColor so G2 gets a real paint color.
export function platformCssColor(platform: string): string {
  return platform === "threads" ? "var(--threads-ink)" : platformColor(platform);
}

export function platformCssSoftBg(platform: string): string {
  return `color-mix(in srgb, ${platformCssColor(platform)} 20%, transparent)`;
}

// A soft ~10%-opacity tint of a platform's color, for an icon badge's
// background (icon itself stays the solid color) - works for every
// platform color regardless of how light or dark it is, unlike a solid
// background with a white icon (TikTok's cyan is too light for white to
// read against it). Every PLATFORM_META color (and the gray fallback) is a
// 6-digit hex, so appending a 2-digit alpha suffix is always valid.
export function platformSoftBg(platform: string): string {
  return platformCssSoftBg(platform);
}

// Builds a G2 (@ant-design/plots) `scale.color` domain/range pair so a
// chart's colorField lines up with the same colors used everywhere else in
// the dashboard (StatCard icons, the Posts platform tag) - instead of
// leaving color assignment to the chart library's own default categorical
// palette, which has no idea these platforms already have fixed colors.
export function platformColorScale(rawPlatforms: string[]): { domain: string[]; range: string[] } {
  const unique = Array.from(new Set(rawPlatforms));
  return { domain: unique.map(platformLabel), range: unique.map(platformColor) };
}

// "YYYY-MM-DD" (as returned by cinemark-api's timeseries endpoint) ->
// "Aug 28" - 14 full ISO dates crammed onto one chart's x-axis is the kind
// of thing that's technically correct but unreadable.
export function formatShortDay(day: string): string {
  const parsed = new Date(`${day}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function platformSource(platform: string): string {
  return PLATFORM_META[platform]?.source ?? "unknown";
}

// A switch over statically-named icon components (rather than picking a
// component reference out of a lookup table and rendering `<Icon />`) so
// each branch is a stable, module-level component the React Compiler can
// verify - not a fresh identity that risks losing state every render.
export function PlatformIcon({
  platform,
  className,
  style,
}: {
  platform: string;
  className?: string;
  style?: CSSProperties;
}) {
  switch (platform) {
    case "facebook":
      return <FacebookFilled className={className} style={style} />;
    case "threads":
      return <ThreadsFilled className={["threads-mark", className].filter(Boolean).join(" ")} style={style} />;
    case "tiktok":
      return <TikTokFilled className={className} style={style} />;
    case "instagram":
      return <InstagramFilled className={className} style={style} />;
    default:
      return <GlobalOutlined className={className} style={style} />;
  }
}
