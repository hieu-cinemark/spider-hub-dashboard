"use client";

import { Line } from "@ant-design/plots";
import type { TimeseriesPoint } from "@/lib/types";
import { formatShortDay, platformColorScale, platformLabel } from "@/lib/platform";

export default function TimeseriesChart({ data }: { data: TimeseriesPoint[] }) {
  const chartData = data.map((row) => ({
    day: row.day,
    count: row.count,
    platform: platformLabel(row.platform),
  }));

  return (
    <Line
      data={chartData}
      xField="day"
      yField="count"
      colorField="platform"
      scale={{ color: platformColorScale(data.map((row) => row.platform)) }}
      point={{ shape: "circle", size: 3 }}
      smooth
      axis={{
        y: { title: false, grid: true },
        x: { title: false, labelFormatter: formatShortDay },
      }}
      tooltip={{ title: (d: { day: string }) => formatShortDay(d.day) }}
      legend={{ color: { position: "top" } }}
      height={300}
    />
  );
}
