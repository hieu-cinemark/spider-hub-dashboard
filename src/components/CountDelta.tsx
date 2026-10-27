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
      ? "bg-[var(--paper-deep)] text-[var(--ink-soft)]"
      : delta > 0
        ? "bg-[color-mix(in_srgb,var(--ok)_18%,transparent)] text-[var(--ok)]"
        : "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)]";

  const body = (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${color}`}>
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
