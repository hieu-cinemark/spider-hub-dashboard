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
  tiktok: { label: "TikTok", color: "#000000", source: "spider-hub" },
  instagram: { label: "Instagram", color: "#E1306C", source: "cinemark-scraper" },
};

export function platformLabel(platform: string): string {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformColor(platform: string): string {
  return PLATFORM_META[platform]?.color ?? "#8c8c8c";
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
      return <ThreadsFilled className={className} style={style} />;
    case "tiktok":
      return <TikTokFilled className={className} style={style} />;
    case "instagram":
      return <InstagramFilled className={className} style={style} />;
    default:
      return <GlobalOutlined className={className} style={style} />;
  }
}
