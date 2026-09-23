"use client";

import { BarChartOutlined, DeleteOutlined, EditOutlined, FireOutlined, PlaySquareOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import MovieFormModal from "@/components/MovieFormModal";
import TopPostsModal from "@/components/platform/TopPostsModal";
import { useMdUp } from "@/hooks/useMdUp";
import { useGenerateReportMutation, useMovieMutations, useMovies } from "@/hooks/useMovies";
import { usePagedList } from "@/hooks/usePagedList";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { Movie, MovieInput } from "@/lib/types";

const { Paragraph, Text } = Typography;

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

export default function MoviesTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: movies, isLoading } = useMovies();
  const { create, update, remove } = useMovieMutations();
  const generateReport = useGenerateReportMutation();
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
      <Button
        size="small"
        icon={<BarChartOutlined />}
        title={t("generateReportAction")}
        loading={generateReport.isPending && generateReport.variables === movie.id}
        disabled={generateReport.isPending && generateReport.variables !== movie.id}
        onClick={() => generateReport.mutate(movie.id)}
      />
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
          columns={[
            {
              title: t("movieColumnPoster"),
              dataIndex: "poster_url",
              width: 56,
              render: (url: Movie["poster_url"], movie: Movie) => <PosterThumb url={url} title={movie.title} />,
            },
            {
              title: t("movieColumnTitle"),
              dataIndex: "title",
              width: 180,
              ellipsis: true,
              render: (title: string, movie: Movie) => (
                <div className="min-w-0">
                  <div className="truncate font-medium">{title}</div>
                  {movie.released_at ? (
                    <Text type="secondary" className="text-xs">
                      {movie.released_at}
                    </Text>
                  ) : null}
                </div>
              ),
            },
            { title: t("movieColumnDirector"), dataIndex: "director", width: 120, ellipsis: true },
            { title: t("movieColumnCast"), dataIndex: "cast", ellipsis: true },
            { title: t("movieColumnDistributor"), dataIndex: "distributor", width: 120, ellipsis: true },
            {
              title: t("movieColumnDescription"),
              dataIndex: "description",
              width: 220,
              render: (description: Movie["description"]) =>
                description ? (
                  <Paragraph ellipsis={{ rows: 2, tooltip: description }} className="!mb-0">
                    {description}
                  </Paragraph>
                ) : null,
            },
            {
              title: t("actions"),
              key: "actions",
              width: 120,
              align: "right",
              render: (_: unknown, movie: Movie) => actions(movie),
            },
          ]}
        />
      ) : (
        <ItemCardList items={filtered} loading={isLoading} rowKey={(movie) => movie.id} pagination={pagination}>
          {(movie: Movie) => (
            <ItemCard>
              <div className="mb-2 flex items-start gap-3">
                <PosterThumb url={movie.poster_url} title={movie.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{movie.title}</span>
                    {actions(movie)}
                  </div>
                  {movie.released_at ? <div className="text-xs text-[var(--muted)]">{movie.released_at}</div> : null}
                </div>
              </div>
              {movie.director && <ItemField label={t("movieColumnDirector")}>{movie.director}</ItemField>}
              {movie.cast && <ItemField label={t("movieColumnCast")}>{movie.cast}</ItemField>}
              {movie.distributor && <ItemField label={t("movieColumnDistributor")}>{movie.distributor}</ItemField>}
              {movie.description && <ItemField label={t("movieColumnDescription")}>{movie.description}</ItemField>}
            </ItemCard>
          )}
        </ItemCardList>
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
