"use client";

import { BarChartOutlined, DeleteOutlined, EditOutlined, FireOutlined, PlaySquareOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Popconfirm, Table, Typography } from "antd";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";

import { useMdUp } from "@/hooks/useMdUp";
import { useGenerateReportMutation, useMovieMutations, useMovies, useReportJobStatus } from "@/hooks/useMovies";
import { usePagedList } from "@/hooks/usePagedList";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatCast } from "@/lib/cast";
import type { Movie, MovieInput } from "@/lib/types";

const { Text } = Typography;
const MovieFormModal = dynamic(() => import("@/components/MovieFormModal"), { ssr: false });
const TopPostsModal = dynamic(() => import("@/components/platform/TopPostsModal"), { ssr: false });

function PosterThumb({ url, title }: { url?: string | null; title: string }) {
  if (!url) {
    return (
      <span className="flex h-[52px] w-[36px] items-center justify-center rounded-md bg-[var(--paper-deep)] text-[var(--muted)]">
        <PlaySquareOutlined />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      className="h-[52px] w-[36px] rounded-md object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

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
    <div className="flex justify-end gap-1">
      <Button
        size="small"
        icon={<FireOutlined />}
        title={t("topPostsAction")}
        onClick={() => setTopMovie(movie)}
      />
      <ReportButton movieId={movie.id} label={t("generateReportAction")} />
      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(movie)} />
      <Popconfirm
        title={t("removeMovieConfirm")}
        onConfirm={() => remove.mutate(movie.id)}
        okText={t("remove")}
        okButtonProps={{ danger: true }}
      >
        <Button size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </div>
  );

  // Every column is kept - no `ellipsis` anywhere, so the desktop table
  // wraps long values instead of hiding them behind a "...". The same
  // definition drives the mobile card layout (see MobileTable), so the
  // phone shows exactly the same fields, in full.
  const columns: ResponsiveColumnType<Movie>[] = [
    {
      title: t("movieColumnPoster"),
      dataIndex: "poster_url",
      width: 56,
      mobileHidden: true,
      render: (url: Movie["poster_url"], movie: Movie) => <PosterThumb url={url} title={movie.title} />,
    },
    {
      title: t("movieColumnTitle"),
      dataIndex: "title",
      mobilePrimary: true,
      render: (title: string, movie: Movie) => (
        <div className="min-w-0">
          <div className="font-medium break-words">{title}</div>
          {movie.released_at ? (
            <Text type="secondary" className="text-xs">
              {movie.released_at}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t("movieColumnDirector"),
      dataIndex: "director",
      width: 120,
      render: (value: string) => value || "—",
    },
    {
      title: t("movieColumnCast"),
      dataIndex: "cast",
      render: (cast: string) => formatCast(cast) || "—",
    },
    {
      title: t("movieColumnDistributor"),
      dataIndex: "distributor",
      width: 120,
      render: (value: string) => value || "—",
    },
    {
      title: t("movieColumnDescription"),
      dataIndex: "description",
      width: 240,
      render: (description: Movie["description"]) => (
        <div className="whitespace-pre-line break-words">{description || "—"}</div>
      ),
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
            className="w-[200px]"
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
      <TopPostsModal
        movieId={topMovie?.id ?? null}
        label={topMovie?.title ?? null}
        onClose={() => setTopMovie(null)}
      />
    </DashboardCard>
  );
}
