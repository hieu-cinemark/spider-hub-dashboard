"use client";

import PageHeader from "@/components/PageHeader";
import PostsReview from "@/components/platform/PostsReview";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function PostsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("navPosts")} description={t("postsPageDesc")} />
      <PostsReview />
    </div>
  );
}
