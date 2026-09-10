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
  navComments: "Comments",
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
  maxPages: "Max pages",
  maxPagesPlaceholder: "Default",
  runSearchCrawl: "Collect now",
  stopCrawl: "Stop",
  cancelRefreshToken: "Cancel",
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
  searchAccountsPlaceholder: "Search by account ID, email, or platform...",
  columnHealth: "Status",
  columnLastChecked: "Last checked",
  checkAccountAction: "Check",
  resetCookiesAction: "Reset cookies",
  // account.last_check_status - see lib/accountHealth.ts. checkNeverChecked
  // is a FE-only label (last_check_status is null, no check ever ran) -
  // distinct from checkStatusUnknown, which is a real backend value
  // (checked, but this platform has no health-check strategy yet).
  checkStatusOk: "Working",
  checkStatusWarning: "Degraded",
  checkStatusDisabled: "Disabled",
  checkStatusUnknown: "No signal available",
  checkNeverChecked: "Not checked yet",

  // SettingsSummary
  totalAccountsStat: "Total accounts",
  activeAccountsStat: "Enabled",
  pausedAccountsStat: "Disabled",
  activeProxiesStat: "Active proxies",

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
  commentsTitle: "Comments",
  fetchComments: "Fetch comments",
  commentsRequested: "Requested - comments will appear here shortly",
  noCommentsYet: "No comments collected yet",
  commentsUnavailable: "Comments aren't available for this platform yet",

  // PostsReview bulk selection
  fetchCommentsSelected: "Fetch comments for {n} selected",
  commentsRequestedBulk: "Requested comments for {n} posts",
  commentsRequestedBulkPartial: "Requested {published} of {requested} posts (some failed to queue)",
  selectFacebookPostsHint: "Select posts below to fetch their comments",

  // CommentsReview (dedicated Comments tab)
  recentlyCollectedComments: "Recently collected comments",
  commentsTotal: "{n} comments",
  columnOnPost: "On post",

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

  // PlatformTabs refresh button
  statsUpdatedAt: "Updated {time}",

  // Locale switcher itself
  language: "Language",

  // Toasts - useTriggerCrawl / useSettings
  toastCrawlPublished: "{platform}: sent collection request for {published}/{requested} keyword(s)",
  toastTokenRefreshRequested: "{platform}: login refresh requested",
  toastTokenRefreshFailed: "Couldn't send the refresh request. Please try again.",
  toastStopRequested: "{platform}: stop requested",
  toastNothingToStop: "{platform}: nothing running to stop",
  toastAccountAdded: "Account added",
  toastAccountUpdated: "Account updated",
  toastAccountRemoved: "Account removed",
  toastProxyAdded: "Proxy added",
  toastProxyUpdated: "Proxy updated",
  toastProxyRemoved: "Proxy removed",
  toastAccountChecked: "Check result: {status}",
  toastCookiesResetRequested: "Cookie reset requested",
  toastCookiesResetFailed: "Could not request cookie reset",

  // API error codes (cinemark-api's error.code - see app/core/errors.py) ->
  // user-facing text. Every AppError subclass the backend raises has a fixed
  // code, so this is a closed set; requestFailed/requestFailedStatus below
  // are the fallback for anything outside it (e.g. the browser's own network
  // error when the request never reached the server at all).
  errorNotFound: "Not found",
  errorUnauthorized: "You're not signed in",
  errorForbidden: "You don't have access to do that",
  errorValidation: "Some of this information isn't valid",
  errorConflict: "That already exists",
  errorInternal: "Something went wrong. Please try again.",
  requestFailed: "Request failed",
  requestFailedStatus: "Request failed ({status})",
} as const;

