"use client";

import { FireOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Button, Input, Popconfirm, Select, Switch, Table, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { VolumeMetric } from "@/components/CountDelta";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import PlatformBadge from "@/components/PlatformBadge";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import TopPostsModal from "@/components/platform/TopPostsModal";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useKeywordVolume } from "@/hooks/useStats";
import { useCreateKeyword, useSetKeywordEnabled } from "@/hooks/useKeywords";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { KeywordVolume, RelatedHashtag } from "@/lib/types";

type EnabledFilter = "all" | "enabled" | "disabled";

type MovieTreeRow = {
  key: string;
  kind: "movie";
  movie_id: string;
  movie_title: string;
  keyword_count: number;
  enabled_count: number;
  posts_total: number;
  posts_today: number;
  posts_prev: number;
  comments_total: number;
  comments_today: number;
  comments_prev: number;
  last_scraped_at: string | null;
  children: KeywordTreeRow[];
};

type KeywordTreeRow = KeywordVolume & {
  key: string;
  kind: "keyword";
};

type TreeRow = MovieTreeRow | KeywordTreeRow;

function KeywordEnabledToggle({ row }: { row: KeywordVolume }) {
  const setEnabled = useSetKeywordEnabled(row.platform);
  return (
    <Switch
      size="small"
      checked={row.enabled}
      loading={setEnabled.isPending}
      onChange={(checked) => setEnabled.mutate({ keywordId: row.keyword_id, enabled: checked })}
    />
  );
}

function RelatedHashtagChips({ row }: { row: KeywordVolume }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const createKeyword = useCreateKeyword(row.platform);
  const { runCrawl } = useTriggerCrawl(row.platform);
  const tags = row.related_hashtags ?? [];
  if (!tags.length || !row.movie_id) return null;

  function adopt(tag: RelatedHashtag) {
    const hashtag = tag.title.startsWith("#") ? tag.title : `#${tag.title}`;
    const bfsDepth = tag.bfs_depth && tag.bfs_depth > 0 ? tag.bfs_depth : 1;
    createKeyword.mutate(
      { movieId: row.movie_id as string, keyword: hashtag },
      {
        onSuccess: (created) => {
          runCrawl.mutate({ keyword_id: created.id, bfs_depth: bfsDepth });
          message.success(t("toastRelatedHashtagQueued", { hashtag }));
        },
      },
    );
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="cell-secondary">{t("relatedHashtagsLabel")}</span>
      {tags.map((tag) => (
        <Popconfirm
          key={`${tag.id}-${tag.title}`}
          title={t("adoptRelatedHashtag")}
          description={t("confirmRelatedHashtagDesc")}
          onConfirm={() => adopt(tag)}
        >
          <Tag className="!m-0 cursor-pointer">
            #{tag.title}
            {tag.count > 0 ? ` · ${tag.count}` : ""}
          </Tag>
        </Popconfirm>
      ))}
    </div>
  );
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function buildMovieTree(rows: KeywordVolume[]): MovieTreeRow[] {
  const byMovie = new Map<string, KeywordVolume[]>();
  for (const row of rows) {
    const movieId = row.movie_id || `__none__:${row.movie_title || row.keyword_id}`;
    const list = byMovie.get(movieId) ?? [];
    list.push(row);
    byMovie.set(movieId, list);
  }

  const trees: MovieTreeRow[] = [];
  for (const [movieId, keywords] of byMovie) {
    const title = keywords[0]?.movie_title?.trim() || "—";
    keywords.sort((a, b) => a.keyword.localeCompare(b.keyword, undefined, { sensitivity: "base" }));
    trees.push({
      key: `movie:${movieId}`,
      kind: "movie",
      movie_id: movieId,
      movie_title: title,
      keyword_count: keywords.length,
      enabled_count: keywords.filter((k) => k.enabled).length,
      posts_total: keywords.reduce((sum, k) => sum + k.posts_total, 0),
      posts_today: keywords.reduce((sum, k) => sum + k.posts_today, 0),
      posts_prev: keywords.reduce((sum, k) => sum + k.posts_prev, 0),
      comments_total: keywords.reduce((sum, k) => sum + k.comments_total, 0),
      comments_today: keywords.reduce((sum, k) => sum + k.comments_today, 0),
      comments_prev: keywords.reduce((sum, k) => sum + k.comments_prev, 0),
      last_scraped_at: keywords.reduce<string | null>((latest, k) => maxIso(latest, k.last_scraped_at), null),
      children: keywords.map((k) => ({
        ...k,
        key: `keyword:${k.keyword_id}`,
        kind: "keyword" as const,
      })),
    });
  }

  trees.sort((a, b) => a.movie_title.localeCompare(b.movie_title, undefined, { sensitivity: "base" }));
  return trees;
}

function filterKeywords(
  rows: KeywordVolume[],
  query: string,
  enabledFilter: EnabledFilter,
): KeywordVolume[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (enabledFilter === "enabled" && !row.enabled) return false;
    if (enabledFilter === "disabled" && row.enabled) return false;
    if (!q) return true;
    return (
      row.keyword.toLowerCase().includes(q) ||
      (row.movie_title ?? "").toLowerCase().includes(q) ||
      row.platform.toLowerCase().includes(q)
    );
  });
}

