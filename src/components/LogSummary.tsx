"use client";

import {
  AlertOutlined,
  CheckCircleOutlined,
  DownOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Input, Segmented, Table, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import StatCard from "@/components/StatCard";
import CopyButton from "@/components/ui/CopyButton";
import StatusBadge, { type StatusTone } from "@/components/ui/StatusBadge";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useLogTail } from "@/hooks/useLogTail";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/i18n/LocaleProvider";
import { DEFAULT_LOG_LINES, LOG_LINE_OPTIONS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import {
  formatLogClock,
  isFailureLevel,
  isNoisyLog,
  parseLogLines,
  summarizeCrawlHealth,
  type LogLevel,
  type ParsedLogLine,
} from "@/lib/logParser";
import { platformLabel, PLATFORM_META } from "@/lib/platform";

type SeverityTab = "all" | "error" | "warning" | "info";

const LOG_QUERY = { level: "all", platform: "all", lines: String(DEFAULT_LOG_LINES), q: "" };

const SEVERITY_TONE: Record<LogLevel | "unknown", StatusTone> = {
  critical: "danger",
  error: "danger",
  warning: "warning",
  info: "info",
  debug: "neutral",
  unknown: "neutral",
};

function levelLabel(level: LogLevel | null): string {
  if (!level) return "—";
  return level === "warning" ? "warn" : level;
}

export default function LogSummary({ kind, sourceLabel }: { kind: "spider-hub" | "ingest"; sourceLabel: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useQueryRecord(LOG_QUERY);
  const parsedLines = Number(query.lines);
  const lineCount = (LOG_LINE_OPTIONS as readonly number[]).includes(parsedLines) ? parsedLines : DEFAULT_LOG_LINES;
  const severity = (["all", "error", "warning", "info"] as const).includes(query.level as SeverityTab)
    ? (query.level as SeverityTab)
    : "all";
  const platform = query.platform || "all";
  const search = query.q;
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Manual refresh only — no live stream polling.
  const { data, error, isFetching, dataUpdatedAt, refetch } = useLogTail(kind, lineCount, false, REFRESH_INTERVAL_MS.logs, true);

  const parsed = useMemo(() => parseLogLines(data?.lines ?? []), [data?.lines]);
  const health = useMemo(() => summarizeCrawlHealth(parsed.filter((line) => !isNoisyLog(line))), [parsed]);

  const platformOptions = useMemo(() => {
    const names = new Set<string>();
    for (const line of parsed) {
      if (line.platform && line.platform !== "system") names.add(line.platform);
    }
    return Array.from(names).sort();
  }, [parsed]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parsed
      .filter((line) => !isNoisyLog(line))
      .filter((line) => {
        if (severity === "error") return isFailureLevel(line.level);
        if (severity === "warning") return line.level === "warning";
        if (severity === "info") return line.level === "info" || line.level === "debug";
        return true;
      })
      .filter((line) => {
        if (platform === "all") return true;
        return line.platform === platform;
      })
      .filter((line) => {
        if (!q) return true;
        return line.raw.toLowerCase().includes(q);
      })
      .slice(-200)
      .reverse();
  }, [parsed, severity, platform, search]);

  const platformIssues = Object.entries(health.byPlatform).filter(
    ([, row]) => row.errors > 0 || row.warnings > 0,
  );

  const logColumns: ResponsiveColumnType<ParsedLogLine>[] = [
    {
      title: t("logTime"),
      key: "time",
      width: 92,
      mobileHidden: true,
      render: (_: unknown, row) => (
        <span className="cell-meta font-mono">{formatLogClock(row.timestamp) || "—"}</span>
      ),
    },
    {
      title: t("logLevel"),
      dataIndex: "level",
      width: 96,
      render: (level: ParsedLogLine["level"]) => (
        <StatusBadge tone={SEVERITY_TONE[level ?? "unknown"]}>{levelLabel(level)}</StatusBadge>
      ),
    },
    {
      title: t("platform"),
      key: "platform",
      width: 112,
      render: (_: unknown, row) =>
        row.platform && row.platform !== "system"
          ? PLATFORM_META[row.platform]
            ? platformLabel(row.platform)
            : row.platform
          : "—",
    },
    {
      title: t("logMessage"),
      dataIndex: "message",
      mobilePrimary: true,
      render: (message: string, row) => (
        <span className="cell-primary !font-normal leading-snug clamp-2" title={row.raw}>
          {message}
        </span>
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 92,
      align: "right",
      mobileHidden: true,
      render: (_: unknown, row) => {
        const key = `${row.timestamp ?? "x"}-${row.message.slice(0, 16)}`;
        const hasDetails = row.continuations.length > 0 || row.raw.length > row.message.length;
        return (
          <div className="flex items-center justify-end gap-1">
            <CopyButton value={row.raw} label={t("logCopyMessage")} />
            {hasDetails ? (
              <Tooltip title={expanded === key ? t("hideDetails") : t("logTechnicalDetails")}>
                <Button
                  size="small"
                  type="text"
                  icon={<DownOutlined rotate={expanded === key ? 180 : 0} />}
                  onClick={() => setExpanded(expanded === key ? null : key)}
                  aria-label={t("logTechnicalDetails")}
                />
              </Tooltip>
            ) : null}
          </div>
        );
      },
    },
  ];

  // A log line has no id of its own. Timestamp + raw text is stable across
  // re-renders and unique enough to key a row (antd 6 no longer passes the
  // row index to rowKey).
  const rowKey = (row: ParsedLogLine) => `${row.timestamp ?? "x"}-${row.raw.length}-${row.raw.slice(0, 24)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="filter-bar">
        <Segmented
          size="small"
          value={severity}
          onChange={(v) => setQuery({ level: v as SeverityTab })}
          options={[
            { value: "all", label: t("logSeverityAll") },
            { value: "error", label: t("logSeverityError") },
            { value: "warning", label: t("logSeverityWarning") },
            { value: "info", label: t("logPresetInfo") },
          ]}
        />
        <Segmented
          size="small"
          value={platform}
          onChange={(v) => setQuery({ platform: String(v) })}
          options={[
            { value: "all", label: t("logPlatformFilter") },
            ...platformOptions.map((p) => ({
              value: p,
              label: PLATFORM_META[p] ? platformLabel(p) : p,
            })),
          ]}
        />
        <Input.Search
          allowClear
          size="small"
          className="max-w-[260px]"
          placeholder={t("logSearchPlaceholder")}
          defaultValue={search}
          onSearch={(v) => setQuery({ q: v })}
          onChange={(e) => {
            if (!e.target.value) setQuery({ q: "" });
          }}
        />
        <Segmented
          size="small"
          value={lineCount}
          onChange={(v) => setQuery({ lines: String(v) })}
          options={LOG_LINE_OPTIONS.map((n) => ({ label: String(n), value: n }))}
        />
        <div className="ml-auto flex items-center gap-2">
          <Typography.Text type="secondary" className="hidden text-xs xl:inline">
            {sourceLabel}
            {data?.ok ? ` · ${data.source.split("/").slice(-2).join("/")}` : ` · ${t("logFileNotFound")}`}
            {dataUpdatedAt > 0 && ` · ${t("statsUpdatedAt", { time: new Date(dataUpdatedAt).toLocaleTimeString() })}`}
          </Typography.Text>
          <Button type="primary" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
            {t("refresh")}
          </Button>
        </div>
      </div>

      {error && <Alert type="error" showIcon title={error.message} />}
      {data && !data.ok && (
        <Alert type="warning" showIcon title={t("logFileNotReachableTitle")} description={t("logFileNotReachableDesc")} />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("logSummaryErrors")}
          value={health.errorCount}
          loading={isFetching && !data}
          icon={<AlertOutlined />}
          tone={health.errorCount > 0 ? "danger" : undefined}
        />
        <StatCard
          title={t("logSummaryWarnings")}
          value={health.warningCount}
          loading={isFetching && !data}
          icon={<WarningOutlined />}
          tone={health.warningCount > 0 ? "warning" : undefined}
        />
        <StatCard
          title={t("logSummaryScanned")}
          value={parsed.length}
          loading={isFetching && !data}
          icon={<ReloadOutlined />}
        />
        <StatCard
          title={t("logSummaryPlatforms")}
          value={platformIssues.length}
          loading={isFetching && !data}
          icon={<CheckCircleOutlined />}
          tone={platformIssues.length > 0 ? "warning" : undefined}
          hint={
            health.errorCount === 0 && health.warningCount === 0 ? t("logSummaryHealthy") : undefined
          }
        />
      </div>

      {platformIssues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {platformIssues.map(([name, row]) => (
            <button
              key={name}
              type="button"
              className="cursor-pointer"
              onClick={() =>
                setQuery({
                  platform: name,
                  level: row.errors > 0 ? "error" : "warning",
                  q: "",
                })
              }
            >
              <StatusBadge tone={row.errors > 0 ? "danger" : "warning"}>
                {PLATFORM_META[name] ? platformLabel(name) : name} ·{" "}
                {row.errors > 0
                  ? t("crawlIssueErrors", { n: row.errors })
                  : t("crawlIssueWarnings", { n: row.warnings })}
              </StatusBadge>
            </button>
          ))}
        </div>
      )}

      <DashboardCard
        title={
          <CardHeading
            icon={health.errorCount > 0 ? <AlertOutlined /> : <CheckCircleOutlined />}
            title={t("logSummaryRecentIssues")}
            desc={t("logSummaryDesc")}
          />
        }
      >
        {isMobile ? (
            <MobileTable
              rowKey={(row) => rowKey(row)}
              dataSource={rows}
            columns={logColumns}
            empty={
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={data?.ok ? t("logSummaryNoIssues") : t("noMatchingLines")}
              />
            }
          />
        ) : (
          <Table<ParsedLogLine>
            size="middle"
            rowKey={rowKey}
            dataSource={rows}
            pagination={rows.length > 12 ? { pageSize: 12, showSizeChanger: false } : false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={data?.ok ? t("logSummaryNoIssues") : t("noMatchingLines")}
                />
              ),
            }}
            rowClassName={(row) =>
              isFailureLevel(row.level) ? "summary-error-row" : row.level === "warning" ? "summary-warn-row" : ""
            }
            columns={logColumns}
            expandable={{
              expandedRowKeys: expanded ? [expanded] : [],
              onExpandedRowsChange: (keys) => setExpanded(keys.length ? String(keys[0]) : null),
              rowExpandable: (row) => row.continuations.length > 0 || row.raw.length > row.message.length,
              expandedRowRender: (row) => (
                <div className="flex flex-col gap-2">
                  {row.logger ? (
                    <div className="font-mono text-[11.5px] text-[var(--muted)]">
                      {t("logSource")}: {row.logger}
                    </div>
                  ) : null}
                  {row.continuations.length > 0 ? (
                    <pre className="max-h-[280px] overflow-auto rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-[var(--ink-soft)]">
                      {row.continuations.join("\n")}
                    </pre>
                  ) : null}
                  <div>
                    <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("logRawLine")}
                    </div>
                    <pre className="max-h-[220px] overflow-auto rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-[var(--ink-soft)]">
                      {row.raw}
                    </pre>
                  </div>
                </div>
              ),
            }}
          />
        )}
      </DashboardCard>
    </div>
  );
}
