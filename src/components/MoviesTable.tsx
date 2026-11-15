"use client";

import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FireOutlined,
  PlaySquareOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Table, Tooltip } from "antd";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MovieDetailDrawer, { PosterThumb } from "@/components/MovieDetailDrawer";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import TableActions from "@/components/TableActions";
import { useMdUp } from "@/hooks/useMdUp";
import { useGenerateReportMutation, useMovieMutations, useMovies, useReportJobStatus } from "@/hooks/useMovies";
import { usePagedList } from "@/hooks/usePagedList";
import { useTranslation } from "@/i18n/LocaleProvider";
import { castList } from "@/lib/cast";
import type { Movie, MovieInput } from "@/lib/types";

const MovieFormModal = dynamic(() => import("@/components/MovieFormModal"), { ssr: false });
const TopPostsModal = dynamic(() => import("@/components/platform/TopPostsModal"), { ssr: false });

/** How many cast names fit in the table before it turns into "+N more". */
const CAST_PREVIEW = 3;

// Its own component (not inlined in `actions` below) so each row's
// useReportJobStatus poll is an independent hook instance - `actions` is a
// plain function called once per row during render, not a component, so a
// hook can't live there directly. This is also what lets several movies'
// reports run and show progress at once instead of one shared mutation
// state disabling every other row's button.
function ReportButton({ movieId, label }: { movieId: string; label: string }) {
  const generateReport = useGenerateReportMutation();
  const { data: job } = useReportJobStatus(movieId);
  const busy = job?.status === "queued" || job?.status === "running";
  return (
    <Button
      size="small"
      icon={<BarChartOutlined />}
      title={label}
      loading={busy}
      onClick={() => generateReport.mutate(movieId)}
    />
  );
}

export default function MoviesTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: movies, isLoading } = useMovies();
  const { create, update, remove } = useMovieMutations();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [topMovie, setTopMovie] = useState<Movie | null>(null);
  const [detail, setDetail] = useState<Movie | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = movies ?? [];
    if (!q) return rows;
    return rows.filter((movie) =>
      [movie.title, movie.director, movie.cast, movie.distributor, movie.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [movies, search]);

  const paging = usePagedList(filtered, search, 12);
  const pagination = paging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(movie: Movie) {
    setEditing(movie);
    setModalOpen(true);
  }

  function handleSubmit(input: MovieInput) {
    const mutation = editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input);
    mutation.then(() => setModalOpen(false));
  }

  const actions = (movie: Movie) => (
    <TableActions
      actions={[
        {
          key: "details",
          label: t("movieViewDetails"),
          icon: <EyeOutlined />,
          onClick: () => setDetail(movie),
        },
        {
          key: "edit",
          label: t("editMovie"),
          icon: <EditOutlined />,
          onClick: () => openEdit(movie),
        },
        {
          key: "top-posts",
          label: t("topPostsAction"),
          icon: <FireOutlined />,
          onClick: () => setTopMovie(movie),
        },
        {
          key: "report",
          label: t("generateReportAction"),
          element: <ReportButton movieId={movie.id} label={t("generateReportAction")} />,
        },
        {
          key: "delete",
          label: t("remove"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: {
            title: t("removeMovieConfirm"),
            onConfirm: () => remove.mutate(movie.id),
          },
        },
      ]}
    />
  );

  /**
   * The visible columns are exactly what is needed to recognise a film:
   * title (with its poster and release date), who directed it, who
   * distributed it, and who is in it. The synopsis and the long cast list
   * are one click away in the detail drawer - they used to be columns, and
   * they were what made this table wider than the screen.
   */
  const columns: ResponsiveColumnType<Movie>[] = [
    {
      title: t("movieColumnTitle"),
      dataIndex: "title",
      mobilePrimary: true,
      render: (title: string, movie: Movie) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden shrink-0 sm:block">
            <PosterThumb url={movie.poster_url} title={movie.title} />
          </span>
          <div className="min-w-0">
            <div className="truncate-1 font-medium text-[var(--ink)]" title={title}>
              {title}
            </div>
            {movie.released_at ? (
              <div className="truncate-1 text-xs text-[var(--muted)]">{movie.released_at}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: t("movieColumnDirector"),
      dataIndex: "director",
      width: 160,
      render: (value: string | null | undefined) =>
        value ? (
          <Tooltip title={value}>
            <span className="truncate-1 block text-[var(--ink-soft)]">{value}</span>
          </Tooltip>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    {
      title: t("movieColumnDistributor"),
      dataIndex: "distributor",
      width: 150,
      render: (value: string | null | undefined) =>
        value ? (
          <Tooltip title={value}>
            <span className="truncate-1 block text-[var(--ink-soft)]">{value}</span>
          </Tooltip>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    {
      title: t("movieColumnCast"),
      dataIndex: "cast",
      width: 220,
      render: (cast: string | null | undefined) => {
        const names = castList(cast);
        if (names.length === 0) return <span className="text-[var(--muted)]">—</span>;
        const shown = names.slice(0, CAST_PREVIEW);
        const rest = names.length - shown.length;
        return (
          <Tooltip title={names.join(", ")} styles={{ root: { maxWidth: 420 } }}>
            <span className="block truncate-1 text-[var(--ink-soft)]">
              {shown.join(", ")}
              {rest > 0 ? <span className="ml-1 text-[var(--muted)]">({t("movieMoreCast", { n: rest })})</span> : null}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t("actions"),
      key: "actions",
      width: 120,
      align: "right",
      render: (_: unknown, movie: Movie) => actions(movie),
    },
  ];

  return (
    <DashboardCard
      className="h-full"
      title={<CardHeading icon={<PlaySquareOutlined />} title={t("moviesTitle")} desc={t("moviesDesc")} />}
      extra={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Input.Search
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("movieSearchPlaceholder")}
            className="w-full sm:w-[220px]"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t("addMovie")}
          </Button>
        </div>
      }
    >
      {mdUp ? (
        <Table
          className="movies-table"
          size="small"
          loading={isLoading}
          rowKey="id"
          dataSource={filtered}
          pagination={pagination}
          columns={columns}
        />
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          pagination={pagination}
          empty={<Empty description={t("noMoviesYet")} />}
        />
      )}
      <MovieFormModal
        open={modalOpen}
        movie={editing}
        loading={create.isPending || update.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <MovieDetailDrawer movie={detail} onClose={() => setDetail(null)} />
      <TopPostsModal
        movieId={topMovie?.id ?? null}
        label={topMovie?.title ?? null}
        onClose={() => setTopMovie(null)}
      />
    </DashboardCard>
  );
}
