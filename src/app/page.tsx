"use client";

import PageHeader from "@/components/PageHeader";
import PlatformTabs from "@/components/platform/PlatformTabs";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function OverviewPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("overviewTitle")} description={t("overviewDescription")} />
      <PlatformTabs />
    </div>
  );
}