export default function KeywordVolumeTable({ platform }: { platform?: string }) {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data, isLoading } = useKeywordVolume(platform);
  const [topPostsTarget, setTopPostsTarget] = useState<{
    keywordId?: string | null;
    movieId?: string | null;
    label: string;
    platform?: string | null;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");

  const filteredKeywords = useMemo(
    () => filterKeywords(data ?? [], search, enabledFilter),
    [data, search, enabledFilter],
  );
  const treeData = useMemo(() => buildMovieTree(filteredKeywords), [filteredKeywords]);
  const filterKey = `${search}|${enabledFilter}|${platform ?? "all"}`;
  const pagingState = usePagedList(treeData, filterKey);
  const paging = pagingState.paging((n) => t("keywordTreeMovieTotal", { n: n.toLocaleString() }));
  const pagedTree = pagingState.paged;

  function openKeywordTopPosts(row: KeywordVolume) {
    setTopPostsTarget({
      keywordId: row.keyword_id,
      movieId: null,
      label: row.keyword,
      platform: row.platform,
    });
  }

  function openMovieTopPosts(row: MovieTreeRow) {
    const movieId = row.movie_id.startsWith("__none__") ? null : row.movie_id;
    if (!movieId) return;
    setTopPostsTarget({
      keywordId: null,
      movieId,
      label: row.movie_title,
      platform: platform ?? null,
    });
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<SearchOutlined />} title={t("keywordVolumeTitle")} desc={t("keywordVolumeDesc")} />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[var(--muted)]" />}
          placeholder={t("keywordTreeSearchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 sm:max-w-[360px]"
        />
        <Select<EnabledFilter>
          value={enabledFilter}
          onChange={setEnabledFilter}
          className="w-[160px]"
          options={[
            { value: "all", label: t("keywordTreeFilterAll") },
            { value: "enabled", label: t("keywordTreeFilterEnabled") },
            { value: "disabled", label: t("keywordTreeFilterDisabled") },
          ]}
        />
        <Typography.Text type="secondary" className="text-sm">
          {t("keywordTreeSummary", {
            movies: treeData.length.toLocaleString(),
            keywords: filteredKeywords.length.toLocaleString(),
          })}
        </Typography.Text>
      </div>

      {mdUp ? (
        isLoading && !data ? (
          <TableRowsSkeleton />
        ) : (
          <Table<TreeRow>
            key={filterKey}
            size="middle"
            loading={isLoading}
            rowKey="key"
            dataSource={pagedTree}
            pagination={paging}
            expandable={{
              defaultExpandAllRows: true,
              rowExpandable: (row) => row.kind === "movie",
            }}
            locale={{ emptyText: t("keywordTreeEmpty") }}
            columns={[
              {
                title: t("columnMovieKeyword"),
                key: "label",
                render: (_: unknown, row: TreeRow) =>
                  row.kind === "movie" ? (
                    <div className="cell-stack min-w-0 py-0.5">
                      <div className="cell-primary truncate font-semibold">{row.movie_title}</div>
                      <div className="cell-secondary truncate">
                        {t("keywordTreeMovieMeta", {
                          keywords: row.keyword_count,
                          enabled: row.enabled_count,
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="cell-stack min-w-0 py-0.5 pl-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <PlatformBadge platform={row.platform} size={20} showLabel={false} />
                        <span className="cell-primary truncate">{row.keyword}</span>
                      </div>
                      <RelatedHashtagChips row={row} />
                    </div>
                  ),
              },
              {
                title: t("columnPostsCollected"),
                key: "posts",
                width: 160,
                align: "right",
                render: (_: unknown, row: TreeRow) => (
                  <VolumeMetric total={row.posts_total} today={row.posts_today} previous={row.posts_prev} />
                ),
              },
              {
                title: t("columnCommentsCollected"),
                key: "comments",
                width: 160,
                align: "right",
                render: (_: unknown, row: TreeRow) => (
                  <VolumeMetric total={row.comments_total} today={row.comments_today} previous={row.comments_prev} />
                ),
              },
              {
                title: t("columnLastScraped"),
                key: "last_scraped_at",
                width: 128,
                render: (_: unknown, row: TreeRow) => (
                  <span className="cell-meta">{formatRelativeTime(row.last_scraped_at, t)}</span>
                ),
              },
              {
                title: t("enabled"),
                key: "enabled",
                width: 100,
                align: "center",
                render: (_: unknown, row: TreeRow) =>
                  row.kind === "keyword" ? <KeywordEnabledToggle row={row} /> : null,
              },
              {
                key: "topPosts",
                width: 52,
                align: "center",
                render: (_: unknown, row: TreeRow) =>
                  row.kind === "keyword" ? (
                    <Button
                      type="text"
                      icon={<FireOutlined />}
                      title={t("topPostsAction")}
                      onClick={() => openKeywordTopPosts(row)}
                    />
                  ) : row.movie_id.startsWith("__none__") ? null : (
                    <Button
                      type="text"
                      icon={<FireOutlined />}
                      title={t("topPostsAction")}
                      onClick={() => openMovieTopPosts(row)}
                    />
                  ),
              },
            ]}
          />
        )
      ) : (
        <ItemCardList
          items={pagedTree}
          loading={isLoading}
          rowKey={(row) => row.key}
          pagination={paging}
          empty={t("keywordTreeEmpty")}
        >
          {(movie) => (
            <ItemCard>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Typography.Text strong className="block truncate">
                    {movie.movie_title}
                  </Typography.Text>
                  <Typography.Text type="secondary" className="text-xs">
                    {t("keywordTreeMovieMeta", {
                      keywords: movie.keyword_count,
                      enabled: movie.enabled_count,
                    })}
                  </Typography.Text>
                </div>
                {!movie.movie_id.startsWith("__none__") ? (
                  <Button
                    type="text"
                    size="small"
                    icon={<FireOutlined />}
                    title={t("topPostsAction")}
                    onClick={() => openMovieTopPosts(movie)}
                  />
                ) : null}
              </div>
              <ItemField label={t("columnPostsCollected")}>
                <VolumeMetric total={movie.posts_total} today={movie.posts_today} previous={movie.posts_prev} />
              </ItemField>
              <ItemField label={t("columnCommentsCollected")}>
                <VolumeMetric
                  total={movie.comments_total}
                  today={movie.comments_today}
                  previous={movie.comments_prev}
                />
              </ItemField>
              <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                {movie.children.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-lg px-3 py-2"
                    style={{ background: "color-mix(in srgb, var(--line) 35%, transparent)" }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <PlatformBadge platform={row.platform} size={18} showLabel={false} />
                        <Typography.Text className="min-w-0 truncate">{row.keyword}</Typography.Text>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="text"
                          size="small"
                          icon={<FireOutlined />}
                          title={t("topPostsAction")}
                          onClick={() => openKeywordTopPosts(row)}
                        />
                        <KeywordEnabledToggle row={row} />
                      </div>
                    </div>
                    <RelatedHashtagChips row={row} />
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                      <span>
                        {t("columnPostsCollected")}: {row.posts_total.toLocaleString()}
                      </span>
                      <span>
                        {t("columnCommentsCollected")}: {row.comments_total.toLocaleString()}
                      </span>
                      <span>{formatRelativeTime(row.last_scraped_at, t)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ItemCard>
          )}
        </ItemCardList>
      )}

      <TopPostsModal
        keywordId={topPostsTarget?.keywordId ?? null}
        movieId={topPostsTarget?.movieId ?? null}
        label={topPostsTarget?.label ?? null}
        platform={topPostsTarget?.platform ?? null}
        onClose={() => setTopPostsTarget(null)}
      />
    </DashboardCard>
  );
}
