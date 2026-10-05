"use client";

import { Area, Line } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { OpsMetricPoint } from "@/lib/types";
import { useColorTheme } from "@/theme/ThemeProvider";

const METRIC_COLOR = {
  running: "#0d9488",
  queued: "#6366f1",
  load: "#d97706",
} as const;

const PANEL_HEIGHT = 220;

// /health/metrics only samples while something polls it (this page), so
// the series is a few minutes of dense samples separated by hours of
// nothing. A real time axis squeezed every burst into a sliver, so x is the
// sample order instead (labels still show when each sample was taken).

function formatTick(ms: number, multiDay: boolean): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  if (!multiDay) return time;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${time}`;
}

function buildRows(
  series: OpsMetricPoint[],
  metrics: { label: string; pick: (p: OpsMetricPoint) => number }[],
  multiDay: boolean,
) {
  return series.flatMap((point) =>
    metrics.map((m) => ({ clock: formatTick(point.ts * 1000, multiDay), metric: m.label, value: m.pick(point) })),
  );
}

function SystemPerformanceChart({
  series,
  runningLabel,
  queuedLabel,
  loadLabel,
  queueTitle,
  loadTitle,
}: {
  series: OpsMetricPoint[];
  runningLabel: string;
  queuedLabel: string;
  loadLabel: string;
  queueTitle: string;
  loadTitle: string;
}) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const { queueRows, loadRows } = useMemo(() => {
    const sorted = [...series].sort((a, b) => a.ts - b.ts);
    const span = sorted.length > 1 ? sorted[sorted.length - 1].ts - sorted[0].ts : 0;
    const multiDay = span > 20 * 3600;
    return {
      queueRows: buildRows(sorted, [{ label: queuedLabel, pick: (p) => p.queued }], multiDay),
      loadRows: buildRows(
        sorted,
        [
          { label: runningLabel, pick: (p) => p.running },
          { label: loadLabel, pick: (p) => p.load_1 },
        ],
        multiDay,
      ),
    };
  }, [series, runningLabel, queuedLabel, loadLabel]);

  // Queue depth (thousands) and running/load (single digits) used to share
  // one y-axis, which flattened the latter two into the baseline - each
  // gets its own panel and scale now.
  const common = {
    xField: "clock",
    yField: "value",
    colorField: "metric",
    insetTop: 12,
    theme: { type: isDark ? "classicDark" : "classic" },
    axis: {
      y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
      x: { title: false, labelAutoHide: true, labelAutoRotate: false },
    },
    tooltip: {
      title: (d: { clock: string }) => d.clock,
      items: [{ channel: "y", valueFormatter: (v: number) => Number(v).toLocaleString() }],
    },
    interaction: { tooltip: { shared: true } },
    legend: { color: { position: "top" as const } },
    animation: false as const,
    height: PANEL_HEIGHT,
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <div className="mb-1 text-xs font-semibold text-[var(--ink-soft)]">{queueTitle}</div>
        <Area
          {...common}
          data={queueRows}
          style={{ fillOpacity: 0.2 }}
          line={{ style: { lineWidth: 2 } }}
          scale={{
            color: { domain: [queuedLabel], range: [METRIC_COLOR.queued] },
            y: { nice: true, domainMin: 0 },
          }}
        />
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold text-[var(--ink-soft)]">{loadTitle}</div>
        <Line
          {...common}
          data={loadRows}
          style={{ lineWidth: 2 }}
          scale={{
            color: { domain: [runningLabel, loadLabel], range: [METRIC_COLOR.running, METRIC_COLOR.load] },
            y: { nice: true, domainMin: 0 },
          }}
        />
      </div>
    </div>
  );
}

export default memo(SystemPerformanceChart);
