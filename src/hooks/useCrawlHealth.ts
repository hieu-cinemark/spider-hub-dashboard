import { useMemo } from "react";
import { useLogTail } from "@/hooks/useLogTail";
import { HEALTH_LOG_LINES, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { parseLogLines, summarizeCrawlHealth, type CrawlHealth } from "@/lib/logParser";

const EMPTY: CrawlHealth = { errorCount: 0, warningCount: 0, lastError: null, byPlatform: {} };

export function useCrawlHealth(enabled = true) {
  const query = useLogTail("spider-hub", HEALTH_LOG_LINES, enabled, REFRESH_INTERVAL_MS.healthLogs, enabled);
  const health = useMemo(() => {
    if (!query.data?.ok) return EMPTY;
    return summarizeCrawlHealth(parseLogLines(query.data.lines));
  }, [query.data]);

  return { ...query, health };
}
