"use client";

import { Line } from "@ant-design/plots";
import type { TimeseriesPoint } from "@/lib/types";
import { platformLabel } from "@/lib/platform";

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
      point={{ shape: "circle", size: 3 }}
      axis={{ y: { title: false }, x: { title: false } }}
      height={280}
    />
  );
}
