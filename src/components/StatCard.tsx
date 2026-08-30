"use client";

import { Skeleton } from "antd";
import type { ReactNode } from "react";
import DashboardCard from "@/components/DashboardCard";

const DEFAULT_ICON_COLOR = "#2f54eb";

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
  const iconColor = color ?? DEFAULT_ICON_COLOR;

  return (
    <DashboardCard className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wide text-[#8c8c8c]">{title}</span>
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 96 }} />
          ) : (
            <span className="text-[28px] leading-none font-bold text-[#141414]">
              {typeof value === "number" ? value.toLocaleString() : value}
              {suffix && <span className="ml-1 text-base font-medium text-[#8c8c8c]">{suffix}</span>}
            </span>
          )}
        </div>
        {icon && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: `${iconColor}14`, color: iconColor }}
          >
            {icon}
          </span>
        )}
      </div>
    </DashboardCard>
  );
}
