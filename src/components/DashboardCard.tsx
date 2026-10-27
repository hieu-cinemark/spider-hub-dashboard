import { Card, type CardProps } from "antd";
import type { ReactNode } from "react";

import Hint, { SHORT_DESC_MAX } from "./Hint";

export function CardHeading({ icon, title, desc }: { icon: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/16 text-[13px] text-[var(--accent-deep)]">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-snug text-[var(--ink)]">
          {title}
          {desc && desc.length > SHORT_DESC_MAX ? <Hint text={desc} /> : null}
        </span>
        {desc && desc.length <= SHORT_DESC_MAX ? (
          <span className="whitespace-normal text-[11.5px] leading-snug text-[var(--muted)]">{desc}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardCard({ className, ...props }: CardProps) {
  return (
    <Card
      className={`dash-card !rounded-[14px] !border-[var(--line)] ${className ?? ""}`}
      {...props}
    />
  );
}
