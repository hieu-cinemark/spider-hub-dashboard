"use client";

import { AppstoreOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import { useTranslation } from "@/i18n/LocaleProvider";

export const ALL_PLATFORM_QUERY = "all";

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
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        size="small"
        shape="round"
        type={value === ALL_PLATFORM_QUERY ? "primary" : "default"}
        icon={<AppstoreOutlined />}
        onClick={() => onChange(ALL_PLATFORM_QUERY)}
        className={value === ALL_PLATFORM_QUERY ? undefined : "!font-semibold"}
      >
        {t("allPlatformsFilter")}
        {total !== undefined ? ` (${total})` : ""}
      </Button>
      {platforms.map((platform) => (
        <Button
          key={platform}
          size="small"
          shape="round"
          type={value === platform ? "primary" : "default"}
          icon={<PlatformIcon platform={platform} style={{ color: "inherit" }} />}
          onClick={() => onChange(platform)}
          className={value === platform ? undefined : "!font-semibold"}
        >
          {platformLabel(platform)}
          {counts ? ` (${counts[platform] ?? 0})` : ""}
        </Button>
      ))}
    </div>
  );
}
