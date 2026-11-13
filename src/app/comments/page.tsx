"use client";

import PageHeader from "@/components/PageHeader";
import CommentsReview from "@/components/platform/CommentsReview";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function CommentsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("navComments")} description={t("commentsPageDesc")} />
      <CommentsReview />
    </div>
  );
}