const vi: Record<keyof typeof en, string> = {
  navOverview: "Tổng quan",
  navPosts: "Bài viết",
  navComments: "Bình luận",
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
  maxPages: "Số trang tối đa",
  maxPagesPlaceholder: "Mặc định",
  runSearchCrawl: "Thu thập ngay",
  stopCrawl: "Dừng",
  cancelRefreshToken: "Huỷ",
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
  deviceId: "ID Thiết bị",
  accountIdLabel: "ID Tài khoản (Email/số điện thoại/username đăng nhập)",
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
  columnAccountId: "ID Tài khoản",
  columnEmail: "Email",
  columnEmailPassword: "Mật khẩu email",
  columnPassword: "Mật khẩu",
  column2fa: "Mã 2FA",
  removeAccountConfirm: "Xoá tài khoản này?",
  searchAccountsPlaceholder: "Tìm theo ID tài khoản, email hoặc nền tảng...",
  columnHealth: "Trạng thái",
  columnLastChecked: "Kiểm tra gần nhất",
  checkAccountAction: "Kiểm tra",
  resetCookiesAction: "Reset cookie",
  checkStatusOk: "Đang hoạt động tốt",
  checkStatusWarning: "Có dấu hiệu bất thường",
  checkStatusDisabled: "Đã tắt",
  checkStatusUnknown: "Chưa có tín hiệu",
  checkNeverChecked: "Chưa kiểm tra",

  totalAccountsStat: "Tổng tài khoản",
  activeAccountsStat: "Đang bật",
  pausedAccountsStat: "Đang tắt",
  activeProxiesStat: "Proxy đang hoạt động",

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
  commentsTitle: "Bình luận",
  fetchComments: "Lấy bình luận",
  commentsRequested: "Đã yêu cầu - bình luận sẽ hiện ra đây sau ít phút",
  noCommentsYet: "Chưa thu thập bình luận nào",
  commentsUnavailable: "Nền tảng này chưa hỗ trợ xem bình luận",

  fetchCommentsSelected: "Lấy bình luận cho {n} bài đã chọn",
  commentsRequestedBulk: "Đã yêu cầu lấy bình luận cho {n} bài viết",
  commentsRequestedBulkPartial: "Đã yêu cầu {published}/{requested} bài viết (một số bài lỗi khi gửi yêu cầu)",
  selectFacebookPostsHint: "Chọn các bài bên dưới để lấy bình luận",

  recentlyCollectedComments: "Bình luận mới thu thập",
  commentsTotal: "{n} bình luận",
  columnOnPost: "Thuộc bài viết",

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

  statsUpdatedAt: "Cập nhật {time}",

  language: "Ngôn ngữ",

  toastCrawlPublished: "{platform}: đã gửi yêu cầu thu thập cho {published}/{requested} từ khoá",
  toastTokenRefreshRequested: "{platform}: đã gửi yêu cầu làm mới đăng nhập",
  toastTokenRefreshFailed: "Không gửi được yêu cầu làm mới. Vui lòng thử lại.",
  toastStopRequested: "{platform}: đã gửi yêu cầu dừng",
  toastNothingToStop: "{platform}: không có gì đang chạy để dừng",
  toastAccountAdded: "Đã thêm tài khoản",
  toastAccountUpdated: "Đã cập nhật tài khoản",
  toastAccountRemoved: "Đã xoá tài khoản",
  toastProxyAdded: "Đã thêm proxy",
  toastProxyUpdated: "Đã cập nhật proxy",
  toastProxyRemoved: "Đã xoá proxy",
  toastAccountChecked: "Kết quả kiểm tra: {status}",
  toastCookiesResetRequested: "Đã gửi yêu cầu reset cookie",
  toastCookiesResetFailed: "Không gửi được yêu cầu reset cookie",

  errorNotFound: "Không tìm thấy",
  errorUnauthorized: "Bạn chưa đăng nhập",
  errorForbidden: "Bạn không có quyền thực hiện việc này",
  errorValidation: "Một số thông tin không hợp lệ",
  errorConflict: "Đã tồn tại rồi",
  errorInternal: "Đã có lỗi xảy ra. Vui lòng thử lại.",
  requestFailed: "Yêu cầu thất bại",
  requestFailedStatus: "Yêu cầu thất bại ({status})",
};

export const translations = { en, vi };
export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;
export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "vi"];
