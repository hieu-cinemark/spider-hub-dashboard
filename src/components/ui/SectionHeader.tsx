"use client";

import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import type { ReactNode } from "react";

/**
 * The heading of one section inside a page.
 *
 * Pages are split into labelled sections (Operational status, KPIs, Queue,
 * Platform health, Analytics) so the eye can find a block by its heading
 * instead of by guessing from the content.
 */
export default function SectionHeader({
  title,
  desc,
  actions,
  icon,
}: {
  title: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--paper-deep)] text-[12px] text-[var(--ink-soft)]">
            {icon}
          </span>
        ) : null}
        <h3 className="m-0 truncate text-[13px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
        {desc ? <span className="truncate-1 text-[12px] text-[var(--muted)]">{desc}</span> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** A small "more" menu for section-level actions. */
export function SectionActions({
  items,
  label,
}: {
  items: { key: string; label: ReactNode; onClick?: () => void; danger?: boolean }[];
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: items.map((item) => ({
          key: item.key,
          label: item.label,
          danger: item.danger,
          onClick: item.onClick,
        })),
      }}
    >
      <Button size="small" icon={<DownOutlined />} aria-label={label} />
    </Dropdown>
  );
}
