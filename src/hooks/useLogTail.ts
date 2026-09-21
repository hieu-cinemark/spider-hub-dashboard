import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { usePollingInterval } from "@/hooks/usePollingInterval";

export function useLogTail(
  kind: "spider-hub" | "ingest",
  lines: number,
  autoRefresh: boolean,
  intervalMs: number = REFRESH_INTERVAL_MS.logs,
  enabled = true,
) {
  const refetchInterval = usePollingInterval(intervalMs, autoRefresh && enabled);
  return useQuery({
    queryKey: QUERY_KEYS.logs(kind, lines),
    queryFn: () => (kind === "spider-hub" ? api.spiderHubLogs(lines) : api.ingestLogs(lines)),
    enabled,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
}
