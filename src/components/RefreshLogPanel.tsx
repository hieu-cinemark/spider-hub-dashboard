"use client";

import { Collapse, Typography } from "antd";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatLogClock, LEVEL_BORDER, parseLogLines, type LogLevel } from "@/lib/logParser";
import type { TranslationKey } from "@/i18n/translations";
import type { RefreshStatus } from "@/lib/types";

const STATUS_KEY: Record<RefreshStatus, TranslationKey> = {
  idle: "refreshStatusIdle",
  running: "refreshStatusRunning",
  success: "refreshStatusSuccess",
  failed: "refreshStatusFailed",
};

function LevelPill({ level }: { level: LogLevel }) {
  const color = LEVEL_BORDER[level];
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {level === "warning" ? "warn" : level}
    </span>
  );
}

export default function RefreshLogPanel({ lines, status }: { lines: string[]; status: RefreshStatus }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseLogLines(lines), [lines]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [parsed]);

  return (
    <Collapse
      size="small"
      defaultActiveKey={status === "running" ? ["log"] : []}
      items={[
        {
          key: "log",
          label: (
            <Typography.Text type="secondary" className="text-xs">
              {t(STATUS_KEY[status])} · {t(parsed.length === 1 ? "lineCount" : "lineCountPlural", { n: parsed.length })}
            </Typography.Text>
          ),
          children: (
            <div
              ref={containerRef}
              className="h-[180px] max-h-[180px] overflow-y-auto overscroll-contain rounded-xl bg-[#12141a] p-3 font-mono text-[12px] leading-6 text-[#d6e2f0]"
            >
              {parsed.map((line, i) => (
                <div
                  key={`${line.timestamp ?? "x"}-${i}`}
                  className={`flex items-start gap-2 px-1 py-0.5 ${
                    line.level === "error" || line.level === "critical"
                      ? "log-row-error"
                      : line.level === "warning"
                        ? "log-row-warning"
                        : ""
                  }`}
                >
                  <span className="w-[66px] shrink-0 tabular-nums text-[#6b7a90]">{formatLogClock(line.timestamp)}</span>
                  {line.level && <LevelPill level={line.level} />}
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                    {line.message || " "}
                    {line.continuations.length > 0 && (
                      <span className="mt-0.5 block text-[#8aa0b8]">{line.continuations.join("\n")}</span>
                    )}
                  </span>
                </div>
              ))}
              {parsed.length === 0 && <span className="text-[#6b7a90]">{t("waitingForOutput")}</span>}
            </div>
          ),
        },
      ]}
    />
  );
}
