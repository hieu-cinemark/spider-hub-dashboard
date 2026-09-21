"use client";

import { Line } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { OpsMetricPoint } from "@/lib/types";
import { CHART_HEIGHT } from "@/lib/constants";
import { useColorTheme } from "@/theme/ThemeProvider";

const METRIC_COLOR = {
  running: "#0d9488",
  queued: "#6366f1",
  load: "#d97706",
} as const;

function formatClock(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SystemPerformanceChart({
  series,
  runningLabel,
  queuedLabel,
  loadLabel,
}: {
  series: OpsMetricPoint[];
  runningLabel: string;
  queuedLabel: string;
  loadLabel: string;
}) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const chartData = useMemo(() => {
    return series.flatMap((row) => [
      { t: row.ts, clock: formatClock(row.ts), metric: runningLabel, value: row.running },
      { t: row.ts, clock: formatClock(row.ts), metric: queuedLabel, value: row.queued },
      { t: row.ts, clock: formatClock(row.ts), metric: loadLabel, value: row.load_1 },
    ]);
  }, [series, runningLabel, queuedLabel, loadLabel]);

  return (
    <Line
      data={chartData}
      xField="clock"
      yField="value"
      colorField="metric"
      scale={{
        color: {
          domain: [runningLabel, queuedLabel, loadLabel],
          range: [METRIC_COLOR.running, METRIC_COLOR.queued, METRIC_COLOR.load],
        },
        y: { nice: true, domainMin: 0 },
      }}
      insetTop={16}
      point={{ shape: "circle", size: 2 }}
      smooth
      theme={{ type: isDark ? "classicDark" : "classic" }}
      axis={{
        y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
        x: { title: false },
      }}
      tooltip={{
        title: (d: { clock: string }) => d.clock,
        items: [{ channel: "y", valueFormatter: (v: number) => Number(v).toLocaleString() }],
      }}
      legend={{ color: { position: "top" } }}
      animation={false}
      height={Math.min(CHART_HEIGHT, 260)}
    />
  );
}

export default memo(SystemPerformanceChart);
