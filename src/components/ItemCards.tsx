"use client";

import { Empty, Pagination } from "antd";
import type { ReactNode } from "react";
import { MobileCardSkeletonList } from "@/components/PageSkeleton";

export function ItemCardList<T>({
  items,
  loading,
  empty,
  rowKey,
  pagination,
  children,
}: {
  items: T[];
  loading?: boolean;
  empty?: ReactNode;
  rowKey: (item: T) => string;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
    showTotal?: (total: number) => string;
  };
  children: (item: T) => ReactNode;
}) {
  const pageItems =
    pagination && pagination.total === items.length
      ? items.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)
      : items;

  if (loading) {
    return <MobileCardSkeletonList />;
  }

  if (!items.length) {
    return <div className="py-8">{empty ?? <Empty />}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {pageItems.map((item) => (
        <div key={rowKey(item)}>{children(item)}</div>
      ))}
      {pagination && (
        <div className="flex justify-end pt-1">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
            showTotal={pagination.showTotal}
            showSizeChanger={false}
            hideOnSinglePage={false}
            size="small"
          />
        </div>
      )}
    </div>
  );
}

export function ItemCard({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 ${onClick ? "cursor-pointer" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function ItemField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] py-2.5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mb-1.5 text-[12px] font-semibold tracking-wide text-[var(--muted)]">{label}</div>
      <div className="min-w-0 text-[14px] leading-snug text-[var(--ink)]">{children}</div>
    </div>
  );
}
