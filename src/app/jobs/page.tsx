"use client";

import PageHeader from "@/components/PageHeader";
import JobsPageView from "@/components/JobsPageView";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function JobsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("navJobs")} description={t("jobsPageLead")} />
      <JobsPageView />
    </div>
  );
}
