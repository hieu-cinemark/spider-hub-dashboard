"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import DashboardCard from "@/components/DashboardCard";
import { SkelBlock } from "@/components/PageSkeleton";

const DEFAULT_ICON_COLOR = "#0f766e";

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  loading,
  tone,
  delta,
  hint,
  href,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  tone?: "danger" | "warning";
  delta?: ReactNode;
  hint?: ReactNode;
  href?: string;
}) {
  const iconColor = color ?? DEFAULT_ICON_COLOR;
  const ring =
    tone === "danger"
      ? "!border-rose-200 !shadow-[0_0_0_3px_rgba(225,29,72,0.1)] dark:!border-rose-900 dark:!shadow-[0_0_0_3px_rgba(225,29,72,0.2)]"
      : tone === "warning"
        ? "!border-amber-200 !shadow-[0_0_0_3px_rgba(194,65,12,0.12)] dark:!border-amber-900 dark:!shadow-[0_0_0_3px_rgba(251,146,60,0.2)]"
        : "";

  const card = (
    <DashboardCard className={`h-full w-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${ring} ${href ? "cursor-pointer" : ""}`}>
      <div className="relative overflow-hidden">
        <span
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl"
          style={{ backgroundColor: iconColor }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div
            className="flex min-w-0 flex-1 flex-col gap-2 border-l-[3px] pl-3"
            style={{ borderColor: tone === "danger" ? "#e11d48" : tone === "warning" ? "#c2410c" : iconColor }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{title}</span>
            {loading ? (
              <>
                <SkelBlock className="h-8 w-28" />
                <SkelBlock className="h-3 w-20" />
              </>
            ) : (
              <>
                <span className="text-[28px] leading-none font-semibold tracking-tight text-[var(--ink)]">
                  {typeof value === "number" ? value.toLocaleString() : value}
                  {suffix && <span className="ml-1 text-base font-medium text-[var(--muted)]">{suffix}</span>}
                </span>
                {delta && <div className="text-xs">{delta}</div>}
                {hint && (
                  <div
                    className={`text-[11px] font-semibold leading-snug ${
                      tone === "danger"
                        ? "text-[var(--danger)]"
                        : tone === "warning"
                          ? "text-[var(--warn)]"
                          : "text-[var(--ink-soft)]"
                    }`}
                  >
                    {hint}
                  </div>
                )}
              </>
            )}
          </div>
          {icon && (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
              style={{
                backgroundColor: `color-mix(in srgb, ${iconColor} 20%, transparent)`,
                color: iconColor,
              }}
            >
              {icon}
            </span>
          )}
        </div>
      </div>
    </DashboardCard>
  );

  if (!href || loading) return card;
  return (
    <Link href={href} className="block h-full text-inherit no-underline">
      {card}
    </Link>
  );
}
