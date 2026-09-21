"use client";

import { Tooltip } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";

export function CountDelta({
  current,
  previous,
  compact = false,
}: {
  current: number;
  previous: number;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const delta = current - previous;
  const full =
    delta === 0 ? t("deltaUnchanged") : delta > 0 ? t("deltaUp", { n: delta.toLocaleString() }) : t("deltaDown", { n: Math.abs(delta).toLocaleString() });
  const short =
    delta === 0 ? t("deltaCompactUnchanged") : delta > 0 ? `+${delta.toLocaleString()}` : `−${Math.abs(delta).toLocaleString()}`;
  const color =
    delta === 0
      ? "text-[var(--muted)]"
      : delta > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";

  const body = (
    <span className={`font-medium tabular-nums ${color}`}>
      {compact ? short : full}
    </span>
  );
  return compact ? <Tooltip title={full}>{body}</Tooltip> : body;
}

export function VolumeMetric({
  total,
  today,
  previous,
}: {
  total: number;
  today: number;
  previous: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="volume-metric">
      <span className="volume-metric-total">{total.toLocaleString()}</span>
      <div className="volume-metric-sub">
        <span className="tabular-nums">{t("collectedToday", { n: today.toLocaleString() })}</span>
        <CountDelta current={today} previous={previous} compact />
      </div>
    </div>
  );
}
