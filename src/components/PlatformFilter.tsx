"use client";

import { AppstoreOutlined } from "@ant-design/icons";
import FilterChip from "@/components/ui/FilterChip";
import { PlatformIcon, platformAccentColor, platformLabel } from "@/lib/platform";
import { useTranslation } from "@/i18n/LocaleProvider";

export const ALL_PLATFORM_QUERY = "all";

/**
 * The platform filter row.
 *
 * Each platform chip wears that platform's own brand colour (Facebook blue,
 * TikTok cyan, YouTube red...), so the row doubles as a legend: you can tell
 * at a glance which platforms the current view is scoped to, and the chip
 * that is selected is obvious without reading any text.
 */
export default function PlatformFilter({
  value,
  onChange,
  platforms,
  counts,
}: {
  value: string;
  onChange: (next: string) => void;
  platforms: readonly string[];
  counts?: Record<string, number>;
}) {
  const { t } = useTranslation();
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : undefined;

  return (
    <div className="filter-bar-scroll">
      <FilterChip
        active={value === ALL_PLATFORM_QUERY}
        icon={<AppstoreOutlined />}
        label={t("allPlatformsFilter")}
        count={total}
        accent="var(--accent-2)"
        onClick={() => onChange(ALL_PLATFORM_QUERY)}
      />
      {platforms.map((platform) => (
        <FilterChip
          key={platform}
          active={value === platform}
          icon={<PlatformIcon platform={platform} />}
          label={platformLabel(platform)}
          count={counts ? (counts[platform] ?? 0) : undefined}
          accent={platformAccentColor(platform)}
          onClick={() => onChange(platform)}
        />
      ))}
    </div>
  );
}
