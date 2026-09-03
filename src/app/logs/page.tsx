"use client";

import { CloudServerOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import LogViewer from "@/components/LogViewer";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function LogsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <Tabs
        items={[
          {
            key: "spider-hub",
            label: (
              <span>
                <RadarChartOutlined /> {t("tabCrawlConsumer")}
              </span>
            ),
            children: <LogViewer kind="spider-hub" sourceLabel={t("tabCrawlConsumer")} />,
          },
          {
            key: "ingest",
            label: (
              <span>
                <CloudServerOutlined /> {t("tabIngestConsumer")}
              </span>
            ),
            children: <LogViewer kind="ingest" sourceLabel={t("tabIngestConsumer")} />,
          },
        ]}
      />
    </div>
  );
}
