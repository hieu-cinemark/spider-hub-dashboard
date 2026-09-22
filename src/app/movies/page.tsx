"use client";

import MoviesTable from "@/components/MoviesTable";

export default function MoviesPage() {
  return (
    <div className="flex min-h-[calc(100vh-76px-56px)] flex-col">
      <MoviesTable />
    </div>
  );
}
