"use client";

import { CloudServerOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import PageHeader from "@/components/PageHeader";
import LogViewer from "@/components/LogViewer";

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Logs"
        description="Tails the two structlog console logs behind the crawl pipeline, read straight off disk by cinemark-api."
      />

      <Tabs
        items={[
          {
            key: "spider-hub",
            label: (
              <span>
                <RadarChartOutlined /> Crawl consumer (spider-hub)
              </span>
            ),
            children: <LogViewer kind="spider-hub" sourceLabel="spider-hub crawl_request_consumer.py" />,
          },
          {
            key: "ingest",
            label: (
              <span>
                <CloudServerOutlined /> Ingest consumer (cinemark-api)
              </span>
            ),
            children: <LogViewer kind="ingest" sourceLabel="cinemark-api ingest_consumer" />,
          },
        ]}
      />
    </div>
  );
}
