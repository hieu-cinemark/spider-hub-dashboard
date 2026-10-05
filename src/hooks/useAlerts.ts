import { useMemo } from "react";
import { KAFKA_LAG_ALERT, kafkaLagLabel } from "@/components/KafkaLagStrip";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useJobsSnapshot, useKafkaLag } from "@/hooks/useJobs";
import { useAccounts } from "@/hooks/useSettings";
import { usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { summarizeAccounts } from "@/lib/accountPool";
import { STALE_CRAWL_MS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";

export interface DashboardAlert {
  key: string;
  level: "error" | "warning";
  text: string;
  href: string;
}

// Below this success rate (over the jobs snapshot's history, skipped
// excluded) the bell calls it out - with at least a handful of finished
// jobs, so one failure out of one doesn't page anyone.
const JOB_SUCCESS_ALERT = 50;
const JOB_SUCCESS_MIN_SAMPLE = 5;

function isStale(lastScrapedAt: string | null, now: number): boolean {
  if (!lastScrapedAt) return true;
  const then = new Date(lastScrapedAt).getTime();
  return !Number.isNaN(then) && now - then > STALE_CRAWL_MS;
}

// Everything the header bell shows, derived from queries the pages already
// run (React Query dedupes by key) - no alert state of its own.
export function useAlerts(): DashboardAlert[] {
  const { t } = useTranslation();
  const { data: lag } = useKafkaLag();
  const { data: stats, dataUpdatedAt: statsAt } = usePlatformStats();
  const { data: accounts } = useAccounts();
  const { data: jobs } = useJobsSnapshot("slow");
  const { health } = useCrawlHealth();

  return useMemo(() => {
    const out: DashboardAlert[] = [];
    for (const row of lag ?? []) {
      if (!row.error && (row.lag ?? 0) >= KAFKA_LAG_ALERT) {
        out.push({
          key: `kafka-${row.label}`,
          level: "error",
          text: t("alertKafka", { queue: kafkaLagLabel(t, row.label), n: (row.lag ?? 0).toLocaleString() }),
          href: "/jobs",
        });
      }
    }
    for (const [platform, counts] of Object.entries(health.byPlatform)) {
      if (counts.errors > 0) {
        out.push({
          key: `errors-${platform}`,
          level: "error",
          text: t("alertCrawlErrors", { platform: platformLabel(platform), n: counts.errors }),
          href: "/logs?log=spider-hub&level=error",
        });
      }
    }
    const pool = summarizeAccounts(accounts ?? []);
    const broken = pool.reduce((sum, row) => sum + row.dead + row.checkpoint, 0);
    if (broken > 0) {
      out.push({
        key: "accounts",
        level: "warning",
        text: t("alertAccounts", { n: broken }),
        href: "/settings?tab=accounts-proxies&status=dead",
      });
    }
    const history = jobs?.history ?? [];
    const done = history.filter((job) => job.status === "done").length;
    const failed = history.filter((job) => job.status === "failed").length;
    if (done + failed >= JOB_SUCCESS_MIN_SAMPLE) {
      const rate = Math.round((done / (done + failed)) * 100);
      if (rate < JOB_SUCCESS_ALERT) {
        out.push({ key: "jobs", level: "warning", text: t("alertJobs", { rate }), href: "/jobs" });
      }
    }
    for (const row of stats ?? []) {
      if (statsAt && isStale(row.last_scraped_at, statsAt)) {
        out.push({
          key: `stale-${row.platform}`,
          level: "warning",
          text: t("alertStale", { platform: platformLabel(row.platform) }),
          href: `/?tab=${row.platform}`,
        });
      }
    }
    return out;
  }, [t, lag, health, accounts, jobs, stats, statsAt]);
}
