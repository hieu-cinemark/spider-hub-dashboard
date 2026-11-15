"use client";

import { Select } from "antd";
import { useMemo } from "react";
import { useKeywordVolume } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * The keyword picker.
 *
 * The keyword list is long and grouped by movie, so the select needs room -
 * but on a phone a fixed 220px min-width would push the filter row sideways.
 * The width is therefore fluid: it fills the free space on desktop and
 * falls back to the full row width on a narrow screen.
 */
export default function KeywordFilter({
  value,
  onChange,
  platform,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
  platform?: string;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useKeywordVolume(platform);

  const options = useMemo(() => {
    const groups = new Map<string, { label: string; options: { value: string; label: string }[] }>();
    for (const row of data ?? []) {
      const groupLabel = row.movie_title?.trim() || t("unknown");
      const existing = groups.get(groupLabel) ?? { label: groupLabel, options: [] };
      existing.options.push({
        value: row.keyword_id,
        label: `${row.keyword}${row.platform && !platform ? ` · ${row.platform}` : ""}`,
      });
      groups.set(groupLabel, existing);
    }
    return Array.from(groups.values());
  }, [data, platform, t]);

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      loading={isLoading}
      className="w-full min-w-0 flex-1 sm:max-w-[280px]"
      placeholder={t("filterByKeyword")}
      value={value || undefined}
      onChange={(next) => onChange(next || undefined)}
      options={options}
    />
  );
}
