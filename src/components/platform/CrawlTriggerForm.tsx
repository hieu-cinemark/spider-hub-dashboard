"use client";

import { PlayCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, InputNumber, TreeSelect } from "antd";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import AddKeywordModal, { type AddKeywordFormValues } from "@/components/AddKeywordModal";
import { useCreateKeyword, useKeywords } from "@/hooks/useKeywords";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useJobsSnapshot } from "@/hooks/useJobs";
import { useRememberQueuedKeywords } from "@/hooks/useCrawlQueue";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";

const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function CrawlTriggerForm({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords(platform);
  const createKeyword = useCreateKeyword(platform);
  const { runCrawl, stopCrawl } = useTriggerCrawl(platform);
  const rememberQueued = useRememberQueuedKeywords();
  const { data: jobStatus } = useJobStatus(platform);
  const { data: jobs } = useJobsSnapshot();

  const supportsDateRange = platform === "facebook";
  const isCollecting = Boolean(
    jobStatus?.running &&
      jobStatus.type !== "refresh_token" &&
      jobStatus.type !== "nurture" &&
      jobStatus.type !== "cookie_import",
  );
  const hasQueued = (jobs?.queued ?? []).some((row) => row.platform === platform);
  const canStopQueue = isCollecting || hasQueued;

  const [keywordId, setKeywordId] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<DateRange>(null);
  const [maxPages, setMaxPages] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const crawlableKeywords = useMemo(() => {
    const rows = keywords ?? [];
    if (platform !== "tiktok") return rows;
    return rows.filter((k) => k.keyword.startsWith("#"));
  }, [keywords, platform]);

  const keywordTreeData = useMemo(() => {
    const byMovie = new Map<string, { title: string; children: { title: string; value: string }[] }>();
    for (const k of crawlableKeywords) {
      const movieKey = k.movie_id || k.movie_title || "—";
      const group = byMovie.get(movieKey) ?? { title: k.movie_title || "—", children: [] };
      group.children.push({ title: k.keyword, value: k.id });
      byMovie.set(movieKey, group);
    }
    return [...byMovie.entries()]
      .sort((a, b) => a[1].title.localeCompare(b[1].title, undefined, { sensitivity: "base" }))
      .map(([key, group]) => ({
        title: group.title,
        value: `movie:${key}`,
        selectable: false,
        children: group.children.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
        ),
      }));
  }, [crawlableKeywords]);

  function handleRun() {
    const [start, end] = supportsDateRange ? (range ?? [null, null]) : [null, null];
    const queued = keywordId
      ? crawlableKeywords.filter((k) => k.id === keywordId)
      : crawlableKeywords;
    runCrawl.mutate(
      {
        keyword_id: keywordId,
        start_date: start ? start.format("YYYY-MM-DD") : undefined,
        end_date: end ? end.format("YYYY-MM-DD") : undefined,
        max_pages: maxPages ?? undefined,
      },
      {
        onSuccess: (res) => {
          if (res.published > 0) rememberQueued(platform, queued);
        },
      },
    );
  }

  function handleAddKeyword({ movieId, keyword }: AddKeywordFormValues) {
    createKeyword.mutate(
      { movieId, keyword: platform === "tiktok" && !keyword.trim().startsWith("#") ? `#${keyword.trim()}` : keyword.trim() },
      {
        onSuccess: (created) => {
          setKeywordId(created.id);
          setAddModalOpen(false);
        },
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {isCollecting && (
        <Alert
          type="info"
          showIcon
          message={t("jobRunningFor", { keyword: jobStatus?.keyword ?? "" })}
          action={
            <Button danger size="small" icon={<StopOutlined />} onClick={() => stopCrawl.mutate()}>
              {t("stopQueue")}
            </Button>
          }
        />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("keyword")}</span>
        <div className="flex gap-2">
          <TreeSelect
            allowClear
            showSearch
            treeDefaultExpandAll
            placeholder={t("allEnabledKeywords")}
            className="min-w-0 flex-1"
            loading={keywordsLoading}
            value={keywordId}
            onChange={(value) => setKeywordId(typeof value === "string" ? value : undefined)}
            treeNodeFilterProp="title"
            treeData={keywordTreeData}
          />
          <Button icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            {t("newKeyword")}
          </Button>
        </div>
      </label>

      <div className={`grid gap-3 ${supportsDateRange ? "sm:grid-cols-5" : ""}`}>
        {supportsDateRange && (
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("collectFormDates")}</span>
            <RangePicker
              className="w-full"
              value={range}
              onChange={(values) => setRange(values as DateRange)}
              allowEmpty={[true, true]}
            />
          </label>
        )}
        <label className={`flex flex-col gap-1.5 ${supportsDateRange ? "sm:col-span-2" : ""}`}>
          <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("maxPages")}</span>
          <InputNumber
            min={1}
            max={1000}
            className="!w-full"
            placeholder={t("maxPagesPlaceholder")}
            value={maxPages}
            onChange={(value) => setMaxPages(value)}
          />
        </label>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <Button type="primary" icon={<PlayCircleOutlined />} loading={runCrawl.isPending} onClick={handleRun} className="min-w-[160px]">
          {t("runSearchCrawl")}
        </Button>
        {canStopQueue && (
          <Button danger icon={<StopOutlined />} onClick={() => stopCrawl.mutate()}>
            {t("stopQueue")}
          </Button>
        )}
      </div>

      <AddKeywordModal
        open={addModalOpen}
        loading={createKeyword.isPending}
        onCancel={() => setAddModalOpen(false)}
        onSubmit={handleAddKeyword}
      />
    </div>
  );
}
