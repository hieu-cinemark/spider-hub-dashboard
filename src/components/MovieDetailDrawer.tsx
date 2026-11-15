"use client";

import { PlaySquareOutlined } from "@ant-design/icons";
import DetailDrawer from "@/components/ui/DetailDrawer";
import { DetailRow, DetailSection } from "@/components/ui/CopyableValue";
import { useTranslation } from "@/i18n/LocaleProvider";
import { castList } from "@/lib/cast";
import type { Movie } from "@/lib/types";

/**
 * The full record of one film.
 *
 * The table only shows what is needed to pick a film (title, director,
 * distributor, a couple of cast names). Everything else - the synopsis, the
 * complete cast, the technical fields - lives here, so the table stays
 * narrow without hiding any data.
 */
export default function MovieDetailDrawer({
  movie,
  onClose,
}: {
  movie: Movie | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!movie) return null;

  const cast = castList(movie.cast);

  return (
    <DetailDrawer
      open
      onClose={onClose}
      width={560}
      title={movie.title}
      subtitle={movie.released_at ?? undefined}
      extra={
        movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={t("moviePosterAlt", { title: movie.title })}
            className="h-14 w-10 shrink-0 rounded-md border border-[var(--line)] object-cover"
          />
        ) : null
      }
    >
      <DetailSection title={t("columnMovieKeyword")}>
        <DetailRow label={t("movieColumnTitle")}>{movie.title}</DetailRow>
        <DetailRow label={t("movieColumnReleasedAt")}>{movie.released_at || "—"}</DetailRow>
        <DetailRow label={t("movieColumnDirector")}>{movie.director || "—"}</DetailRow>
        <DetailRow label={t("movieColumnDistributor")}>{movie.distributor || "—"}</DetailRow>
      </DetailSection>

      <DetailSection title={t("movieSynopsis")}>
        {movie.description ? (
          <p className="m-0 text-[13.5px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">
            {movie.description}
          </p>
        ) : (
          <p className="m-0 text-[13.5px] text-[var(--muted)]">{t("movieNoSynopsis")}</p>
        )}
      </DetailSection>

      <DetailSection title={t("movieCastFull")}>
        {cast.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {cast.map((name) => (
              <span
                key={name}
                className="rounded-md border border-[var(--line)] bg-[var(--paper-deep)] px-2 py-1 text-[12.5px] text-[var(--ink)]"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="m-0 text-[13.5px] text-[var(--muted)]">{t("movieNoCast")}</p>
        )}
      </DetailSection>

      <DetailSection title={t("accountTechnicalSection")}>
        <DetailRow label={t("movieFieldSlug")} mono>
          {movie.slug || "—"}
        </DetailRow>
        <DetailRow label={t("movieFieldPosterUrl")} mono>
          {movie.poster_url || "—"}
        </DetailRow>
        <DetailRow label="ID" mono>
          {movie.id}
        </DetailRow>
      </DetailSection>
    </DetailDrawer>
  );
}

/** Small poster used in the table's first column. */
export function PosterThumb({ url, title }: { url?: string | null; title: string }) {
  if (!url) {
    return (
      <span className="flex h-[46px] w-[32px] items-center justify-center rounded-md bg-[var(--paper-deep)] text-[var(--muted)]">
        <PlaySquareOutlined />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      className="h-[46px] w-[32px] rounded-md border border-[var(--line)] object-cover"
      loading="lazy"
      onError={(event) => {
        // A dead poster URL must not leave a broken image in the row.
        event.currentTarget.style.display = "none";
      }}
    />
  );
}
