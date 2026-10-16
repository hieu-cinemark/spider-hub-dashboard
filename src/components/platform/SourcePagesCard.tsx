"use client";

import { DeleteOutlined, GlobalOutlined, PlayCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Input, Popconfirm, Select, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useMovies } from "@/hooks/useMovies";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import type { SourcePage, SourcePageSuggestion } from "@/lib/types";

const SOURCES_KEY = ["facebook", "source-pages"];
const SUGGESTIONS_KEY = ["facebook", "source-page-suggestions"];

/** Cào theo nguồn (cinemark-api app/services/source_pages.py): bảng tin các Page Facebook. Trang của một phim -> mọi
 * bài là về phim đó; trang chung (CGV, trang review) -> hệ thống tự tìm phim theo nội dung bài. */
export default function SourcePagesCard() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: movies } = useMovies();
  const sources = useQuery({ queryKey: SOURCES_KEY, queryFn: api.sourcePages });
  const suggestions = useQuery({ queryKey: SUGGESTIONS_KEY, queryFn: api.sourcePageSuggestions, staleTime: 10 * 60_000 });
  const [url, setUrl] = useState("");
  const [movieId, setMovieId] = useState<string | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
    void queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY });
  };
  const onError = (err: Error) => message.error(err.message);
  const add = useMutation({
    mutationFn: (input: { url: string; movieId: string | null; name?: string | null }) =>
      api.addSourcePage(input.url, input.movieId, input.name),
    onSuccess: () => {
      setUrl("");
      message.success(t("sourcePagesAdded"));
      refresh();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: (row: SourcePage) => api.setSourcePageEnabled(row.id, !row.enabled),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({ mutationFn: (row: SourcePage) => api.deleteSourcePage(row.id), onSuccess: refresh, onError });
  const run = useMutation({
    mutationFn: (row: SourcePage) => api.runSourcePage(row.id),
    onSuccess: (res) => (res.published ? message.success(t("sourcePagesQueued")) : message.error(t("sourcePagesQueueFailed"))),
    onError,
  });

  const movieOptions = [
    { value: "", label: t("sourcePagesShared") },
    ...(movies ?? []).map((movie) => ({ value: movie.id, label: movie.title })),
  ];
  const kindTag = (movieTitle: string | null) =>
    movieTitle ? <Tag color="blue">{movieTitle}</Tag> : <Tag color="purple">{t("sourcePagesShared")}</Tag>;

  return (
    <DashboardCard title={<CardHeading icon={<GlobalOutlined />} title={t("sourcePagesTitle")} desc={t("sourcePagesDesc")} />}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="min-w-[260px] flex-1"
          placeholder="https://www.facebook.com/traibuonnguoi.movie.vn"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Select
          showSearch
          optionFilterProp="label"
          className="min-w-[220px]"
          value={movieId ?? ""}
          onChange={(value) => setMovieId(value || null)}
          options={movieOptions}
        />
        <Button type="primary" icon={<PlusOutlined />} loading={add.isPending} disabled={!url.trim()} onClick={() => add.mutate({ url, movieId })}>
          {t("sourcePagesAdd")}
        </Button>
      </div>

      <Table<SourcePage>
        size="small"
        rowKey="id"
        loading={sources.isLoading}
        dataSource={sources.data?.items ?? []}
        pagination={{ pageSize: 10, size: "small" }}
        scroll={{ x: 760 }}
        locale={{ emptyText: t("sourcePagesEmpty") }}
        columns={[
          {
            title: t("sourcePagesPage"),
            render: (_, row) => (
              <a href={row.url} target="_blank" rel="noreferrer" className="font-medium">
                {row.name || row.url.replace("https://www.facebook.com/", "")}
              </a>
            ),
          },
          { title: t("movie"), width: 220, render: (_, row) => kindTag(row.movie_title) },
          {
            title: t("sourcePagesAddedBy"),
            width: 120,
            render: (_, row) =>
              row.added_by === "ai" ? (
                <Tooltip title={row.ai_reason}>
                  <Tag color="geekblue">AI</Tag>
                </Tooltip>
              ) : (
                <Tag>{t("sourcePagesManual")}</Tag>
              ),
          },
          {
            title: t("sourcePagesLastQueued"),
            width: 160,
            render: (_, row) => (
              <Typography.Text type="secondary" className="text-xs">
                {row.last_queued_at ? new Date(row.last_queued_at).toLocaleString() : "—"}
                {row.quiet_runs > 0 ? ` · ${t("sourcePagesSlowed", { n: Math.min(8, 2 ** row.quiet_runs) })}` : ""}
              </Typography.Text>
            ),
          },
          {
            title: "",
            width: 200,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                <Switch size="small" checked={!!row.enabled} onChange={() => toggle.mutate(row)} />
                <Tooltip title={t("sourcePagesRun")}>
                  <Button size="small" icon={<PlayCircleOutlined />} loading={run.isPending && run.variables?.id === row.id} onClick={() => run.mutate(row)} />
                </Tooltip>
                <Popconfirm title={t("sourcePagesDeleteConfirm")} onConfirm={() => remove.mutate(row)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      <Typography.Title level={5} className="!mt-6">
        {t("sourcePagesSuggestions")}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="text-xs">
        {t("sourcePagesSuggestionsHint")}
      </Typography.Paragraph>
      <Table<SourcePageSuggestion>
        size="small"
        rowKey={(row) => `${row.kind}|${row.movie_id ?? ""}|${row.url}`}
        loading={suggestions.isLoading}
        dataSource={suggestions.data?.items ?? []}
        pagination={{ pageSize: 10, size: "small" }}
        scroll={{ x: 760 }}
        columns={[
          {
            title: t("sourcePagesPage"),
            render: (_, row) => (
              <a href={row.url} target="_blank" rel="noreferrer">
                {row.name}
              </a>
            ),
          },
          {
            title: t("movie"),
            width: 260,
            render: (_, row) =>
              row.kind === "film" ? (
                kindTag(row.movie_title)
              ) : (
                <Tooltip title={row.films.join(", ")}>
                  <Tag color="purple">{t("sourcePagesSharedFilms", { n: row.films.length })}</Tag>
                </Tooltip>
              ),
          },
          { title: t("sourcePagesPosts"), dataIndex: "posts", width: 110, align: "right" },
          {
            title: "",
            width: 90,
            render: (_, row) => (
              <Button size="small" icon={<PlusOutlined />} loading={add.isPending && add.variables?.url === row.url} onClick={() => add.mutate({ url: row.url, movieId: row.movie_id, name: row.name })}>
                {t("sourcePagesAdd")}
              </Button>
            ),
          },
        ]}
      />
    </DashboardCard>
  );
}
