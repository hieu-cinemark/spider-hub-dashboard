"use client";

import { ApiOutlined, BarChartOutlined, CommentOutlined, DeleteOutlined, FireOutlined, PauseCircleOutlined, PlayCircleOutlined, SearchOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Checkbox, Input, InputNumber, Progress, Select, Space, Table, Tag, Tooltip, TreeSelect, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import ShortVidTrendingChart from "@/components/shortvid/ShortVidTrendingChart";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/i18n/LocaleProvider";
import { useMovies } from "@/hooks/useMovies";
import { useKeywords } from "@/hooks/useKeywords";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { ShortVidHashtagProgress, ShortVidSearchQuery } from "@/lib/types";
import Hint from "@/components/Hint";

// Tab ShortVid (Settings): key ShortVid API, hạn mức của gói, lượt cào hashtag TikTok đang chạy (Chạy ngay / Dừng) và tiến độ
// từng hashtag - xem cinemark-api app/services/shortvid_tiktok.py và app/api/routes/shortvid.py.

const STATUS_KEY = ["shortvid", "status"] as const;

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

export default function ShortVidTab() {
  const { t, locale } = useTranslation();
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  // null = chưa sửa, hiện giá trị đang lưu.
  const [rateCap, setRateCap] = useState<number | null>(null);
  const movies = useMovies();
  const [tagMovie, setTagMovie] = useState<string | undefined>();
  const [newTag, setNewTag] = useState("");
  const [channel, setChannel] = useState("");
  const [searchMovie, setSearchMovie] = useState<string | undefined>();
  const [newQuery, setNewQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const yieldQuery = useQuery({ queryKey: ["shortvid", "yield"], queryFn: () => api.shortvidYield(7), refetchInterval: 5 * 60_000 });
  const trending = useQuery({ queryKey: ["shortvid", "trending"], queryFn: () => api.shortvidTrending(24), refetchInterval: 10 * 60_000 });
  const search = useQuery({ queryKey: ["shortvid", "search"], queryFn: api.shortvidSearch, refetchInterval: 60_000 });
  const refreshSearch = () => queryClient.invalidateQueries({ queryKey: ["shortvid", "search"] });
  // Thêm câu tìm cho một phim - tìm ngay, các ngày sau tìm cùng lượt ShortVid (POST /shortvid/search).
  const addQuery = useMutation({
    mutationFn: () => api.shortvidAddSearch(searchMovie!, newQuery.trim()),
    onSuccess: () => {
      message.success(t("shortvidSearchAdded", { query: newQuery.trim() }));
      setNewQuery("");
      refreshSearch();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const deleteQuery = useMutation({
    mutationFn: (id: string) => api.shortvidDeleteSearch(id),
    onSuccess: refreshSearch,
    onError: (err: Error) => message.error(err.message),
  });

  const status = useQuery({
    queryKey: STATUS_KEY,
    queryFn: api.shortvidStatus,
    refetchInterval: (query) => (query.state.data?.round.running ? 10_000 : 60_000),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: STATUS_KEY });

  const run = useMutation({
    mutationFn: api.shortvidRun,
    onSuccess: (res) => {
      if (res.started) message.success(t("shortvidRunStarted"));
      else message.info(t("shortvidAlreadyRunning"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const stop = useMutation({
    mutationFn: api.shortvidStop,
    onSuccess: (res) => {
      if (res.stopping) message.success(t("shortvidStopRequested"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const runComments = useMutation({
    mutationFn: api.shortvidCommentsRun,
    onSuccess: (res) => {
      message.success(t("shortvidCommentsQueued", { queued: fmtNumber(res.queued), pending: fmtNumber(res.pending) }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Người dùng tự gõ hashtag cho một phim: kiểm tra có trên TikTok, tạo từ khoá rồi cào ngay tới hết (POST /shortvid/hashtags).
  const addTag = useMutation({
    mutationFn: () => api.shortvidAddHashtag(tagMovie!, newTag.trim()),
    onSuccess: (res) => {
      setNewTag("");
      message.success(t(res.started ? "shortvidTagAdded" : "shortvidTagAlreadyRunning", { tag: res.keyword.keyword }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Cào ngay một kênh TikTok qua ShortVid /posts (POST /tiktok/channels/run).
  const crawlChannel = useMutation({
    mutationFn: () => api.runChannelVideos({ username: channel.trim() }),
    onSuccess: (res) => {
      if (res.published) {
        message.success(t("shortvidChannelStarted", { handle: channel.trim().replace(/^@/, "") }));
        setChannel("");
      } else message.error(t("shortvidChannelInvalid"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const saveKey = useMutation({
    mutationFn: (key: string) => api.setShortVidApiKey(key),
    onSuccess: () => {
      setNewKey("");
      message.success(t("shortvidKeySaved"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const saveRateCap = useMutation({
    mutationFn: (perMinute: number) => api.setShortVidRequestsPerMinute(perMinute),
    onSuccess: () => {
      setRateCap(null);
      message.success(t("shortvidRateCapSaved"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const data = status.data;
  const usage = data?.usage;
  const savedRateCap = data?.requests_per_minute ?? 0;
  const planPerMinute = usage?.minute?.limit ?? 0;
  const round = data?.round;
  const day = usage?.day;
  const dayPct = day?.limit ? Math.round((day.used / day.limit) * 100) : 0;
  const comments = data?.comments;
  const job = comments?.last;

  // "Video đang nổi": gộp tất cả phim lại thành một danh sách video để
  // vẽ biểu đồ tốc độ; danh sách chi tiết theo phim vẫn hiển thị bên dưới.
  const trendingMovies = useMemo(
    () => (trending.data?.movies ?? []).filter((movie) => movie.videos.length).slice(0, 8),
    [trending.data],
  );
  const trendingVideos = useMemo(
    () =>
      trendingMovies
        .flatMap((movie) => movie.videos)
        .sort((a, b) => b.velocity.views_per_hour - a.velocity.views_per_hour)
        .slice(0, 12),
    [trendingMovies],
  );

  const yieldColumns: ResponsiveColumnType<{ source: string } & Record<string, unknown>>[] = [
    {
      title: t("shortvidYieldSource"),
      dataIndex: "source",
      mobilePrimary: true,
      render: (v: string) => t(`shortvidYieldSource_${v as "hashtag" | "search" | "channel" | "comments"}`),
    },
    { title: t("shortvidYieldRequests"), dataIndex: "requests", align: "right", render: (v: number) => fmtNumber(v) },
    { title: t("shortvidYieldSent"), dataIndex: "sent", align: "right", render: (v: number) => fmtNumber(v) },
    { title: t("shortvidYieldNew"), dataIndex: "new", align: "right", render: (v: number) => fmtNumber(v) },
    {
      title: t("shortvidYieldPer100"),
      dataIndex: "new_per_100",
      align: "right",
      render: (v: number | null) => (v == null ? "—" : v.toLocaleString()),
    },
    {
      title: t("shortvidYieldShare"),
      key: "share",
      align: "right",
      render: (_: unknown, row: { source: string }) => {
        const share = yieldQuery.data?.shares?.[row.source];
        const base = yieldQuery.data?.base_shares?.[row.source];
        if (share == null) return "—";
        return (
          <Tooltip title={t("shortvidYieldShareHint", { base: Math.round((base ?? share) * 100) })}>
            <span>{Math.round(share * 100)}%</span>
          </Tooltip>
        );
      },
    },
  ];

  const searchRows = (search.data?.queries ?? []).filter((row) => {
    const needle = searchFilter.trim().toLowerCase();
    return !needle || row.query.toLowerCase().includes(needle) || row.movie.toLowerCase().includes(needle);
  });

  const searchColumns: ResponsiveColumnType<ShortVidSearchQuery>[] = [
    {
      title: t("shortvidSearchColQuery"),
      dataIndex: "query",
      mobilePrimary: true,
      render: (v: string) => <span className="font-medium break-words">{v}</span>,
    },
    { title: t("shortvidColMovie"), dataIndex: "movie", render: (v: string) => v || "—" },
    {
      title: t("shortvidSearchColSource"),
      dataIndex: "source",
      render: (v: ShortVidSearchQuery["source"]) => (
        <Tag color={v === "custom" ? "purple" : v === "social" ? "blue" : undefined}>{t(`shortvidSearchSource_${v}`)}</Tag>
      ),
    },
    {
      title: t("shortvidSearchColLast"),
      key: "last",
      render: (_: unknown, row: ShortVidSearchQuery) =>
        row.last ? formatRelativeTime(row.last.at, t) : <Tag>{t("shortvidNotStarted")}</Tag>,
    },
    {
      title: t("shortvidSearchColVideos"),
      key: "videos",
      align: "right",
      render: (_: unknown, row: ShortVidSearchQuery) =>
        row.last ? (
          <Tooltip title={t("shortvidSearchVideosHint")}>
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
      mobileHidden: true,
      render: (_: unknown, row: ShortVidSearchQuery) =>
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
  ];

  const hashtagColumns: ResponsiveColumnType<ShortVidHashtagProgress>[] = [
    {
      title: "Hashtag",
      dataIndex: "hashtag",
      mobilePrimary: true,
      render: (v: string) => <span className="font-medium break-words">{v}</span>,
    },
    { title: t("shortvidColMovie"), dataIndex: "movie", render: (v: string | null) => v ?? "—" },
    { title: t("shortvidColPages"), dataIndex: "pages", align: "right", render: (v: number) => fmtNumber(v) },
    {
      title: t("shortvidColVideos"),
      key: "videos",
      align: "right",
      render: (_: unknown, row: ShortVidHashtagProgress) => (
        <Tooltip title={t("shortvidColVideosHint")}>
          <span>~{fmtNumber(row.pages * 20)}</span>
        </Tooltip>
      ),
    },
    {
      title: t("shortvidColTiktokVideos"),
      key: "tiktok",
      align: "right",
      render: (_: unknown, row: ShortVidHashtagProgress) =>
        row.video_count ? (
          <Tooltip title={t("shortvidColTiktokVideosHint")}>
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
      title: t("shortvidColStatus"),
      key: "status",
      render: (_: unknown, row: ShortVidHashtagProgress) =>
        row.missing_at ? (
          <Tooltip title={t("shortvidMissingHint")}>
            <Tag color="orange">{t("shortvidMissing", { time: formatRelativeTime(row.missing_at, t) })}</Tag>
          </Tooltip>
        ) : row.done_at ? (
          <Tag color="green">{t("shortvidDone", { time: formatRelativeTime(row.done_at, t) })}</Tag>
        ) : row.pages > 0 ? (
          <Tag color="blue">{t("shortvidInProgress")}</Tag>
        ) : (
          <Tag>{t("shortvidNotStarted")}</Tag>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard
        loading={status.isLoading}
        title={<CardHeading icon={<ApiOutlined />} title={t("shortvidTitle")} desc={t("shortvidDesc")} />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong>{t("shortvidKey")}</Typography.Text>
              {data?.key_set ? <Tag color="green">{t("shortvidKeySet")}</Tag> : <Tag color="red">{t("shortvidKeyMissing")}</Tag>}
              {usage?.plan && <Tag>{usage.plan}</Tag>}
              {usage?.status && <Tag color={usage.status === "active" ? "blue" : "orange"}>{usage.status}</Tag>}
            </div>
            <Space.Compact className="w-full">
              <Input.Password
                placeholder={t("shortvidKeyPlaceholder")}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                autoComplete="off"
              />
              <Button type="primary" disabled={!newKey.trim()} loading={saveKey.isPending} onClick={() => saveKey.mutate(newKey.trim())}>
                {t("save")}
              </Button>
            </Space.Compact>
            {/* ShortVid trả trước theo credit (không có hạn gói): số credit còn lại đọc từ header của request gần nhất. */}
            {typeof usage?.credits_remaining === "number" && (
              <Typography.Text type={usage.credits_remaining < 20_000 ? "danger" : "secondary"} className="text-xs">
                {t("shortvidCredits", {
                  credits: fmtNumber(usage.credits_remaining),
                  usd: (usage.credits_remaining / 10_000).toFixed(2),
                })}
              </Typography.Text>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Typography.Text strong>{t("shortvidQuotaToday")}</Typography.Text>
            {day ? (
              <>
                <Progress percent={dayPct} status={dayPct >= 100 ? "exception" : "active"} />
                <Typography.Text type="secondary" className="text-xs">
                  {t("shortvidQuotaLine", {
                    used: fmtNumber(day.used),
                    limit: fmtNumber(day.limit),
                    remaining: fmtNumber(day.remaining),
                    reset: fmtDuration(day.resets_in),
                    perMinute: fmtNumber(usage?.minute?.limit),
                  })}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text type="secondary">{t("shortvidQuotaUnknown")}</Typography.Text>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Typography.Text strong>{t("shortvidRateCap")}</Typography.Text>
              <Hint text={t("shortvidRateCapHint", { plan: fmtNumber(usage?.minute?.limit) })} />
            </div>
            <Space.Compact>
              <InputNumber
                min={0}
                max={10000}
                precision={0}
                style={{ width: 140 }}
                value={rateCap ?? savedRateCap}
                onChange={(value) => setRateCap(value ?? 0)}
              />
              <Button
                type="primary"
                disabled={rateCap === null || rateCap === savedRateCap}
                loading={saveRateCap.isPending}
                onClick={() => rateCap !== null && saveRateCap.mutate(rateCap)}
              >
                {t("save")}
              </Button>
            </Space.Compact>
            <Typography.Text type="secondary" className="text-xs">
              {t("shortvidRateCapActive", {
                value:
                  savedRateCap > 0 && (!planPerMinute || savedRateCap < planPerMinute)
                    ? fmtNumber(savedRateCap)
                    : `${fmtNumber(planPerMinute)} (${t("shortvidRateCapPlan")})`,
              })}
            </Typography.Text>
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
              {t("shortvidRunNow")}
            </Button>
            <Button danger icon={<PauseCircleOutlined />} loading={stop.isPending} disabled={!round?.running || round?.stop_requested} onClick={() => stop.mutate()}>
              {round?.stop_requested ? t("shortvidStopping") : t("shortvidStop")}
            </Button>
            {round?.running ? (
              <Tag color="processing">{t("shortvidRunning", { trigger: round.trigger ?? "" })}</Tag>
            ) : data?.paused ? (
              <Tooltip title={t(data.paused.reason === "key" ? "shortvidPausedKeyHint" : "shortvidPausedQuotaHint")}>
                <Tag color="warning">
                  {t(data.paused.reason === "key" ? "shortvidPausedKey" : "shortvidPausedQuota", {
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
              <Tag>{t("shortvidIdle")}</Tag>
            )}
            <Typography.Text type="secondary" className="text-xs">
              {data?.mode === "continuous" ? t("shortvidModeContinuous") : t("shortvidModeSpread")}
            </Typography.Text>
          </div>
          {round && (round.running || round.finished_at) && (
            <Typography.Text type="secondary" className="text-xs">
              {round.running
                ? t("shortvidRoundSince", { time: formatRelativeTime(round.started_at, t) })
                : t("shortvidRoundFinished", { time: formatRelativeTime(round.finished_at, t) })}
              {" · "}
              {t("shortvidRoundStats", {
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
                ? ` · ${t("shortvidRoundSearch", {
                    queries: fmtNumber(round.stats.search_queries),
                    requests: fmtNumber(round.stats.search_requests),
                    videos: fmtNumber(round.stats.search_videos),
                  })}`
                : ""}
              {round.stats.channel_requests
                ? ` · ${t("shortvidRoundChannels", {
                    channels: fmtNumber(round.stats.channels),
                    videos: fmtNumber(round.stats.channel_videos),
                    matched: fmtNumber(round.stats.channel_matched),
                  })}`
                : ""}
              {round.stats.comment_requests
                ? ` · ${t("shortvidRoundComments", {
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
        title={<CardHeading icon={<BarChartOutlined />} title={t("shortvidYieldTitle")} desc={t("shortvidYieldDesc")} />}
      >
        {isMobile ? (
          <MobileTable
            rowKey="source"
            loading={yieldQuery.isLoading}
            dataSource={Object.entries(yieldQuery.data?.totals ?? {}).map(([source, m]) => ({ source, ...m }))}
            columns={yieldColumns}
          />
        ) : (
        <Table
          size="small"
          pagination={false}
          rowKey="source"
          scroll={{ x: true }}
          dataSource={Object.entries(yieldQuery.data?.totals ?? {}).map(([source, m]) => ({ source, ...m }))}
          columns={yieldColumns}
        />
        )}
      </DashboardCard>

      <DashboardCard
        loading={trending.isLoading}
        title={<CardHeading icon={<FireOutlined />} title={t("shortvidTrendingTitle")} desc={t("shortvidTrendingDesc")} />}
      >
        {trendingVideos.length === 0 ? (
          <Typography.Text type="secondary">{t("shortvidTrendingEmpty")}</Typography.Text>
        ) : (
          <div className="flex flex-col gap-5">
            <ShortVidTrendingChart videos={trendingVideos} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {trendingMovies.map((movie) => (
                <div key={movie.movie_id}>
                  <Typography.Text strong>{movie.title}</Typography.Text>
                  <ul className="mt-1 flex flex-col gap-1">
                    {movie.videos.slice(0, 5).map((video) => (
                      <li key={video.video_id} className="flex flex-wrap items-center gap-2 text-sm">
                        {video.hot && <Tag color="red">{t("shortvidTrendingHot")}</Tag>}
                        <a href={video.url ?? "#"} target="_blank" rel="noreferrer" className="max-w-[420px] break-words">
                          {video.desc || video.video_id}
                        </a>
                        <span className="text-xs text-[var(--muted)]">
                          @{video.author ?? "?"} ·{" "}
                          {t("shortvidTrendingSpeed", {
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
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        loading={search.isLoading}
        title={
          <CardHeading
            icon={<SearchOutlined />}
            title={t("shortvidSearchTitle")}
            desc={
              search.data
                ? t("shortvidSearchDesc", {
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
            placeholder={t("shortvidTagMovie")}
            value={searchMovie}
            onChange={setSearchMovie}
            optionFilterProp="label"
            options={(movies.data ?? []).map((movie) => ({ value: movie.id, label: movie.title }))}
          />
          <Input
            className="max-w-[320px]"
            placeholder={t("shortvidSearchPlaceholder")}
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
            {t("shortvidSearchAdd")}
          </Button>
          <Input
            allowClear
            className="ml-auto max-w-[220px]"
            prefix={<SearchOutlined />}
            placeholder={t("shortvidSearchFilter")}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        {isMobile ? (
          <MobileTable
            rowKey={(row) => `${row.movie_id}:${row.query}`}
            loading={search.isLoading}
            dataSource={searchRows}
            columns={searchColumns}
          />
        ) : (
        <Table<ShortVidSearchQuery>
          size="small"
          rowKey={(row) => `${row.movie_id}:${row.query}`}
          loading={search.isLoading}
          dataSource={searchRows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={searchColumns}
        />
        )}
      </DashboardCard>

      <DashboardCard
        loading={status.isLoading}
        title={
          <CardHeading
            icon={<UserOutlined />}
            title={t("shortvidChannelsTitle")}
            desc={
              data?.channels
                ? t("shortvidChannelsDesc", { max: data.channels.max_channels, days: data.channels.days })
                : undefined
            }
          />
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{t("shortvidChannelsTracked", { n: fmtNumber(data?.channels?.tracked) })}</Tag>
            <Tag color="blue">{t("shortvidChannelsToday", { n: fmtNumber(data?.channels?.done_today) })}</Tag>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="max-w-[320px]"
              prefix="@"
              placeholder={t("shortvidChannelPlaceholder")}
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
              {t("shortvidChannelCrawl")}
            </Button>
            <Hint text={t("shortvidChannelHint")} />
          </div>
          {!!data?.channels?.latest.length && (
            <div className="flex flex-wrap gap-1.5">
              <Typography.Text type="secondary" className="text-xs">
                {t("shortvidChannelsLatest")}
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
            title={t("shortvidCommentsTitle")}
            desc={
              comments
                ? t("shortvidCommentsDesc", {
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
            {t("shortvidCommentsRun")}
          </Button>
        }
      >
        <CommentKeywordPicker />
        {job ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text>
                {t("shortvidCommentsLast", {
                  week: job.week,
                  trigger: job.trigger,
                  time: formatRelativeTime(job.queued_at, t),
                  videos: fmtNumber(job.videos + job.kept_from_before),
                  hashtags: fmtNumber(job.hashtags),
                })}
              </Typography.Text>
              {job.finished_at ? (
                <Tag color="green">{t("shortvidCommentsDone", { time: formatRelativeTime(job.finished_at, t) })}</Tag>
              ) : (
                <Tag color="blue">{t("shortvidInProgress")}</Tag>
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
              {t("shortvidCommentsProgress", {
                comments: fmtNumber(job.comments),
                replies: fmtNumber(job.replies),
                published: fmtNumber(job.published),
                pending: fmtNumber(comments.pending_videos),
              })}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">{t("shortvidCommentsNone")}</Typography.Text>
        )}
      </DashboardCard>

      <DashboardCard
        title={
          <CardHeading
            icon={<TagsOutlined />}
            title={t("shortvidProgressTitle")}
            desc={
              data
                ? t("shortvidProgressDesc", {
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
            placeholder={t("shortvidTagMovie")}
            value={tagMovie}
            onChange={setTagMovie}
            loading={movies.isLoading}
            optionFilterProp="label"
            options={(movies.data ?? []).map((movie) => ({ value: movie.id, label: movie.title }))}
          />
          <Input
            className="max-w-[320px]"
            prefix="#"
            placeholder={t("shortvidTagPlaceholder")}
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
            {t("shortvidTagAdd")}
          </Button>
          <Hint text={t("shortvidTagHint")} />
        </div>
        {isMobile ? (
          <MobileTable
            rowKey="keyword_id"
            loading={status.isLoading}
            dataSource={data?.hashtags ?? []}
            columns={hashtagColumns}
          />
        ) : (
        <Table<ShortVidHashtagProgress>
          size="small"
          rowKey="keyword_id"
          loading={status.isLoading}
          dataSource={data?.hashtags ?? []}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={hashtagColumns}
        />
        )}
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
  const saved = useQuery({ queryKey: ["shortvid", "comment-keywords"], queryFn: api.shortvidCommentKeywords });
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
    mutationFn: () => api.setShortVidCommentKeywords(selectedIds, allVideos),
    onSuccess: (res) => {
      queryClient.setQueryData(["shortvid", "comment-keywords"], res);
      setDraft(null);
      setAllDraft(null);
      message.success(res.keyword_ids.length ? t("shortvidCommentKeywordsSaved", { n: res.keyword_ids.length }) : t("shortvidCommentKeywordsReset"));
    },
  });
  const dirty =
    JSON.stringify([...value].sort()) !== JSON.stringify([...(saved.data?.keyword_ids ?? [])].sort()) ||
    allVideos !== (saved.data?.all_videos ?? false);

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("shortvidCommentKeywords")}</span>
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
          placeholder={t("shortvidCommentKeywordsPlaceholder", { n: hashtagCount })}
          value={value}
          onChange={(next) => setDraft(next as string[])}
          treeData={treeData}
        />
        <Button type="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>
          {t("shortvidCommentKeywordsSave")}
        </Button>
      </div>
      <Tooltip title={selectedIds.length ? t("shortvidCommentAllVideosHint") : t("shortvidCommentAllVideosNeedKeywords")} placement="topLeft">
        <Checkbox
          className="self-start"
          checked={allVideos && selectedIds.length > 0}
          disabled={selectedIds.length === 0}
          onChange={(e) => setAllDraft(e.target.checked)}
        >
          {t("shortvidCommentAllVideos")}
        </Checkbox>
      </Tooltip>
      <Hint text={allVideos && selectedIds.length > 0 ? t("shortvidCommentKeywordsHintAll") : t("shortvidCommentKeywordsHint")} />
    </div>
  );
}
