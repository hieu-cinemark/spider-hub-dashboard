"use client";

import { FunnelPlotOutlined } from "@ant-design/icons";
import { Empty, Tag, Tooltip } from "antd";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ChartCardSkeleton } from "@/components/PageSkeleton";
import { useIngestFunnel } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { translations, type TranslationKey } from "@/i18n/translations";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import type { IngestFunnel } from "@/lib/types";

const SEGMENT_COLOR = {
  new: "var(--tag-ok)",
  updated: "var(--tag-blue)",
  dropped: "var(--tag-neutral)",
} as const;

function sumDropped(row: IngestFunnel): number {
  return Object.values(row.dropped).reduce((sum, n) => sum + n, 0);
}

function FunnelRow({ row }: { row: IngestFunnel }) {
  const { t } = useTranslation();
  const dropped = sumDropped(row);
  // received can lag new+updated by a hair (different hour buckets at the
  // edges of the window) - scale against whichever is larger so the bar
  // never overflows.
  const total = Math.max(row.received, row.new + row.updated + dropped, 1);
  const segments = [
    { key: "new" as const, label: t("funnelNew"), n: row.new },
    { key: "updated" as const, label: t("funnelUpdated"), n: row.updated },
    { key: "dropped" as const, label: t("funnelDropped"), n: dropped },
  ];
  const reasons = Object.entries(row.dropped).sort((a, b) => b[1] - a[1]);
  // A reason added in ingest before it gets a label here shows its raw name.
  const reasonLabel = (reason: string) => {
    const key = `dropReason_${reason}`;
    return key in translations.en ? t(key as TranslationKey) : reason;
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-deep)]/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
          <PlatformIcon platform={row.platform} /> {platformLabel(row.platform)}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {t("funnelReceived")}{" "}
          <span className="text-base font-semibold tabular-nums text-[var(--ink)]">{row.received.toLocaleString()}</span>
        </span>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]/40">
        {segments.map((seg) =>
          seg.n > 0 ? (
            <Tooltip key={seg.key} title={`${seg.label}: ${seg.n.toLocaleString()}`}>
              <div style={{ width: `${(seg.n / total) * 100}%`, background: SEGMENT_COLOR[seg.key] }} />
            </Tooltip>
          ) : null,
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="min-w-0">
            <div className="flex items-center gap-1 truncate text-[11px] font-medium text-[var(--muted)]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SEGMENT_COLOR[seg.key] }} />
              {seg.label}
            </div>
            <div className="text-[17px] font-semibold tabular-nums text-[var(--ink)]">
              {seg.n.toLocaleString()}
              <span className="ml-1 text-[11px] font-medium text-[var(--muted)]">
                {Math.round((seg.n / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {reasons.map(([reason, n]) => (
            <Tag key={reason} color="default" className="!m-0">
              {reasonLabel(reason)} · {n.toLocaleString()}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Every collected post ends up in exactly one bucket: saved as new (the
// only thing that moves the post totals), refreshed an existing row, or
// filtered out before saving - the answer to "the crawl saved N posts, why
// did the total only go up by M?".
export default function IngestFunnelCard({ hours }: { hours: number }) {
  const { t } = useTranslation();
  const { data, isLoading } = useIngestFunnel(hours);
  const rows = (data ?? []).filter((row) => row.received + row.new + row.updated > 0);

  return (
    <DashboardCard
      title={
        <CardHeading
          icon={<FunnelPlotOutlined />}
          title={t("funnelTitle", { hours })}
          desc={`${t("funnelDesc")} · ${t("funnelHint")}`}
        />
      }
    >
      {isLoading && !data ? (
        <ChartCardSkeleton height={160} />
      ) : rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("funnelEmpty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <FunnelRow key={row.platform} row={row} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
