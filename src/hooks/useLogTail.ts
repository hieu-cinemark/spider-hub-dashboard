import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";

export function useLogTail(kind: "spider-hub" | "ingest", lines: number, autoRefresh: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.logs(kind, lines),
    queryFn: () => (kind === "spider-hub" ? api.spiderHubLogs(lines) : api.ingestLogs(lines)),
    refetchInterval: autoRefresh ? REFRESH_INTERVAL_MS.logs : false,
  });
}
