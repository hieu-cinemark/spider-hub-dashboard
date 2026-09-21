"use client";

import {
  AlertOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, Button, Empty, Segmented, Table, Tag, Typography } from "antd";
import { useMemo } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import StatCard from "@/components/StatCard";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useLogTail } from "@/hooks/useLogTail";
import { useTranslation } from "@/i18n/LocaleProvider";
import { DEFAULT_LOG_LINES, LOG_LINE_OPTIONS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import {
  formatLogClock,
  isFailureLevel,
  isNoisyLog,
  parseLogLines,
  summarizeCrawlHealth,
  type ParsedLogLine,
} from "@/lib/logParser";
import { platformLabel, PLATFORM_META } from "@/lib/platform";

type IssuePreset = "issues" | "error" | "warn";

const LOG_QUERY = { level: "issues", lines: String(DEFAULT_LOG_LINES), q: "" };

function issueRows(lines: ParsedLogLine[], preset: IssuePreset, needle: string): ParsedLogLine[] {
  const q = needle.trim().toLowerCase();
  return lines
    .filter((line) => {
      if (isNoisyLog(line)) return false;
      if (preset === "error") return isFailureLevel(line.level);
      if (preset === "warn") return line.level === "warning";
      return isFailureLevel(line.level) || line.level === "warning";
    })
    .filter((line) => {
      if (!q) return true;
      return line.raw.toLowerCase().includes(q);
    })
    .slice(-40)
    .reverse();
}

export default function LogSummary({ kind, sourceLabel }: { kind: "spider-hub" | "ingest"; sourceLabel: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useQueryRecord(LOG_QUERY);
  const parsedLines = Number(query.lines);
  const lineCount = (LOG_LINE_OPTIONS as readonly number[]).includes(parsedLines) ? parsedLines : DEFAULT_LOG_LINES;
  const preset = (["issues", "warn", "error"] as const).includes(query.level as IssuePreset)
    ? (query.level as IssuePreset)
    : "issues";
  const search = query.q;

  // Manual refresh only — no live stream polling.
  const { data, error, isFetching, dataUpdatedAt, refetch } = useLogTail(kind, lineCount, false, REFRESH_INTERVAL_MS.logs, true);

  const parsed = useMemo(() => parseLogLines(data?.lines ?? []), [data?.lines]);
  const health = useMemo(() => summarizeCrawlHealth(parsed.filter((line) => !isNoisyLog(line))), [parsed]);
  const rows = useMemo(() => issueRows(parsed, preset, search), [parsed, preset, search]);
  const platformIssues = Object.entries(health.byPlatform).filter(
    ([, row]) => row.errors > 0 || row.warnings > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="filter-bar">
        <Segmented
          value={preset}
          onChange={(v) => setQuery({ level: v as IssuePreset })}
          options={[
            {
              label:
                health.errorCount + health.warningCount > 0
                  ? `${t("logSummaryIssues")} ${health.errorCount + health.warningCount}`
                  : t("logSummaryIssues"),
              value: "issues",
            },
            {
              label: health.warningCount > 0 ? `${t("logPresetWarn")} ${health.warningCount}` : t("logPresetWarn"),
              value: "warn",
            },
            {
              label: health.errorCount > 0 ? `${t("logPresetError")} ${health.errorCount}` : t("logPresetError"),
              value: "error",
            },
          ]}
        />
        <Segmented
          value={lineCount}
          onChange={(v) => setQuery({ lines: String(v) })}
          options={LOG_LINE_OPTIONS.map((n) => ({ label: String(n), value: n }))}
        />
        <Typography.Text type="secondary" className="text-xs">
          {sourceLabel}
          {data?.ok ? ` · ${data.source.split("/").slice(-2).join("/")}` : ` · ${t("logFileNotFound")}`}
          {dataUpdatedAt > 0 && ` · ${t("statsUpdatedAt", { time: new Date(dataUpdatedAt).toLocaleTimeString() })}`}
        </Typography.Text>
        <div className="ml-auto">
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
          color="#e11d48"
          tone={health.errorCount > 0 ? "danger" : undefined}
        />
        <StatCard
          title={t("logSummaryWarnings")}
          value={health.warningCount}
          loading={isFetching && !data}
          icon={<WarningOutlined />}
          color="#d97706"
          tone={health.warningCount > 0 ? "warning" : undefined}
        />
        <StatCard
          title={t("logSummaryScanned")}
          value={parsed.length}
          loading={isFetching && !data}
          icon={<ReloadOutlined />}
          color="#0284c7"
        />
        <StatCard
          title={t("logSummaryPlatforms")}
          value={platformIssues.length}
          loading={isFetching && !data}
          icon={<CheckCircleOutlined />}
          color="#0d9488"
          tone={platformIssues.length > 0 ? "warning" : undefined}
          hint={
            health.errorCount === 0 && health.warningCount === 0 ? t("logSummaryHealthy") : undefined
          }
        />
      </div>

      {platformIssues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {platformIssues.map(([name, row]) => (
            <Tag
              key={name}
              color={row.errors > 0 ? "error" : "warning"}
              className="!m-0 cursor-pointer"
              onClick={() => setQuery({ q: name, level: row.errors > 0 ? "error" : "warn" })}
            >
              {PLATFORM_META[name] ? platformLabel(name) : name} ·{" "}
              {row.errors > 0
                ? t("crawlIssueErrors", { n: row.errors })
                : t("crawlIssueWarnings", { n: row.warnings })}
            </Tag>
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
        <Table<ParsedLogLine>
          size="middle"
          rowKey={(row, index) => `${row.timestamp ?? "x"}-${index}`}
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
          rowClassName={(row) => (isFailureLevel(row.level) ? "summary-error-row" : "summary-warn-row")}
          columns={[
            {
              title: t("logTime"),
              key: "time",
              width: 96,
              render: (_: unknown, row) => (
                <span className="cell-meta font-mono">{formatLogClock(row.timestamp) || "—"}</span>
              ),
            },
            {
              title: t("logLevel"),
              dataIndex: "level",
              width: 104,
              render: (level: ParsedLogLine["level"]) => (
                <Tag color={isFailureLevel(level) ? "error" : "warning"} className="!m-0 uppercase">
                  {level === "warning" ? "warn" : level}
                </Tag>
              ),
            },
            {
              title: t("platform"),
              key: "platform",
              width: 120,
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
              render: (message: string, row) => (
                <span className="cell-primary !font-normal leading-snug" title={row.raw}>
                  {message}
                </span>
              ),
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}
