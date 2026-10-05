"use client";

import { ClockCircleOutlined, FilterOutlined, GlobalOutlined, KeyOutlined, RobotOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import AccountsTable from "@/components/settings/AccountsTable";
import AiProvidersCard from "@/components/settings/AiProvidersCard";
import AiSettingsCard from "@/components/settings/AiSettingsCard";
import AutoLoginCard from "@/components/settings/AutoLoginCard";
import CleanupScheduleCard from "@/components/settings/CleanupScheduleCard";
import CommentScheduleCard from "@/components/settings/CommentScheduleCard";
import CrawlScheduleCard from "@/components/settings/CrawlScheduleCard";
import FilterKeywordsTable from "@/components/settings/FilterKeywordsTable";
import ProxiesTable from "@/components/settings/ProxiesTable";
import ProxyProvidersCard from "@/components/settings/ProxyProvidersCard";
import ProxySettingsCard from "@/components/settings/ProxySettingsCard";
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
                <KeyOutlined /> {t("tabAccounts")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <SettingsSummary />
                <AccountsTable />
              </div>
            ),
          },
          {
            key: "proxies",
            label: (
              <span className="inline-flex items-center gap-2">
                <GlobalOutlined /> {t("tabProxies")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <ProxiesTable />
                <ProxyProvidersCard />
                <ProxySettingsCard />
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
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <CrawlScheduleCard />
                <CommentScheduleCard />
                <CleanupScheduleCard />
                <AutoLoginCard />
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
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <AiSettingsCard />
                <AiProvidersCard />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
