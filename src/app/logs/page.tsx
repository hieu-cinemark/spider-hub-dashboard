"use client";

import { CloudServerOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import LogSummary from "@/components/LogSummary";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function LogsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useQueryParam("log", "spider-hub");
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        className="ui-tabs"
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "spider-hub",
            label: (
              <span>
                <RadarChartOutlined /> {t("tabCrawlConsumer")}
              </span>
            ),
            children: <LogSummary kind="spider-hub" sourceLabel={t("tabCrawlConsumer")} />,
          },
          {
            key: "ingest",
            label: (
              <span>
                <CloudServerOutlined /> {t("tabIngestConsumer")}
              </span>
            ),
            children: <LogSummary kind="ingest" sourceLabel={t("tabIngestConsumer")} />,
          },
        ]}
      />
    </div>
  );
}
