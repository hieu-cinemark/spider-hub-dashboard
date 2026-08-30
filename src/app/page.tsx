"use client";

import PageHeader from "@/components/PageHeader";
import PlatformTabs from "@/components/platform/PlatformTabs";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description="System metrics and platform collection status." />
      <PlatformTabs />
    </div>
  );
}
