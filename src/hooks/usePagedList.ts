"use client";

import { useEffect, useMemo, useState } from "react";
import { TABLE_PAGE_SIZE } from "@/lib/constants";

export function usePagedList<T>(items: T[], resetKey = "", pageSize = TABLE_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = items.length;
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize) || 1));
  const paged = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );

  function paging(showTotal: (n: number) => string) {
    return {
      current,
      pageSize,
      total,
      onChange: setPage,
      showSizeChanger: false as const,
      hideOnSinglePage: false as const,
      showTotal: (n: number) => showTotal(n),
      responsive: true,
    };
  }

  return { page: current, setPage, paged, total, pageSize, paging };
}
