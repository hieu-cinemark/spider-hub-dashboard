"use client";

import { CloudServerOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import PageHeader from "@/components/PageHeader";
import LogViewer from "@/components/LogViewer";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function LogsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("logsTitle")} description={t("logsDescription")} />

      <Tabs
        items={[
          {
            key: "spider-hub",
            label: (
              <span>
                <RadarChartOutlined /> {t("tabCrawlConsumer")}
              </span>
            ),
            children: <LogViewer kind="spider-hub" sourceLabel="spider-hub crawl_request_consumer.py" />,
          },
          {
            key: "ingest",
            label: (
              <span>
                <CloudServerOutlined /> {t("tabIngestConsumer")}
              </span>
            ),
            children: <LogViewer kind="ingest" sourceLabel="cinemark-api ingest_consumer" />,
          },
        ]}
      />
    </div>
  );
}
