import type { ReactNode } from "react";

// Shared page-level header (bold title + gray subtitle, optional
// right-aligned actions) - used at the top of every top-level page instead
// of each page inventing its own heading markup.
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#141414] sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-[#8c8c8c]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
