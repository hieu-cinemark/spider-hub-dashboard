"use client";

import { PlayCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Select, Space } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import AddKeywordModal, { type AddKeywordFormValues } from "@/components/AddKeywordModal";
import { useCreateKeyword, useKeywords } from "@/hooks/useKeywords";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";

const { RangePicker } = DatePicker;

type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function CrawlTriggerForm({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords(platform);
  const createKeyword = useCreateKeyword(platform);
  const { runCrawl } = useTriggerCrawl(platform);

  const [keywordId, setKeywordId] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<DateRange>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  function handleRun() {
    const [start, end] = range ?? [null, null];
    runCrawl.mutate({
      keyword_id: keywordId,
      start_date: start ? start.format("YYYY-MM-DD") : undefined,
      end_date: end ? end.format("YYYY-MM-DD") : undefined,
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
        <RangePicker value={range} onChange={(values) => setRange(values as DateRange)} allowEmpty={[true, true]} />
        <Button type="primary" icon={<PlayCircleOutlined />} loading={runCrawl.isPending} onClick={handleRun}>
          {t("runSearchCrawl")}
        </Button>
      </Space>

      <AddKeywordModal
        open={addModalOpen}
        loading={createKeyword.isPending}
        onCancel={() => setAddModalOpen(false)}
        onSubmit={handleAddKeyword}
      />
    </>
  );
}
