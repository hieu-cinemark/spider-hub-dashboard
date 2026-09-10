"use client";

import { PlayCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { Button, DatePicker, InputNumber, Select, Space, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import AddKeywordModal, { type AddKeywordFormValues } from "@/components/AddKeywordModal";
import { useCreateKeyword, useKeywords } from "@/hooks/useKeywords";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";

const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function CrawlTriggerForm({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords(platform);
  const createKeyword = useCreateKeyword(platform);
  const { runCrawl, stopCrawl } = useTriggerCrawl(platform);
  const { data: jobStatus } = useJobStatus(platform);

  const supportsDateRange = platform !== "tiktok";

  const [keywordId, setKeywordId] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<DateRange>(null);
  const [maxPages, setMaxPages] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  function handleRun() {
    const [start, end] = supportsDateRange ? (range ?? [null, null]) : [null, null];
    runCrawl.mutate({
      keyword_id: keywordId,
      start_date: start ? start.format("YYYY-MM-DD") : undefined,
      end_date: end ? end.format("YYYY-MM-DD") : undefined,
      max_pages: maxPages ?? undefined,
    });
  }

  function handleAddKeyword({ movieId, keyword }: AddKeywordFormValues) {
    createKeyword.mutate(
      { movieId, keyword: keyword.trim() },
      {
        onSuccess: (created) => {
          setKeywordId(created.id);
          setAddModalOpen(false);
        },
      },
    );
  }

  return (
    <>
      <Space wrap size="middle" align="center">
        <Select
          allowClear
          showSearch
          placeholder={t("allEnabledKeywords")}
          style={{ minWidth: 300 }}
          loading={keywordsLoading}
          value={keywordId}
          onChange={setKeywordId}
          optionFilterProp="label"
          options={(keywords ?? []).map((k) => ({
            value: k.id,
            label: `${k.keyword} — ${k.movie_title}`,
          }))}
        />
        <Button icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          {t("newKeyword")}
        </Button>
        {supportsDateRange && (
          <RangePicker value={range} onChange={(values) => setRange(values as DateRange)} allowEmpty={[true, true]} />
        )}
        <Space.Compact>
          <Button disabled>{t("maxPages")}</Button>
          <InputNumber
            min={1}
            max={1000}
            style={{ width: 100 }}
            placeholder={t("maxPagesPlaceholder")}
            value={maxPages}
            onChange={(value) => setMaxPages(value)}
          />
        </Space.Compact>
        <Button type="primary" icon={<PlayCircleOutlined />} loading={runCrawl.isPending} onClick={handleRun}>
          {t("runSearchCrawl")}
        </Button>
        {jobStatus?.running && jobStatus.type !== "refresh_token" && (
          <Button danger icon={<StopOutlined />} loading={stopCrawl.isPending} onClick={() => stopCrawl.mutate()}>
            {t("stopCrawl")}
          </Button>
        )}
      </Space>
      {jobStatus?.running && jobStatus.type !== "refresh_token" && (
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          {t("jobRunningFor", { keyword: jobStatus.keyword ?? "" })}
        </Typography.Text>
      )}

      <AddKeywordModal
        open={addModalOpen}
        loading={createKeyword.isPending}
        onCancel={() => setAddModalOpen(false)}
        onSubmit={handleAddKeyword}
      />
    </>
  );
}
