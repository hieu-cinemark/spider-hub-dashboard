"use client";

import { Button, Empty, Pagination } from "antd";
import type { ReactNode } from "react";
import { MobileCardSkeletonList } from "@/components/PageSkeleton";

export function ItemCardList<T>({
  items,
  loading,
  empty,
  rowKey,
  pagination,
  loadMore,
  children,
}: {
  items: T[];
  loading?: boolean;
  empty?: ReactNode;
  rowKey: (item: T) => string;
  // Numbered pages over an already-fully-fetched, client-side array (small
  // admin lists: movies/keywords/proxies/accounts - see usePagedList
  // callers). Not for posts/comments - see `loadMore` below.
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
    showTotal?: (total: number) => string;
  };
  // "Load more", for keyset-paginated server data (posts/comments) - see
  // usePosts/useAllComments's own comment (keyset can't cheaply jump to
  // "page N", only ever append the next chunk). Mutually exclusive with
  // `pagination` above; a caller uses one or the other, never both.
  loadMore?: {
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    label: string;
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
      {loadMore?.hasMore && (
        <div className="flex justify-center pt-1">
          <Button loading={loadMore.loading} onClick={loadMore.onLoadMore} size="small">
            {loadMore.label}
          </Button>
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
