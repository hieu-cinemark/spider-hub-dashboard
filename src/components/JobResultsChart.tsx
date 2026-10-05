"use client";

import { Column } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { JobTask } from "@/lib/types";
import { useColorTheme } from "@/theme/ThemeProvider";

const STATUS_COLOR = { done: "#059669", failed: "#e11d48", skipped: "#d97706" } as const;
type FinishedStatus = keyof typeof STATUS_COLOR;

function hourLabel(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}h`;
}

// Finished jobs bucketed by the local hour they ended, stacked by outcome -
// a wall of red in one hour reads instantly, where the same thing in the
// history table is 20 rows of scrolling.
function JobResultsChart({ history, labels }: { history: JobTask[]; labels: Record<FinishedStatus, string> }) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const data = useMemo(() => {
    const buckets = new Map<number, Record<FinishedStatus, number>>();
    for (const job of history) {
      if (!job.finished_at || !(job.status in STATUS_COLOR)) continue;
      const hour = Math.floor(job.finished_at / 3600) * 3600;
      const row = buckets.get(hour) ?? { done: 0, failed: 0, skipped: 0 };
      row[job.status as FinishedStatus] += 1;
      buckets.set(hour, row);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .flatMap(([hour, counts]) =>
        (Object.keys(STATUS_COLOR) as FinishedStatus[]).map((status) => ({
          hour: hourLabel(hour),
          status: labels[status],
          count: counts[status],
        })),
      );
  }, [history, labels]);

  return (
    <Column
      data={data}
      xField="hour"
      yField="count"
      colorField="status"
      stack
      scale={{
        color: {
          domain: [labels.done, labels.failed, labels.skipped],
          range: [STATUS_COLOR.done, STATUS_COLOR.failed, STATUS_COLOR.skipped],
        },
        y: { nice: true, domainMin: 0 },
      }}
      style={{ maxWidth: 40 }}
      insetTop={12}
      theme={{ type: isDark ? "classicDark" : "classic" }}
      axis={{
        y: { title: false, grid: true },
        x: { title: false, labelAutoHide: true, labelAutoRotate: false },
      }}
      interaction={{ tooltip: { shared: true } }}
      legend={{ color: { position: "top" } }}
      height={220}
    />
  );
}

export default memo(JobResultsChart);
