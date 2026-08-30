"use client";

import PageHeader from "@/components/PageHeader";
import PostsReview from "@/components/platform/PostsReview";

export default function PostsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Posts" description="Recently scraped posts across every platform, newest first." />
      <PostsReview />
    </div>
  );
}
