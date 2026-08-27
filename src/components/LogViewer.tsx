"use client";

import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Segmented, Select, Space, Switch, Tag, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLogTail } from "@/hooks/useLogTail";
import { DEFAULT_LOG_LINES, LOG_LINE_OPTIONS } from "@/lib/constants";
import { LEVEL_BORDER, LEVEL_COLOR, type LogLevel, parseLogLine } from "@/lib/logParser";

const LEVEL_FILTER_OPTIONS: { label: string; value: LogLevel }[] = [
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warning", value: "warning" },
  { label: "error", value: "error" },
  { label: "critical", value: "critical" },
];

export default function LogViewer({ kind, sourceLabel }: { kind: "spider-hub" | "ingest"; sourceLabel: string }) {
  const [lineCount, setLineCount] = useState<number>(DEFAULT_LOG_LINES);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, error, isFetching, refetch } = useLogTail(kind, lineCount, autoRefresh);

  const parsedLines = useMemo(() => {
    const lines = (data?.lines ?? []).map(parseLogLine);
    if (levelFilter.length === 0) return lines;
    return lines.filter((line) => line.level && levelFilter.includes(line.level));
  }, [data, levelFilter]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [parsedLines]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography.Text type="secondary" className="text-xs">
          {sourceLabel} · {data?.ok ? data.source : "log file not found on this host"}
        </Typography.Text>
        <Space wrap>
          <Select
            mode="multiple"
            allowClear
            size="small"
            placeholder={
              <span>
                <FilterOutlined /> all levels
              </span>
            }
            style={{ minWidth: 160 }}
            value={levelFilter}
            onChange={setLevelFilter}
            options={LEVEL_FILTER_OPTIONS}
            optionRender={(opt) => <Tag color={LEVEL_COLOR[opt.value as LogLevel]}>{opt.label}</Tag>}
          />
          <Segmented
            size="small"
            value={lineCount}
            onChange={(v) => setLineCount(v as number)}
            options={LOG_LINE_OPTIONS.map((n) => ({ label: `${n} lines`, value: n }))}
          />
          <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
          <Typography.Text type="secondary" className="text-xs">
            auto-refresh
          </Typography.Text>
          <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()} />
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
          <div key={i} className="flex items-start gap-2">
            <div
              className="flex shrink-0 items-start gap-2 border-l-2 pl-2"
              style={{ borderColor: line.level ? LEVEL_BORDER[line.level] : "transparent" }}
            >
              {line.timestamp && <span className="text-[#6b7a90]">{line.timestamp}</span>}
              {line.level && (
                <Tag color={LEVEL_COLOR[line.level]} className="!m-0 uppercase">
                  {line.level}
                </Tag>
              )}
            </div>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{line.message || " "}</span>
          </div>
        ))}
        {data?.ok && parsedLines.length === 0 && <span className="text-[#6b7a90]">(no matching lines)</span>}
      </div>
    </div>
  );
}
