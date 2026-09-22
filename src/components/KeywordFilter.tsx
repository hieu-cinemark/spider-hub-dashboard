"use client";

import { Select } from "antd";
import { useMemo } from "react";
import { useKeywordVolume } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";

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
      className="min-w-[220px]"
      placeholder={t("filterByKeyword")}
      value={value || undefined}
      onChange={(next) => onChange(next || undefined)}
      options={options}
    />
  );
}
