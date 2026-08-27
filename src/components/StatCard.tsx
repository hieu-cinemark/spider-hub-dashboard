"use client";

import { Card, Statistic } from "antd";
import type { ReactNode } from "react";

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={icon}
        loading={loading}
        styles={color ? { content: { color } } : undefined}
      />
    </Card>
  );
}
