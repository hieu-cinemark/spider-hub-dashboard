// Flat key -> string dictionary per locale (not a deep nested tree) - keeps
// `t("someKey")` trivially type-checked against `keyof typeof en` with no
// recursive path-type machinery, which is worth more here than nesting
// aesthetics for a dashboard this size. Grouped by the component that owns
// each key (comments only, doesn't affect the type). Values can contain
// `{placeholder}` tokens - see useTranslation's t() for substitution.

const en = {
  // AppShell (nav)
  navOverview: "Overview",
  navPosts: "Posts",
  navLogs: "Logs",
  navSettings: "Settings",
  navLogout: "Logout",

  // Shared across tables/forms
  platform: "Platform",
  enabled: "Enabled",
  actions: "Actions",
  edit: "Edit",
  remove: "Remove",
  cancel: "Cancel",
  username: "Username",
  password: "Password",
  unknown: "unknown",
  allPlatformsShared: "All platforms (shared)",
  allPlatformsFilter: "All platforms",

  // Overview page + AllPlatformsOverview
  overviewTitle: "Overview",
  overviewDescription: "System metrics and platform collection status.",
  totalPostsCollected: "Total posts collected",
  postsPerPlatform: "Posts per platform",
  dailyPostsLast14Days: "Daily posts, last 14 days",
  lastCrawlPerPlatform: "Last crawl per platform",
  columnPostsCollected: "Posts collected",
  columnLastScraped: "Last scraped",
  noPostsYet: "No posts yet",
  noPostsInWindow: "No posts in this window",
  couldNotReachApi: "Could not reach cinemark-api",
  allTab: "All",

  // PlatformDetail
  fedBy: "Fed by",
  platformPostsTitle: "{platform} posts",
  platformDailyPostsTitle: "{platform} - daily posts (last 14 days)",
  notTriggerableSpiderHub:
    "{platform} is crawled by spider-hub but isn't wired to a dashboard trigger yet - run it manually (scrapy crawl) until that's built.",
  notTriggerableOther: "{platform} is scraped by cinemark-scraper's own Worker, not spider-hub - no trigger button here.",

  // PlatformActions / CrawlTriggerForm / RefreshLogPanel
  runACrawl: "Run a crawl",
  token: "Token",
  refreshToken: "Refresh token",
  refreshingEllipsis: "refreshing…",
  refreshed: "refreshed",
  refreshFailed: "refresh failed",
  allEnabledKeywords: "All enabled keywords",
  newKeyword: "New keyword",
  runSearchCrawl: "Run search crawl",
  refreshStatusIdle: "Idle",
  refreshStatusRunning: "Refreshing…",
  refreshStatusSuccess: "Refresh succeeded",
  refreshStatusFailed: "Refresh failed",
  waitingForOutput: "waiting for output…",
  lineCount: "{n} line (live)",
  lineCountPlural: "{n} lines (live)",

  // AddKeywordModal
  addKeyword: "Add keyword",
  movie: "Movie",
  pickAMovie: "Pick a movie",
  selectAMovie: "Select a movie",
  keyword: "Keyword",
  enterAKeyword: "Enter a keyword",

  // AccountFormModal
  editAccount: "Edit account",
  addAccount: "Add account",
  deviceId: "Device ID",
  accountIdLabel: "Account ID (login email/phone/username)",
  recoveryEmail: "Recovery email",
  twoFaSecret: "2FA TOTP secret",
  cookieHeaderTikTok: "Cookie header (ttwid/msToken/s_v_web_id - captured from a real browser session)",
  cookieHeaderGeneric: "Cookie header (skips login if set)",
  odinId: "Odin ID",
  tokenReserved: "Token (reserved)",

  // ProxyFormModal
  editProxy: "Edit proxy",
  addProxy: "Add proxy",
  proxyHostPort: "Proxy host:port",
  useForLoginToo: "Use for browser login too",
  useForLoginTooltip:
    "Off by default - a proxy IP that doesn't match the account's usual geography is what triggers a captcha on a fresh login. The ongoing replay traffic always uses this proxy regardless of this flag.",

  // AccountsTable
  authCredentialsTitle: "Authentication credentials",
  authCredentialsDesc: "Accounts used to log in and crawl each platform.",
  columnAccountId: "Account ID",
  columnEmail: "Email",
  columnPassword: "Password",
  column2fa: "2FA secret",
  removeAccountConfirm: "Remove this account?",

  // ProxiesTable
  networkProxiesTitle: "Network proxies",
  networkProxiesDesc: "Per-platform or shared proxy used for crawl requests.",
  columnProxy: "Proxy",
  columnUseForLogin: "Use for login",
  removeProxyConfirm: "Remove this proxy?",

  // CronJobsTable
  cronJobsTitle: "Cron jobs",
  cronJobsDesc:
    "Read-only - these schedules live in a crontab or cinemark-scraper's wrangler.toml, not a database. Edit them at their source (see \"Source\" below), not here.",
  columnJob: "Job",
  columnSchedule: "Schedule",
  columnSource: "Source",
  columnDescription: "Description",
  columnLastRun: "Last run",

  // Settings page
  settingsTitle: "Settings",
  settingsDescription: "Manage the accounts and proxies spider-hub crawls with, and see when each cron job last ran.",
  tabProxyAccounts: "Proxy & Accounts",
  tabCron: "Cron",

  // Logs page
  logsTitle: "Logs",
  logsDescription: "Tails the two structlog console logs behind the crawl pipeline, read straight off disk by cinemark-api.",
  tabCrawlConsumer: "Crawl consumer (spider-hub)",
  tabIngestConsumer: "Ingest consumer (cinemark-api)",

  // LogViewer
  searchLogsPlaceholder: "Search this log (event name, key=value, text)...",
  allLevels: "all levels",
  refresh: "Refresh",
  autoRefresh: "auto-refresh",
  logFileNotFound: "log file not found on this host",
  logFileNotReachableTitle: "Log file not reachable from cinemark-api",
  logFileNotReachableDesc:
    "Check SPIDER_HUB_CONSUMER_LOG_PATH / INGEST_CONSUMER_LOG_PATH in cinemark-api's .env - this dashboard reads the file straight off disk, so it only works when both services share a host (or the path is mounted).",
  noMatchingLines: "(no matching lines)",
  showingOfLines: "showing {shown} of {total}",

  // posts/page.tsx + PostsReview
  postsDescription: "Recently scraped posts across every platform, newest first.",
  recentlyScrapedPosts: "Recently scraped posts",
  columnMovieKeyword: "Movie / keyword",
  columnAuthor: "Author",
  columnContent: "Content",
  columnEngagement: "Engagement",
  columnScraped: "Scraped",
  postsTotal: "{n} posts",

  // PostDetailModal
  postDetail: "Post detail",
  openOriginal: "Open original",

  // LoginScreen
  enterAccessKey: "Enter the access key to continue",
  invalidAccessKey: "Invalid access key",
  accessKeyRequired: "Access key is required",
  accessKeyPlaceholder: "Access key",
  continueBtn: "Continue",

  // format.ts (relative time)
  timeNever: "never",
  timeJustNow: "just now",
  timeMinutesAgo: "{n}m ago",
  timeHoursAgo: "{n}h ago",
  timeDaysAgo: "{n}d ago",

  // TokenStatusBadge
  sessionValid: "{platform} session valid",
  sessionExpired: "{platform} session expired",
  accountLabel: "account: {account}",
  expiresIn: " · expires in {ttl}",

  openNavigation: "Open navigation",

  // Locale switcher itself
  language: "Language",
} as const;

