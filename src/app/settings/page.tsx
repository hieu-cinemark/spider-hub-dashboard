"use client";

import { ClockCircleOutlined, FilterOutlined, KeyOutlined, RobotOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import AccountsTable from "@/components/settings/AccountsTable";
import AiSettingsCard from "@/components/settings/AiSettingsCard";
import CrawlScheduleCard from "@/components/settings/CrawlScheduleCard";
import FilterKeywordsTable from "@/components/settings/FilterKeywordsTable";
import ProxiesTable from "@/components/settings/ProxiesTable";
import SettingsSummary from "@/components/settings/SettingsSummary";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useQueryParam("tab", "accounts-proxies");
  return (
    <div className="flex flex-col gap-6">
      <Tabs
        className="ui-tabs"
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "accounts-proxies",
            label: (
              <span className="inline-flex items-center gap-2">
                <KeyOutlined /> {t("tabProxyAccounts")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <SettingsSummary />
                <AccountsTable />
                <ProxiesTable />
              </div>
            ),
          },
          {
            key: "crawl-schedule",
            label: (
              <span className="inline-flex items-center gap-2">
                <ClockCircleOutlined /> {t("tabCrawlSchedule")}
              </span>
            ),
            children: (
              <div className="animate-fade-in-up">
                <CrawlScheduleCard />
              </div>
            ),
          },
          {
            key: "filter-keywords",
            label: (
              <span className="inline-flex items-center gap-2">
                <FilterOutlined /> {t("tabFilterKeywords")}
              </span>
            ),
            children: (
              <div className="animate-fade-in-up">
                <FilterKeywordsTable />
              </div>
            ),
          },
          {
            key: "ai",
            label: (
              <span className="inline-flex items-center gap-2">
                <RobotOutlined /> {t("tabAi")}
              </span>
            ),
            children: (
              <div className="animate-fade-in-up">
                <AiSettingsCard />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
