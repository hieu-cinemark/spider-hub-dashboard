"use client";

import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import { useLogTail } from "@/hooks/useLogTail";
import { DEFAULT_LOG_LINES, LOG_LINE_OPTIONS } from "@/lib/constants";
import {
  LEVEL_BORDER,
  LEVEL_COLOR,
  type LogLevel,
  parseLogLine,
} from "@/lib/logParser";

const LEVEL_FILTER_OPTIONS: { label: string; value: LogLevel }[] = [
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warning", value: "warning" },
  { label: "error", value: "error" },
  { label: "critical", value: "critical" },
];

function LevelPill({ level }: { level: LogLevel }) {
  const color = LEVEL_BORDER[level];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
      style={{ backgroundColor: `${color}1F`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {level}
    </span>
  );
}

export default function LogViewer({
  kind,
  sourceLabel,
}: {
  kind: "spider-hub" | "ingest";
  sourceLabel: string;
}) {
  const [lineCount, setLineCount] = useState<number>(DEFAULT_LOG_LINES);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>([]);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, error, isFetching, refetch } = useLogTail(
    kind,
    lineCount,
    autoRefresh,
  );

  const parsedLines = useMemo(() => {
    const lines = (data?.lines ?? []).map(parseLogLine);
    const byLevel =
      levelFilter.length === 0
        ? lines
        : lines.filter(
            (line) => line.level && levelFilter.includes(line.level),
          );
    const needle = search.trim().toLowerCase();
    if (!needle) return byLevel;
    return byLevel.filter((line) => line.raw.toLowerCase().includes(needle));
  }, [data, levelFilter, search]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [parsedLines]);

  return (
    <DashboardCard>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-[#bfbfbf]" />}
            placeholder="Search this log (event name, key=value, text)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px] flex-1"
          />
          <Select
            mode="multiple"
            allowClear
            placeholder={
              <span>
                <FilterOutlined /> all levels
              </span>
            }
            style={{ minWidth: 160 }}
            value={levelFilter}
            onChange={setLevelFilter}
            options={LEVEL_FILTER_OPTIONS}
            optionRender={(opt) => (
              <Tag color={LEVEL_COLOR[opt.value as LogLevel]}>{opt.label}</Tag>
            )}
          />
          <Segmented
            value={lineCount}
            onChange={(v) => setLineCount(v as number)}
            options={LOG_LINE_OPTIONS.map((n) => ({
              label: `${n} lines`,
              value: n,
            }))}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography.Text type="secondary" className="text-xs">
            {sourceLabel} ·{" "}
            {data?.ok ? data.source : "log file not found on this host"}
            {parsedLines.length !== (data?.lines?.length ?? 0) &&
              ` · showing ${parsedLines.length} of ${data?.lines?.length ?? 0}`}
          </Typography.Text>
          <Space size="small">
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
            <Typography.Text type="secondary" className="text-xs">
              auto-refresh
            </Typography.Text>
          </Space>
        </div>

        {error && <Alert type="error" showIcon title={error.message} />}
        {data && !data.ok && (
          <Alert
            type="warning"
            showIcon
            title="Log file not reachable from cinemark-api"
            description="Check SPIDER_HUB_CONSUMER_LOG_PATH / INGEST_CONSUMER_LOG_PATH in cinemark-api's .env - this dashboard reads the file straight off disk, so it only works when both services share a host (or the path is mounted)."
          />
        )}

        <div
          ref={containerRef}
          className="h-[min(480px,calc(100vh-320px))] min-h-[240px] overflow-auto rounded-lg bg-[#0b0f19] p-3 font-mono text-[12px] leading-6 text-[#d6e2f0]"
        >
          {parsedLines.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-white/5"
            >
              <div
                className="flex shrink-0 items-center gap-2 border-l-2 pl-2"
                style={{
                  borderColor: line.level
                    ? LEVEL_BORDER[line.level]
                    : "transparent",
                }}
              >
                {line.timestamp && (
                  <span className="text-[#6b7a90]">{line.timestamp}</span>
                )}
                {line.level && <LevelPill level={line.level} />}
              </div>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                {line.message || " "}
              </span>
            </div>
          ))}
          {data?.ok && parsedLines.length === 0 && (
            <span className="text-[#6b7a90]">(no matching lines)</span>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
