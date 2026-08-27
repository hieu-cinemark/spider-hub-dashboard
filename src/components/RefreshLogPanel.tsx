"use client";

import { Collapse, Tag, Typography } from "antd";
import { useEffect, useRef } from "react";
import { LEVEL_BORDER, LEVEL_COLOR, parseLogLine } from "@/lib/logParser";
import type { RefreshStatus } from "@/lib/types";

const STATUS_LABEL: Record<RefreshStatus, string> = {
  idle: "Idle",
  running: "Refreshing…",
  success: "Refresh succeeded",
  failed: "Refresh failed",
};

export default function RefreshLogPanel({ lines, status }: { lines: string[]; status: RefreshStatus }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const parsed = lines.map(parseLogLine);

  return (
    <Collapse
      size="small"
      defaultActiveKey={status === "running" ? ["log"] : []}
      items={[
        {
          key: "log",
          label: (
            <Typography.Text type="secondary" className="text-xs">
              {STATUS_LABEL[status]} · {lines.length} line{lines.length === 1 ? "" : "s"} (live)
            </Typography.Text>
          ),
          children: (
            <div
              ref={containerRef}
              className="h-[220px] overflow-auto rounded-lg bg-[#0b0f19] p-3 font-mono text-[12px] leading-6 text-[#d6e2f0]"
            >
              {parsed.map((line, i) => (
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
              {parsed.length === 0 && <span className="text-[#6b7a90]">waiting for output…</span>}
            </div>
          ),
        },
      ]}
    />
  );
}