const vi: Record<keyof typeof en, string> = {
  navOverview: "Tổng quan",
  navPosts: "Bài viết",
  navLogs: "Nhật ký",
  navSettings: "Cài đặt",
  navLogout: "Đăng xuất",

  platform: "Nền tảng",
  enabled: "Kích hoạt",
  actions: "Thao tác",
  edit: "Sửa",
  remove: "Xoá",
  cancel: "Huỷ",
  username: "Tên đăng nhập",
  password: "Mật khẩu",
  unknown: "không rõ",
  allPlatformsShared: "Tất cả nền tảng (dùng chung)",
  allPlatformsFilter: "Tất cả nền tảng",

  overviewTitle: "Tổng quan",
  overviewDescription: "Số liệu hệ thống và trạng thái thu thập theo từng nền tảng.",
  totalPostsCollected: "Tổng bài viết đã thu thập",
  postsPerPlatform: "Bài viết theo nền tảng",
  dailyPostsLast14Days: "Bài viết theo ngày, 14 ngày gần nhất",
  lastCrawlPerPlatform: "Lần cào gần nhất theo nền tảng",
  columnPostsCollected: "Bài viết đã thu thập",
  columnLastScraped: "Cào gần nhất",
  noPostsYet: "Chưa có bài viết nào",
  noPostsInWindow: "Không có bài viết trong khoảng này",
  couldNotReachApi: "Không kết nối được tới cinemark-api",
  allTab: "Tất cả",

  fedBy: "Nguồn dữ liệu",
  platformPostsTitle: "Bài viết {platform}",
  platformDailyPostsTitle: "{platform} - bài viết theo ngày (14 ngày gần nhất)",
  notTriggerableSpiderHub:
    "{platform} được spider-hub cào nhưng chưa nối với nút bấm trên dashboard - chạy tay (scrapy crawl) cho tới khi được build.",
  notTriggerableOther: "{platform} được cào bởi Worker riêng của cinemark-scraper, không phải spider-hub - không có nút chạy ở đây.",

  runACrawl: "Chạy 1 lượt cào",
  token: "Token",
  refreshToken: "Làm mới token",
  refreshingEllipsis: "đang làm mới…",
  refreshed: "đã làm mới",
  refreshFailed: "làm mới thất bại",
  allEnabledKeywords: "Tất cả từ khoá đang bật",
  newKeyword: "Thêm từ khoá",
  runSearchCrawl: "Chạy crawl tìm kiếm",
  refreshStatusIdle: "Chưa chạy",
  refreshStatusRunning: "Đang làm mới…",
  refreshStatusSuccess: "Làm mới thành công",
  refreshStatusFailed: "Làm mới thất bại",
  waitingForOutput: "đang chờ dữ liệu…",
  lineCount: "{n} dòng (trực tiếp)",
  lineCountPlural: "{n} dòng (trực tiếp)",

  addKeyword: "Thêm từ khoá",
  movie: "Phim",
  pickAMovie: "Chọn 1 phim",
  selectAMovie: "Chọn phim",
  keyword: "Từ khoá",
  enterAKeyword: "Nhập từ khoá",

  editAccount: "Sửa tài khoản",
  addAccount: "Thêm tài khoản",
  deviceId: "Device ID",
  accountIdLabel: "Account ID (email/số điện thoại/username đăng nhập)",
  recoveryEmail: "Email khôi phục",
  twoFaSecret: "Mã bí mật 2FA (TOTP)",
  cookieHeaderTikTok: "Cookie header (ttwid/msToken/s_v_web_id - lấy từ 1 phiên trình duyệt thật)",
  cookieHeaderGeneric: "Cookie header (có sẽ bỏ qua bước đăng nhập)",
  odinId: "Odin ID",
  tokenReserved: "Token (dự phòng)",

  editProxy: "Sửa proxy",
  addProxy: "Thêm proxy",
  proxyHostPort: "Proxy host:port",
  useForLoginToo: "Dùng cả khi đăng nhập trình duyệt",
  useForLoginTooltip:
    "Mặc định tắt - IP proxy không khớp vị trí địa lý thường dùng của account là nguyên nhân bị bắt captcha khi đăng nhập mới. Traffic replay thường ngày luôn dùng proxy này bất kể cờ này bật hay tắt.",

  authCredentialsTitle: "Thông tin đăng nhập",
  authCredentialsDesc: "Tài khoản dùng để đăng nhập và cào từng nền tảng.",
  columnAccountId: "Account ID",
  columnEmail: "Email",
  columnPassword: "Mật khẩu",
  column2fa: "Mã 2FA",
  removeAccountConfirm: "Xoá tài khoản này?",

  networkProxiesTitle: "Proxy mạng",
  networkProxiesDesc: "Proxy riêng từng nền tảng hoặc dùng chung cho các lượt cào.",
  columnProxy: "Proxy",
  columnUseForLogin: "Dùng để đăng nhập",
  removeProxyConfirm: "Xoá proxy này?",

  cronJobsTitle: "Cron job",
  cronJobsDesc:
    "Chỉ xem - các lịch này nằm trong crontab hoặc wrangler.toml của cinemark-scraper, không phải database. Sửa tại nguồn (xem \"Nguồn\" bên dưới), không sửa ở đây.",
  columnJob: "Job",
  columnSchedule: "Lịch chạy",
  columnSource: "Nguồn",
  columnDescription: "Mô tả",
  columnLastRun: "Chạy gần nhất",

  settingsTitle: "Cài đặt",
  settingsDescription: "Quản lý account/proxy mà spider-hub dùng để cào, và xem lần chạy gần nhất của từng cron job.",
  tabProxyAccounts: "Proxy & Account",
  tabCron: "Cron",

  logsTitle: "Nhật ký",
  logsDescription: "Xem trực tiếp 2 log structlog phía sau pipeline cào dữ liệu, đọc thẳng từ đĩa bởi cinemark-api.",
  tabCrawlConsumer: "Crawl consumer (spider-hub)",
  tabIngestConsumer: "Ingest consumer (cinemark-api)",

  searchLogsPlaceholder: "Tìm trong log này (tên event, key=value, chữ bất kỳ)...",
  allLevels: "tất cả mức độ",
  refresh: "Làm mới",
  autoRefresh: "tự động làm mới",
  logFileNotFound: "không tìm thấy file log trên máy này",
  logFileNotReachableTitle: "Không đọc được file log từ cinemark-api",
  logFileNotReachableDesc:
    "Kiểm tra SPIDER_HUB_CONSUMER_LOG_PATH / INGEST_CONSUMER_LOG_PATH trong .env của cinemark-api - dashboard này đọc file thẳng từ đĩa, nên chỉ hoạt động khi 2 service chung 1 máy (hoặc path được mount chung).",
  noMatchingLines: "(không có dòng nào khớp)",
  showingOfLines: "hiện {shown}/{total}",

  postsDescription: "Bài viết mới cào gần đây trên mọi nền tảng, mới nhất trước.",
  recentlyScrapedPosts: "Bài viết mới cào gần đây",
  columnMovieKeyword: "Phim / từ khoá",
  columnAuthor: "Tác giả",
  columnContent: "Nội dung",
  columnEngagement: "Tương tác",
  columnScraped: "Đã cào",
  postsTotal: "{n} bài viết",

  postDetail: "Chi tiết bài viết",
  openOriginal: "Xem bài gốc",

  enterAccessKey: "Nhập access key để tiếp tục",
  invalidAccessKey: "Access key không đúng",
  accessKeyRequired: "Cần nhập access key",
  accessKeyPlaceholder: "Access key",
  continueBtn: "Tiếp tục",

  timeNever: "chưa từng",
  timeJustNow: "vừa xong",
  timeMinutesAgo: "{n} phút trước",
  timeHoursAgo: "{n} giờ trước",
  timeDaysAgo: "{n} ngày trước",

  sessionValid: "Phiên {platform} còn hiệu lực",
  sessionExpired: "Phiên {platform} đã hết hạn",
  accountLabel: "account: {account}",
  expiresIn: " · hết hạn sau {ttl}",

  openNavigation: "Mở điều hướng",

  language: "Ngôn ngữ",
};

export const translations = { en, vi };
export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;
export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "vi"];
