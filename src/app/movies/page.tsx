"use client";

import PageHeader from "@/components/PageHeader";
import MoviesTable from "@/components/MoviesTable";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function MoviesPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[calc(100vh-76px-56px)] flex-col gap-5">
      <PageHeader title={t("navMovies")} description={t("moviesDesc")} />
      <MoviesTable />
    </div>
  );
}
