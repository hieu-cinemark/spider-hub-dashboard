"use client";

import { ApiOutlined, BarChartOutlined, CommentOutlined, DeleteOutlined, FireOutlined, PauseCircleOutlined, PlayCircleOutlined, SearchOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Checkbox, Input, Progress, Select, Space, Table, Tag, Tooltip, TreeSelect, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useTranslation } from "@/i18n/LocaleProvider";
import { useMovies } from "@/hooks/useMovies";
import { useKeywords } from "@/hooks/useKeywords";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { OmarHashtagProgress, OmarSearchQuery } from "@/lib/types";
import Hint from "@/components/Hint";

// Tab Omar (Settings): key Omar API, hạn mức của gói, lượt cào hashtag TikTok đang chạy (Chạy ngay / Dừng) và tiến độ
// từng hashtag - xem cinemark-api app/services/omar_tiktok.py và app/api/routes/omar.py.

const STATUS_KEY = ["omar", "status"] as const;

function fmtNumber(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString();
}

const WEEKDAYS = {
  vi: ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

function fmtDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function OmarTab() {
  const { t, locale } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const movies = useMovies();
  const [tagMovie, setTagMovie] = useState<string | undefined>();
  const [newTag, setNewTag] = useState("");
  const [channel, setChannel] = useState("");
  const [searchMovie, setSearchMovie] = useState<string | undefined>();
  const [newQuery, setNewQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const yieldQuery = useQuery({ queryKey: ["omar", "yield"], queryFn: () => api.omarYield(7), refetchInterval: 5 * 60_000 });
  const trending = useQuery({ queryKey: ["omar", "trending"], queryFn: () => api.omarTrending(24), refetchInterval: 10 * 60_000 });
  const search = useQuery({ queryKey: ["omar", "search"], queryFn: api.omarSearch, refetchInterval: 60_000 });
  const refreshSearch = () => queryClient.invalidateQueries({ queryKey: ["omar", "search"] });
  // Thêm câu tìm cho một phim - tìm ngay, các ngày sau tìm cùng lượt Omar (POST /omar/search).
  const addQuery = useMutation({
    mutationFn: () => api.omarAddSearch(searchMovie!, newQuery.trim()),
    onSuccess: () => {
      message.success(t("omarSearchAdded", { query: newQuery.trim() }));
      setNewQuery("");
      refreshSearch();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const deleteQuery = useMutation({
    mutationFn: (id: string) => api.omarDeleteSearch(id),
    onSuccess: refreshSearch,
    onError: (err: Error) => message.error(err.message),
  });

  const status = useQuery({
    queryKey: STATUS_KEY,
    queryFn: api.omarStatus,
    refetchInterval: (query) => (query.state.data?.round.running ? 10_000 : 60_000),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: STATUS_KEY });

  const run = useMutation({
    mutationFn: api.omarRun,
    onSuccess: (res) => {
      if (res.started) message.success(t("omarRunStarted"));
      else message.info(t("omarAlreadyRunning"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const stop = useMutation({
    mutationFn: api.omarStop,
    onSuccess: (res) => {
      if (res.stopping) message.success(t("omarStopRequested"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const runComments = useMutation({
    mutationFn: api.omarCommentsRun,
    onSuccess: (res) => {
      message.success(t("omarCommentsQueued", { queued: fmtNumber(res.queued), pending: fmtNumber(res.pending) }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Người dùng tự gõ hashtag cho một phim: kiểm tra có trên TikTok, tạo từ khoá rồi cào ngay tới hết (POST /omar/hashtags).
  const addTag = useMutation({
    mutationFn: () => api.omarAddHashtag(tagMovie!, newTag.trim()),
    onSuccess: (res) => {
      setNewTag("");
      message.success(t(res.started ? "omarTagAdded" : "omarTagAlreadyRunning", { tag: res.keyword.keyword }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Cào ngay một kênh TikTok qua Omar /posts (POST /tiktok/channels/run).
  const crawlChannel = useMutation({
    mutationFn: () => api.runChannelVideos({ username: channel.trim() }),
    onSuccess: (res) => {
      if (res.published) {
        message.success(t("omarChannelStarted", { handle: channel.trim().replace(/^@/, "") }));
        setChannel("");
      } else message.error(t("omarChannelInvalid"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const saveKey = useMutation({
    mutationFn: (key: string) => api.setOmarApiKey(key),
    onSuccess: () => {
      setNewKey("");
      message.success(t("omarKeySaved"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const data = status.data;
  const usage = data?.usage;
  const round = data?.round;
  const day = usage?.day;
  const dayPct = day?.limit ? Math.round((day.used / day.limit) * 100) : 0;
  const comments = data?.comments;
  const job = comments?.last;

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard
        loading={status.isLoading}
        title={<CardHeading icon={<ApiOutlined />} title={t("omarTitle")} desc={t("omarDesc")} />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong>{t("omarKey")}</Typography.Text>
              {data?.key_set ? <Tag color="green">{t("omarKeySet")}</Tag> : <Tag color="red">{t("omarKeyMissing")}</Tag>}
              {usage?.plan && <Tag>{usage.plan}</Tag>}
              {usage?.status && <Tag color={usage.status === "active" ? "blue" : "orange"}>{usage.status}</Tag>}
            </div>
            <Space.Compact className="w-full">
              <Input.Password
                placeholder={t("omarKeyPlaceholder")}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                autoComplete="off"
              />
              <Button type="primary" disabled={!newKey.trim()} loading={saveKey.isPending} onClick={() => saveKey.mutate(newKey.trim())}>
                {t("save")}
              </Button>
            </Space.Compact>
            {usage?.expires_at && (
              <Typography.Text type="secondary" className="text-xs">
                {t("omarExpires", { date: new Date(usage.expires_at).toLocaleDateString() })}
              </Typography.Text>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Typography.Text strong>{t("omarQuotaToday")}</Typography.Text>
            {day ? (
              <>
                <Progress percent={dayPct} status={dayPct >= 100 ? "exception" : "active"} />
                <Typography.Text type="secondary" className="text-xs">
                  {t("omarQuotaLine", {
                    used: fmtNumber(day.used),
                    limit: fmtNumber(day.limit),
                    remaining: fmtNumber(day.remaining),
                    reset: fmtDuration(day.resets_in),
                    perMinute: fmtNumber(usage?.minute?.limit),
                  })}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text type="secondary">{t("omarQuotaUnknown")}</Typography.Text>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--line)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={run.isPending}
              disabled={!data?.key_set || round?.running}
              onClick={() => run.mutate()}
            >
              {t("omarRunNow")}
            </Button>
            <Button danger icon={<PauseCircleOutlined />} loading={stop.isPending} disabled={!round?.running || round?.stop_requested} onClick={() => stop.mutate()}>
              {round?.stop_requested ? t("omarStopping") : t("omarStop")}
            </Button>
            {round?.running ? (
              <Tag color="processing">{t("omarRunning", { trigger: round.trigger ?? "" })}</Tag>
            ) : data?.paused ? (
              <Tooltip title={t(data.paused.reason === "key" ? "omarPausedKeyHint" : "omarPausedQuotaHint")}>
                <Tag color="warning">
                  {t(data.paused.reason === "key" ? "omarPausedKey" : "omarPausedQuota", {
                    time: new Date(data.paused.until).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    }),
                  })}
                </Tag>
              </Tooltip>
            ) : (
              <Tag>{t("omarIdle")}</Tag>
            )}
            <Typography.Text type="secondary" className="text-xs">
              {data?.mode === "continuous" ? t("omarModeContinuous") : t("omarModeSpread")}
            </Typography.Text>
          </div>
          {round && (round.running || round.finished_at) && (
            <Typography.Text type="secondary" className="text-xs">
              {round.running
                ? t("omarRoundSince", { time: formatRelativeTime(round.started_at, t) })
                : t("omarRoundFinished", { time: formatRelativeTime(round.finished_at, t) })}
              {" · "}
              {t("omarRoundStats", {
                requests: fmtNumber(round.stats.requests),
                budget: fmtNumber(round.stats.budget),
                videos: fmtNumber(round.stats.videos),
                published: fmtNumber(round.stats.published),
                skipped: fmtNumber(round.stats.skipped_seen),
                keywords: fmtNumber(round.stats.keywords),
                failed: fmtNumber(round.stats.failed),
              })}
              {round.stats.stopped ? ` · ${round.stats.stopped}` : ""}
              {round.stats.search_requests
                ? ` · ${t("omarRoundSearch", {
                    queries: fmtNumber(round.stats.search_queries),
                    requests: fmtNumber(round.stats.search_requests),
                    videos: fmtNumber(round.stats.search_videos),
                  })}`
                : ""}
              {round.stats.channel_requests
                ? ` · ${t("omarRoundChannels", {
                    channels: fmtNumber(round.stats.channels),
                    videos: fmtNumber(round.stats.channel_videos),
                    matched: fmtNumber(round.stats.channel_matched),
                  })}`
                : ""}
              {round.stats.comment_requests
                ? ` · ${t("omarRoundComments", {
                    videos: fmtNumber(round.stats.comment_videos),
                    comments: fmtNumber(round.stats.comments),
                    replies: fmtNumber(round.stats.comment_replies),
                    published: fmtNumber(round.stats.comments_published),
                  })}`
                : ""}
            </Typography.Text>
          )}
        </div>
      </DashboardCard>

      <DashboardCard
        loading={yieldQuery.isLoading}
        title={<CardHeading icon={<BarChartOutlined />} title={t("omarYieldTitle")} desc={t("omarYieldDesc")} />}
      >
        <Table
          size="small"
          pagination={false}
          rowKey="source"
          scroll={{ x: true }}
          dataSource={Object.entries(yieldQuery.data?.totals ?? {}).map(([source, m]) => ({ source, ...m }))}
          columns={[
            { title: t("omarYieldSource"), dataIndex: "source", render: (v: string) => t(`omarYieldSource_${v as "hashtag" | "search" | "channel" | "comments"}`) },
            { title: t("omarYieldRequests"), dataIndex: "requests", align: "right", render: (v: number) => fmtNumber(v) },
            { title: t("omarYieldSent"), dataIndex: "sent", align: "right", render: (v: number) => fmtNumber(v) },
            { title: t("omarYieldNew"), dataIndex: "new", align: "right", render: (v: number) => fmtNumber(v) },
            {
              title: t("omarYieldPer100"),
              dataIndex: "new_per_100",
              align: "right",
              render: (v: number | null) => (v == null ? "—" : v.toLocaleString()),
            },
            {
              title: t("omarYieldShare"),
              key: "share",
              align: "right",
              render: (_, row: { source: string }) => {
                const share = yieldQuery.data?.shares?.[row.source];
                const base = yieldQuery.data?.base_shares?.[row.source];
                if (share == null) return "—";
                return (
                  <Tooltip title={t("omarYieldShareHint", { base: Math.round((base ?? share) * 100) })}>
                    <span>{Math.round(share * 100)}%</span>
                  </Tooltip>
                );
              },
            },
          ]}
        />
      </DashboardCard>

      <DashboardCard
        loading={trending.isLoading}
        title={<CardHeading icon={<FireOutlined />} title={t("omarTrendingTitle")} desc={t("omarTrendingDesc")} />}
      >
        {(trending.data?.movies ?? []).filter((movie) => movie.videos.length).length === 0 ? (
          <Typography.Text type="secondary">{t("omarTrendingEmpty")}</Typography.Text>
        ) : (
          <div className="flex flex-col gap-4">
            {(trending.data?.movies ?? [])
              .filter((movie) => movie.videos.length)
              .slice(0, 8)
              .map((movie) => (
                <div key={movie.movie_id}>
                  <Typography.Text strong>{movie.title}</Typography.Text>
                  <ul className="mt-1 flex flex-col gap-1">
                    {movie.videos.slice(0, 5).map((video) => (
                      <li key={video.video_id} className="flex flex-wrap items-center gap-2 text-sm">
                        {video.hot && <Tag color="red">{t("omarTrendingHot")}</Tag>}
                        <a href={video.url ?? "#"} target="_blank" rel="noreferrer" className="max-w-[420px] truncate">
                          {video.desc || video.video_id}
                        </a>
                        <span className="text-xs text-[var(--muted)]">
                          @{video.author ?? "?"} ·{" "}
                          {t("omarTrendingSpeed", {
                            views: fmtNumber(Math.round(video.velocity.views_per_hour)),
                            comments: fmtNumber(Math.round(video.velocity.comments_per_hour)),
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        loading={search.isLoading}
        title={
          <CardHeading
            icon={<SearchOutlined />}
            title={t("omarSearchTitle")}
            desc={
              search.data
                ? t("omarSearchDesc", {
                    n: search.data.queries.length,
                    modes: search.data.modes.map((mode) => `${mode.date ?? "all"}/${mode.sort ?? "relevance"}`).join(" + "),
                    pages: search.data.pages,
                  })
                : undefined
            }
          />
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            showSearch
            className="min-w-[220px]"
            placeholder={t("omarTagMovie")}
            value={searchMovie}
            onChange={setSearchMovie}
            optionFilterProp="label"
            options={(movies.data ?? []).map((movie) => ({ value: movie.id, label: movie.title }))}
          />
          <Input
            className="max-w-[320px]"
            placeholder={t("omarSearchPlaceholder")}
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onPressEnter={() => searchMovie && newQuery.trim() && addQuery.mutate()}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            disabled={!data?.key_set || !searchMovie || newQuery.trim().length < 3}
            loading={addQuery.isPending}
            onClick={() => addQuery.mutate()}
          >
            {t("omarSearchAdd")}
          </Button>
          <Input
            allowClear
            className="ml-auto max-w-[220px]"
            prefix={<SearchOutlined />}
            placeholder={t("omarSearchFilter")}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <Table<OmarSearchQuery>
          size="small"
          rowKey={(row) => `${row.movie_id}:${row.query}`}
          loading={search.isLoading}
          dataSource={(search.data?.queries ?? []).filter((row) => {
            const needle = searchFilter.trim().toLowerCase();
            return !needle || row.query.toLowerCase().includes(needle) || row.movie.toLowerCase().includes(needle);
          })}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={[
            { title: t("omarSearchColQuery"), dataIndex: "query", render: (v: string) => <span className="font-medium">{v}</span> },
            { title: t("omarColMovie"), dataIndex: "movie" },
            {
              title: t("omarSearchColSource"),
              dataIndex: "source",
              render: (v: OmarSearchQuery["source"]) => (
                <Tag color={v === "custom" ? "purple" : v === "social" ? "blue" : undefined}>{t(`omarSearchSource_${v}`)}</Tag>
              ),
            },
            {
              title: t("omarSearchColLast"),
              key: "last",
              render: (_, row) => (row.last ? formatRelativeTime(row.last.at, t) : <Tag>{t("omarNotStarted")}</Tag>),
            },
            {
              title: t("omarSearchColVideos"),
              key: "videos",
              align: "right",
              render: (_, row) =>
                row.last ? (
                  <Tooltip title={t("omarSearchVideosHint")}>
                    <span>
                      {fmtNumber(row.last.videos)} <span className="text-xs text-[var(--muted)]">({fmtNumber(row.last.published)})</span>
                    </span>
                  </Tooltip>
                ) : (
                  "—"
                ),
            },
            {
              title: "",
              key: "actions",
              render: (_, row) =>
                row.source === "custom" && row.id ? (
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteQuery.isPending && deleteQuery.variables === row.id}
                    onClick={() => deleteQuery.mutate(row.id!)}
                  />
                ) : null,
            },
          ]}
        />
      </DashboardCard>

      <DashboardCard
        loading={status.isLoading}
        title={
          <CardHeading
            icon={<UserOutlined />}
            title={t("omarChannelsTitle")}
            desc={
              data?.channels
                ? t("omarChannelsDesc", { max: data.channels.max_channels, days: data.channels.days })
                : undefined
            }
          />
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{t("omarChannelsTracked", { n: fmtNumber(data?.channels?.tracked) })}</Tag>
            <Tag color="blue">{t("omarChannelsToday", { n: fmtNumber(data?.channels?.done_today) })}</Tag>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="max-w-[320px]"
              prefix="@"
              placeholder={t("omarChannelPlaceholder")}
              value={channel}
              onChange={(e) => setChannel(e.target.value.replace(/^@/, ""))}
              onPressEnter={() => channel.trim() && crawlChannel.mutate()}
            />
            <Button
              icon={<PlayCircleOutlined />}
              disabled={!data?.key_set || !channel.trim()}
              loading={crawlChannel.isPending}
              onClick={() => crawlChannel.mutate()}
            >
              {t("omarChannelCrawl")}
            </Button>
            <Hint text={t("omarChannelHint")} />
          </div>
          {!!data?.channels?.latest.length && (
            <div className="flex flex-wrap gap-1.5">
              <Typography.Text type="secondary" className="text-xs">
                {t("omarChannelsLatest")}
              </Typography.Text>
              {data.channels.latest.map((item) => (
                <Tooltip
                  key={item.handle}
                  title={item.newest_video_at ? formatRelativeTime(item.newest_video_at, t) : undefined}
                >
                  <a href={`https://www.tiktok.com/@${item.handle}`} target="_blank" rel="noreferrer">
                    <Tag>@{item.handle}</Tag>
                  </a>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard
        loading={status.isLoading}
        title={
          <CardHeading
            icon={<CommentOutlined />}
            title={t("omarCommentsTitle")}
            desc={
              comments
                ? t("omarCommentsDesc", {
                    weekday: WEEKDAYS[locale === "vi" ? "vi" : "en"][comments.weekday] ?? String(comments.weekday),
                    time: comments.time,
                    top: comments.top_per_hashtag,
                  })
                : undefined
            }
          />
        }
        extra={
          <Button
            icon={<CommentOutlined />}
            loading={runComments.isPending}
            disabled={!data?.key_set}
            onClick={() => runComments.mutate()}
          >
            {t("omarCommentsRun")}
          </Button>
        }
      >
        <CommentKeywordPicker />
        {job ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text>
                {t("omarCommentsLast", {
                  week: job.week,
                  trigger: job.trigger,
                  time: formatRelativeTime(job.queued_at, t),
                  videos: fmtNumber(job.videos + job.kept_from_before),
                  hashtags: fmtNumber(job.hashtags),
                })}
              </Typography.Text>
              {job.finished_at ? (
                <Tag color="green">{t("omarCommentsDone", { time: formatRelativeTime(job.finished_at, t) })}</Tag>
              ) : (
                <Tag color="blue">{t("omarInProgress")}</Tag>
              )}
            </div>
            {job.videos + job.kept_from_before > 0 && (
              <Progress
                percent={Math.round(
                  ((job.videos + job.kept_from_before - comments.pending_videos) / (job.videos + job.kept_from_before)) * 100,
                )}
                size="small"
              />
            )}
            <Typography.Text type="secondary" className="text-xs">
              {t("omarCommentsProgress", {
                comments: fmtNumber(job.comments),
                replies: fmtNumber(job.replies),
                published: fmtNumber(job.published),
                pending: fmtNumber(comments.pending_videos),
              })}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">{t("omarCommentsNone")}</Typography.Text>
        )}
      </DashboardCard>

      <DashboardCard
        title={
          <CardHeading
            icon={<TagsOutlined />}
            title={t("omarProgressTitle")}
            desc={
              data
                ? t("omarProgressDesc", {
                    finished: data.totals.finished,
                    started: data.totals.started,
                    total: data.totals.hashtags,
                    pages: fmtNumber(data.totals.pages),
                  })
                : undefined
            }
          />
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            showSearch
            className="min-w-[240px]"
            placeholder={t("omarTagMovie")}
            value={tagMovie}
            onChange={setTagMovie}
            loading={movies.isLoading}
            optionFilterProp="label"
            options={(movies.data ?? []).map((movie) => ({ value: movie.id, label: movie.title }))}
          />
          <Input
            className="max-w-[320px]"
            prefix="#"
            placeholder={t("omarTagPlaceholder")}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value.replace(/^#/, ""))}
            onPressEnter={() => tagMovie && newTag.trim() && addTag.mutate()}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!data?.key_set || !tagMovie || !newTag.trim()}
            loading={addTag.isPending}
            onClick={() => addTag.mutate()}
          >
            {t("omarTagAdd")}
          </Button>
          <Hint text={t("omarTagHint")} />
        </div>
        <Table<OmarHashtagProgress>
          size="small"
          rowKey="keyword_id"
          loading={status.isLoading}
          dataSource={data?.hashtags ?? []}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={[
            { title: "Hashtag", dataIndex: "hashtag", render: (v: string) => <span className="font-medium">{v}</span> },
            { title: t("omarColMovie"), dataIndex: "movie", render: (v: string | null) => v ?? "—" },
            { title: t("omarColPages"), dataIndex: "pages", align: "right", render: (v: number) => fmtNumber(v) },
            {
              title: t("omarColVideos"),
              key: "videos",
              align: "right",
              render: (_, row) => (
                <Tooltip title={t("omarColVideosHint")}>
                  <span>~{fmtNumber(row.pages * 20)}</span>
                </Tooltip>
              ),
            },
            {
              title: t("omarColTiktokVideos"),
              key: "tiktok",
              align: "right",
              render: (_, row) =>
                row.video_count ? (
                  <Tooltip title={t("omarColTiktokVideosHint")}>
                    <span>
                      {fmtNumber(row.video_count)}{" "}
                      <span className="text-xs text-[var(--muted)]">
                        ({Math.min(100, Math.round(((row.pages * 20) / row.video_count) * 100))}%)
                      </span>
                    </span>
                  </Tooltip>
                ) : (
                  "—"
                ),
            },
            {
              title: t("omarColStatus"),
              key: "status",
              render: (_, row) =>
                row.missing_at ? (
                  <Tooltip title={t("omarMissingHint")}>
                    <Tag color="orange">{t("omarMissing", { time: formatRelativeTime(row.missing_at, t) })}</Tag>
                  </Tooltip>
                ) : row.done_at ? (
                  <Tag color="green">{t("omarDone", { time: formatRelativeTime(row.done_at, t) })}</Tag>
                ) : row.pages > 0 ? (
                  <Tag color="blue">{t("omarInProgress")}</Tag>
                ) : (
                  <Tag>{t("omarNotStarted")}</Tag>
                ),
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}

/** Chọn từ khoá TikTok để cào bình luận (rỗng = mọi hashtag đang bật). Nhóm theo phim; tích một phim = mọi từ khoá của nó. */
function CommentKeywordPicker() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords("tiktok");
  const saved = useQuery({ queryKey: ["omar", "comment-keywords"], queryFn: api.omarCommentKeywords });
  // Bản nháp chưa lưu; null = đang hiện đúng danh sách đã lưu.
  const [draft, setDraft] = useState<string[] | null>(null);
  const value = draft ?? saved.data?.keyword_ids ?? [];
  const [allDraft, setAllDraft] = useState<boolean | null>(null);
  const allVideos = allDraft ?? saved.data?.all_videos ?? false;
  const selectedIds = value.filter((id) => !id.startsWith("movie:"));

  const hashtagCount = (keywords ?? []).filter((k) => k.keyword.startsWith("#")).length;
  const treeData = useMemo(() => {
    const byMovie = new Map<string, { title: string; children: { title: string; value: string }[] }>();
    for (const k of keywords ?? []) {
      const key = k.movie_id || k.movie_title || "—";
      const group = byMovie.get(key) ?? { title: k.movie_title || "—", children: [] };
      group.children.push({ title: k.keyword, value: k.id });
      byMovie.set(key, group);
    }
    return [...byMovie.entries()]
      .sort((a, b) => a[1].title.localeCompare(b[1].title, undefined, { sensitivity: "base" }))
      .map(([key, group]) => ({
        title: group.title,
        value: `movie:${key}`,
        children: group.children.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" })),
      }));
  }, [keywords]);

  const save = useMutation({
    mutationFn: () => api.setOmarCommentKeywords(selectedIds, allVideos),
    onSuccess: (res) => {
      queryClient.setQueryData(["omar", "comment-keywords"], res);
      setDraft(null);
      setAllDraft(null);
      message.success(res.keyword_ids.length ? t("omarCommentKeywordsSaved", { n: res.keyword_ids.length }) : t("omarCommentKeywordsReset"));
    },
  });
  const dirty =
    JSON.stringify([...value].sort()) !== JSON.stringify([...(saved.data?.keyword_ids ?? [])].sort()) ||
    allVideos !== (saved.data?.all_videos ?? false);

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("omarCommentKeywords")}</span>
      <div className="flex gap-2">
        <TreeSelect
          multiple
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_CHILD}
          allowClear
          showSearch
          treeNodeFilterProp="title"
          maxTagCount="responsive"
          className="min-w-0 flex-1"
          loading={keywordsLoading || saved.isLoading}
          placeholder={t("omarCommentKeywordsPlaceholder", { n: hashtagCount })}
          value={value}
          onChange={(next) => setDraft(next as string[])}
          treeData={treeData}
        />
        <Button type="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>
          {t("omarCommentKeywordsSave")}
        </Button>
      </div>
      <Tooltip title={selectedIds.length ? t("omarCommentAllVideosHint") : t("omarCommentAllVideosNeedKeywords")} placement="topLeft">
        <Checkbox
          className="self-start"
          checked={allVideos && selectedIds.length > 0}
          disabled={selectedIds.length === 0}
          onChange={(e) => setAllDraft(e.target.checked)}
        >
          {t("omarCommentAllVideos")}
        </Checkbox>
      </Tooltip>
      <Hint text={allVideos && selectedIds.length > 0 ? t("omarCommentKeywordsHintAll") : t("omarCommentKeywordsHint")} />
    </div>
  );
}
