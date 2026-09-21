"use client";

import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="m-0 text-[22px] font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
        {description ? (
          <p className="mt-1 mb-0 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
