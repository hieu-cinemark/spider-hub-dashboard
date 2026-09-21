import { Tooltip } from "antd";
import { PlatformIcon, platformColor, platformLabel, platformSoftBg } from "@/lib/platform";

// A platform's icon in a soft-tinted rounded-square badge, optionally with
// its label alongside - the shared "which platform is this row/card about"
// visual used in tables and stat cards, instead of every table inventing
// its own <Tag>/icon combination.
export default function PlatformBadge({
  platform,
  label,
  showLabel = true,
  size = 28,
}: {
  platform: string;
  /** Override the displayed label - e.g. "All (shared)" for a proxy row that isn't tied to one platform. */
  label?: string;
  showLabel?: boolean;
  size?: number;
}) {
  const badge = (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-lg"
        style={{
          width: size,
          height: size,
          backgroundColor: platformSoftBg(platform),
          color: platformColor(platform),
          fontSize: Math.round(size * 0.55),
        }}
      >
        <PlatformIcon platform={platform} />
      </span>
      {showLabel && <span className="text-sm font-medium text-[var(--ink)]">{label ?? platformLabel(platform)}</span>}
    </span>
  );
  if (showLabel) return badge;
  return <Tooltip title={label ?? platformLabel(platform)}>{badge}</Tooltip>;
}
