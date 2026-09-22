import { Card, type CardProps } from "antd";
import type { ReactNode } from "react";

export function CardHeading({ icon, title, desc }: { icon: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/22 text-[var(--accent-deep)]">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold leading-snug text-[var(--ink)]">{title}</span>
        {desc ? <span className="whitespace-normal text-xs font-medium leading-snug text-[var(--ink-soft)]">{desc}</span> : null}
      </div>
    </div>
  );
}

export default function DashboardCard({ className, ...props }: CardProps) {
  return (
    <Card
      className={`dash-card !rounded-[20px] !border-[var(--line)] !shadow-[0_1px_2px_rgba(22,19,16,0.05),0_16px_36px_-20px_rgba(22,19,16,0.28)] ${className ?? ""}`}
      {...props}
    />
  );
}
