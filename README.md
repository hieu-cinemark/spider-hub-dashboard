# spider-hub-dashboard

Monitoring dashboard for spider-hub's crawl pipeline: post counts per
platform (as tabs - All / Facebook / Threads / ...), a daily trend per
platform, the two crawl pipeline logs, and manual trigger buttons for
Facebook/Threads crawls + Facebook token refresh. Gated behind a simple
access-key screen.

Built with Next.js (App Router), Ant Design, Tailwind CSS, and
TanStack Query. Every page is a client component that talks straight to
`cinemark-api` (the sibling FastAPI service) - there's no server-side data
layer of its own.

## How this fits together

```
spider-hub          cinemark-api (FastAPI)          spider-hub-dashboard (this repo)
  consumer.log  ───► GET /logs/spider-hub      ───►  Logs page
                     GET /logs/ingest (its own
                     ingest_consumer.log)       ───►  Logs page

  Kafka raw_posts ─► D1 `posts` table   ◄──────────  GET /stats/platforms
  (via ingest consumer)                 ◄──────────  GET /stats/timeseries  ───► Overview tabs

                     POST /facebook/run
                     POST /threads/run             ◄─ per-platform tab's "Actions" card
                     POST /facebook/refresh-token
                     GET  /facebook/token-status  ───► Facebook tab's token badge
```

`GET /stats/*` and `GET /logs/*` were added to cinemark-api alongside this
dashboard (see `cinemark-api/app/api/routes/stats.py` and `logs.py`) - they
didn't exist before. `POST /threads/run` (`cinemark-api/app/api/routes/threads.py`)
was also added, mirroring the existing `facebook.py` router, so the trigger
buttons can cover both platforms spider-hub feeds.

The `/logs/*` routes tail log files straight off disk, so they only return
real data when cinemark-api can see spider-hub's `consumer.log` - either
because both run on the same host (see `SPIDER_HUB_CONSUMER_LOG_PATH` /
`INGEST_CONSUMER_LOG_PATH` in cinemark-api's `.env`, defaults assume a
sibling checkout layout) or that path is otherwise mounted.

## Access gate

Set `NEXT_PUBLIC_AUTH_KEY` to require a key before the dashboard renders
(see `src/components/auth/AuthGate.tsx`). This is a UI convenience, not real
security - it's a `NEXT_PUBLIC_*` var, visible in the client bundle like any
other, and cinemark-api itself has no auth. Leave it unset to skip the gate
entirely (useful for local dev).

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL and (optionally) NEXT_PUBLIC_AUTH_KEY
npm run dev
```

cinemark-api must be running (`uvicorn app.main:app --reload`, default
`http://localhost:8000`) and its `CORS_ORIGINS` must include this app's
origin (`http://localhost:3000` by default already matches).

## Project structure

```
src/
  app/
    layout.tsx        Root layout - AntdRegistry, Providers, AuthGate, AppShell
    providers.tsx       QueryClientProvider + AntD ConfigProvider/App
    page.tsx           Overview: <PlatformTabs />
    logs/page.tsx       Logs: tabbed tail viewer for both pipeline logs
  components/
    AppShell.tsx                    Sidebar nav
    StatCard.tsx                     Small stat card
    PlatformTotalsChart.tsx          Bar chart of posts per platform (@ant-design/plots)
    TimeseriesChart.tsx              Daily trend line, one series per platform
    LogViewer.tsx                     Parsed/leveled log tail viewer - line count, level filter, auto-refresh
    FacebookTokenBadge.tsx            Facebook session valid/expired badge
    auth/
      AuthGate.tsx                    Access-key check (useSyncExternalStore over localStorage)
      LoginScreen.tsx                  Key-entry screen
    platform/
      PlatformTabs.tsx                 "All" tab + one tab per platform present in /stats/platforms
      AllPlatformsOverview.tsx          All-platforms totals, chart, last-crawl table
      PlatformDetail.tsx                One platform: stat cards, Actions (trigger buttons), its trend chart
  hooks/
    useStats.ts           usePlatformStats(), useTimeseries()
    useFacebookToken.ts    useFacebookTokenStatus()
    useLogTail.ts           useLogTail(kind, lines, autoRefresh)
    useTriggerCrawl.ts       runFacebook / runThreads / refreshToken mutations (toast + refetch wiring)
  lib/
    api.ts             Typed fetch client for cinemark-api
    types.ts            Response shapes, mirrors cinemark-api's Pydantic schemas
    constants.ts          Refresh intervals, query keys, storage keys, triggerable platforms
    platform.tsx           Per-platform label/color/source + <PlatformIcon platform=".."/>
    logParser.ts            Parses a structlog console line into {timestamp, level, message}
    format.ts               formatRelativeTime()
```

## Deploy

Static/SSR Next.js app - deploy anywhere Next.js runs (Vercel, a Node
server, etc.). Set `NEXT_PUBLIC_API_BASE_URL` to cinemark-api's public URL,
set `NEXT_PUBLIC_AUTH_KEY` if you want the access gate on, and add this
app's deployed origin to cinemark-api's `CORS_ORIGINS`.
