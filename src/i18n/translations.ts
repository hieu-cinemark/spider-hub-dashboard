// Flat key -> string dictionary per locale (not a deep nested tree) - keeps
// `t("someKey")` trivially type-checked against `keyof typeof en` with no
// recursive path-type machinery, which is worth more here than nesting
// aesthetics for a dashboard this size. Grouped by the component that owns
// each key (comments only, doesn't affect the type). Values can contain
// `{placeholder}` tokens - see useTranslation's t() for substitution.
//
// Wording rule: this dashboard is used by non-technical staff (adding
// keywords, checking counts, logging in accounts) alongside engineers - so
// copy here avoids internal system/repo names (spider-hub, cinemark-api,
// cinemark-scraper, cron, crawl/scrape jargon) in favor of plain
// descriptions of what's actually happening ("collecting posts", "the
// server", "the engineering team"). The Settings > Accounts/Proxies forms
// still name real technical fields (Device ID, cookie, 2FA) where that's
// literally what has to be typed in - simplifying those further would make
// the form impossible to fill in correctly, not friendlier.

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
  allPlatformsShared: "Used for every platform",
  allPlatformsFilter: "All platforms",

  // Overview page + AllPlatformsOverview
  totalPostsCollected: "Total posts collected",
  postsPerPlatform: "Posts per platform",
  dailyPostsLast14Days: "Posts per day, last 14 days",
  lastCrawlPerPlatform: "Last collected, per platform",
  columnPostsCollected: "Posts collected",
  columnLastScraped: "Last collected",
  noPostsYet: "No posts yet",
  noPostsInWindow: "No posts in this window",
  couldNotReachApi: "Couldn't connect to the server. Please try again.",
  allTab: "All",

  // PlatformDetail
  fedBy: "Data source",
  sourceCollector: "Automatic collection",
  sourceOtherSystem: "A separate system",
  platformPostsTitle: "{platform} posts",
  platformDailyPostsTitle: "{platform} - posts per day (last 14 days)",
  notTriggerableSpiderHub:
    "Posts for {platform} aren't collected automatically from this dashboard yet - ask the engineering team to run a collection manually until this is set up.",
  notTriggerableOther: "{platform} is collected by a separate automated system, so there's no manual run button here.",

  // PlatformActions / CrawlTriggerForm / RefreshLogPanel
  runACrawl: "Collect posts",
  token: "Login session",
  refreshToken: "Refresh login",
  refreshingEllipsis: "refreshing…",
  refreshed: "refreshed",
  refreshFailed: "refresh failed",
  allEnabledKeywords: "All enabled keywords",
  newKeyword: "New keyword",
  runSearchCrawl: "Collect now",
  stopCrawl: "Stop",
  jobRunningFor: "Collecting now: {keyword}",
  refreshStatusIdle: "Idle",
  refreshStatusRunning: "Refreshing…",
  refreshStatusSuccess: "Refresh succeeded",
  refreshStatusFailed: "Refresh failed",
  waitingForOutput: "waiting for results…",
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
  recoveryEmailPassword: "Recovery email password",
  twoFaSecret: "2FA secret key",
  cookieHeaderTikTok: "Cookie info (copied from a real, logged-in browser - includes ttwid/msToken/s_v_web_id)",
  cookieHeaderGeneric: "Cookie info (if set, skips the login step)",
  odinId: "Odin ID",
  tokenReserved: "Token (not used yet)",

  // ProxyFormModal
  editProxy: "Edit proxy",
  addProxy: "Add proxy",
  proxyHostPort: "Proxy address (host:port)",
  useForLoginToo: "Also use for browser login",
  useForLoginTooltip:
    "Off by default - a proxy location that doesn't match where this account normally logs in from can trigger a captcha on a fresh login. Day-to-day collection always uses this proxy regardless of this setting.",

  // AccountsTable
  authCredentialsTitle: "Login accounts",
  authCredentialsDesc: "Accounts used to log in and collect posts from each platform.",
  columnAccountId: "Account ID",
  columnEmail: "Email",
  columnEmailPassword: "Email password",
  columnPassword: "Password",
  column2fa: "2FA secret",
  removeAccountConfirm: "Remove this account?",

  // ProxiesTable
  networkProxiesTitle: "Network proxies",
  networkProxiesDesc: "Per-platform or shared proxy used when collecting posts.",
  columnProxy: "Proxy",
  columnUseForLogin: "Use for login",
  removeProxyConfirm: "Remove this proxy?",

  // CronJobsTable
  cronJobsTitle: "Scheduled tasks",
  cronJobsDesc: "Read-only - these schedules are set directly in the code, not here. Ask the engineering team to change them.",
  columnJob: "Task",
  columnSchedule: "Schedule",
  columnSource: "Source",
  columnDescription: "Description",
  columnLastRun: "Last run",

  // Settings page
  tabProxyAccounts: "Accounts & Proxies",
  tabCron: "Scheduled tasks",

  // Logs page
  tabCrawlConsumer: "Collection activity",
  tabIngestConsumer: "Data processing activity",

  // LogViewer
  searchLogsPlaceholder: "Search this log...",
  allLevels: "all levels",
  refresh: "Refresh",
  autoRefresh: "auto-refresh",
  logFileNotFound: "log file not found on this server",
  logFileNotReachableTitle: "Can't read the log file",
  logFileNotReachableDesc:
    "This dashboard reads the log file directly off the server's disk, so it only works when everything runs on the same machine (or the file is shared). Ask the engineering team to check the setup.",
  noMatchingLines: "(nothing matches)",
  showingOfLines: "showing {shown} of {total}",

  // posts/page.tsx + PostsReview
  recentlyScrapedPosts: "Recently collected posts",
  columnMovieKeyword: "Movie / keyword",
  columnAuthor: "Author",
  columnContent: "Content",
  columnEngagement: "Engagement",
  columnScraped: "Collected",
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
  sessionValid: "{platform} is logged in",
  sessionExpired: "{platform} needs to log in again",
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
  allPlatformsShared: "Dùng chung cho mọi nền tảng",
  allPlatformsFilter: "Tất cả nền tảng",

  totalPostsCollected: "Tổng số bài viết đã thu thập",
  postsPerPlatform: "Bài viết theo nền tảng",
  dailyPostsLast14Days: "Số bài viết theo ngày, 14 ngày gần nhất",
  lastCrawlPerPlatform: "Lần thu thập gần nhất, theo nền tảng",
  columnPostsCollected: "Bài viết đã thu thập",
  columnLastScraped: "Thu thập gần nhất",
  noPostsYet: "Chưa có bài viết nào",
  noPostsInWindow: "Không có bài viết trong khoảng này",
  couldNotReachApi: "Không kết nối được tới máy chủ. Vui lòng thử lại.",
  allTab: "Tất cả",

  fedBy: "Nguồn dữ liệu",
  sourceCollector: "Thu thập tự động",
  sourceOtherSystem: "Một hệ thống khác",
  platformPostsTitle: "Bài viết {platform}",
  platformDailyPostsTitle: "{platform} - số bài viết theo ngày (14 ngày gần nhất)",
  notTriggerableSpiderHub:
    "Việc thu thập bài viết cho {platform} chưa được tự động hoá trên dashboard này - cần nhờ đội kỹ thuật chạy thủ công cho tới khi hoàn thiện.",
  notTriggerableOther: "{platform} được một hệ thống khác tự động thu thập, nên ở đây không có nút chạy thủ công.",

  runACrawl: "Thu thập bài viết",
  token: "Phiên đăng nhập",
  refreshToken: "Làm mới đăng nhập",
  refreshingEllipsis: "đang làm mới…",
  refreshed: "đã làm mới",
  refreshFailed: "làm mới thất bại",
  allEnabledKeywords: "Tất cả từ khoá đang bật",
  newKeyword: "Thêm từ khoá",
  runSearchCrawl: "Thu thập ngay",
  stopCrawl: "Dừng",
  jobRunningFor: "Đang thu thập: {keyword}",
  refreshStatusIdle: "Chưa chạy",
  refreshStatusRunning: "Đang làm mới…",
  refreshStatusSuccess: "Làm mới thành công",
  refreshStatusFailed: "Làm mới thất bại",
  waitingForOutput: "đang chờ kết quả…",
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
  recoveryEmailPassword: "Mật khẩu email khôi phục",
  twoFaSecret: "Mã bí mật 2FA",
  cookieHeaderTikTok: "Thông tin cookie (lấy từ 1 trình duyệt đã đăng nhập thật - gồm ttwid/msToken/s_v_web_id)",
  cookieHeaderGeneric: "Thông tin cookie (nếu có sẽ bỏ qua bước đăng nhập)",
  odinId: "Odin ID",
  tokenReserved: "Token (chưa dùng)",

  editProxy: "Sửa proxy",
  addProxy: "Thêm proxy",
  proxyHostPort: "Địa chỉ proxy (host:port)",
  useForLoginToo: "Dùng cả khi đăng nhập trình duyệt",
  useForLoginTooltip:
    "Mặc định tắt - vị trí proxy không khớp nơi account này thường đăng nhập dễ khiến bị bắt captcha khi đăng nhập mới. Việc thu thập hằng ngày luôn dùng proxy này bất kể cài đặt này bật hay tắt.",

  authCredentialsTitle: "Tài khoản đăng nhập",
  authCredentialsDesc: "Tài khoản dùng để đăng nhập và thu thập bài viết từng nền tảng.",
  columnAccountId: "Account ID",
  columnEmail: "Email",
  columnEmailPassword: "Mật khẩu email",
  columnPassword: "Mật khẩu",
  column2fa: "Mã 2FA",
  removeAccountConfirm: "Xoá tài khoản này?",

  networkProxiesTitle: "Proxy mạng",
  networkProxiesDesc: "Proxy riêng từng nền tảng hoặc dùng chung khi thu thập bài viết.",
  columnProxy: "Proxy",
  columnUseForLogin: "Dùng để đăng nhập",
  removeProxyConfirm: "Xoá proxy này?",

  cronJobsTitle: "Tác vụ định kỳ",
  cronJobsDesc: "Chỉ xem - các lịch này được cấu hình thẳng trong code, không sửa được ở đây. Cần nhờ đội kỹ thuật để thay đổi.",
  columnJob: "Tác vụ",
  columnSchedule: "Lịch chạy",
  columnSource: "Nguồn",
  columnDescription: "Mô tả",
  columnLastRun: "Chạy gần nhất",

  tabProxyAccounts: "Tài khoản & Proxy",
  tabCron: "Tác vụ định kỳ",

  tabCrawlConsumer: "Hoạt động thu thập",
  tabIngestConsumer: "Hoạt động xử lý dữ liệu",

  searchLogsPlaceholder: "Tìm trong nhật ký này...",
  allLevels: "Tất cả mức độ",
  refresh: "Làm mới",
  autoRefresh: "Tự động làm mới",
  logFileNotFound: "Không tìm thấy file nhật ký trên máy chủ này",
  logFileNotReachableTitle: "Không đọc được file nhật ký",
  logFileNotReachableDesc:
    "Dashboard này đọc file nhật ký thẳng từ ổ đĩa máy chủ, nên chỉ hoạt động khi mọi thứ chạy chung 1 máy (hoặc file được chia sẻ). Cần nhờ đội kỹ thuật kiểm tra lại cấu hình.",
  noMatchingLines: "(không có kết quả nào khớp)",
  showingOfLines: "hiện {shown}/{total}",

  recentlyScrapedPosts: "Bài viết mới thu thập",
  columnMovieKeyword: "Phim / từ khoá",
  columnAuthor: "Tác giả",
  columnContent: "Nội dung",
  columnEngagement: "Tương tác",
  columnScraped: "Đã thu thập",
  postsTotal: "{n} bài viết",

  postDetail: "Chi tiết bài viết",
  openOriginal: "Xem bài gốc",

  enterAccessKey: "Nhập mã truy cập để tiếp tục",
  invalidAccessKey: "Mã truy cập không đúng",
  accessKeyRequired: "Vui lòng nhập mã truy cập",
  accessKeyPlaceholder: "Mã truy cập",
  continueBtn: "Tiếp tục",

  timeNever: "chưa từng",
  timeJustNow: "vừa xong",
  timeMinutesAgo: "{n} phút trước",
  timeHoursAgo: "{n} giờ trước",
  timeDaysAgo: "{n} ngày trước",

  sessionValid: "{platform} đang đăng nhập",
  sessionExpired: "{platform} cần đăng nhập lại",
  accountLabel: "Tài khoản: {account}",
  expiresIn: " · Hết hạn sau {ttl}",

  openNavigation: "Mở điều hướng",

  language: "Ngôn ngữ",
};

export const translations = { en, vi };
export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;
export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "vi"];
