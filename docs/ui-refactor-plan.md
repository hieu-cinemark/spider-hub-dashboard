# UI refactor plan — Spider Hub Dashboard

Audit đọc-only, 12/11/2026. Chưa sửa code. Mục tiêu: dễ nhìn, dễ quét thông tin hơn.
Không đổi hành vi, không đổi dữ liệu, không đổi hợp đồng API.

---

## 0. Tóm tắt hiện trạng

Dashboard **đã có nền tảng thị giác khá tốt**: `globals.css` đã có hệ token màu đầy đủ
(`--ink`, `--paper`, `--card`, `--line`, `--accent`, `--danger`, `--warn`, `--ok`, `--tag-*`),
`DashboardCard` là kiểu card duy nhất, `MobileTable` đã giải quyết chuyện "bảng dài trên
mobile", `StatCard` + `CountDelta` thống nhất cho KPI.

Vấn đề **không nằm ở nền móng mà ở 4 chỗ**:

| # | Vấn đề | Mức độ |
| --- | --- | --- |
| A | **Thứ bậc thông tin**: cảnh báo lỗi không nổi bật hơn số liệu thường ở một số trang | Cao |
| B | **Thống nhất chưa đủ**: 4 kiểu "card" khác nhau (DashboardCard / StatCard / inset-panel / rounded-2xl thủ công), 3 hệ màu Tag, cỡ chữ rải rác 11/11.5/12/12.5/13/13.5/14/15/17/20/22/26px | Trung bình |
| C | **Bảng dài**: cột phụ chen vào cột chính, hành động rải rác, số không nhất quán canh phải | Cao |
| D | **File quá lớn**: 6 file > 300 dòng, 2 file > 850 dòng | Cao |

Ngoài ra có **2 lỗi token thật** (không phải cây bút):
- `CleanupScheduleCard.tsx:298` và `AiSettingsCard.tsx:70` dùng `var(--border)`,
  `var(--surface-muted)`, `var(--text)` — **các biến này không tồn tại** trong `globals.css`.
  Nền của khối đó đang trong suốt, chữ không có màu → hiển thị sai ở cả 2 theme.
- `CrawlQueuePanel.tsx:174-176` dùng class Tailwind `rose-50` / `indigo-50` — màu
  **không nằm trong bảng màu của app** (app dùng `--danger` / `--accent`).

---

## 1. Token & quy ước sẽ dùng

### 1.1 Màu — thêm vào `globals.css` (cả `:root` và `html.dark`)

Token **mới** (đều là ứng viên hợp lệ để gom màu rải rác về một chỗ):

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--chart-1` | `#0d6e9e` | `#3aa6dc` | series biểu đồ 1 (accent) |
| `--chart-2` | `#c2620a` | `#f19542` | series biểu đồ 2 (warn) |
| `--chart-3` | `#be185d` | `#e0649a` | series biểu đồ 3 (accent-3) |
| `--chart-4` | `#1d4ed8` | `#93c5fd` | series biểu đồ 4 (tag-blue) |
| `--chart-5` | `#0f8a5f` | `#35c08a` | series biểu đồ 5 (ok) |
| `--chart-neutral` | `#8c8c8c` | `#9aa1ae` | series fallback / platform lạ |
| `--avatar-1` … `--avatar-10` | bảng 10 màu avatar hiện có (`UserAvatar.tsx:6-17`) | giữ nguyên | chữ cái avatar |
| `--avatar-fg-1` … `--avatar-fg-10` | chữ tương ứng | giữ nguyên | chữ cái avatar |

Token **đã có, sẽ dùng nhiều hơn** thay vì hard-code:
`--tag-ok --tag-info --tag-blue --tag-warn --tag-orange --tag-danger --tag-neutral`,
`--accent --accent-deep --accent-soft --accent-2 --accent-3 --danger --warn --ok --muted`.

### 1.2 Khoảng cách — chốt 1 thang duy nhất

`4 / 8 / 12 / 16 / 24` px. Bỏ các giá trị lẻ `0.75rem`, `1.5rem`, `2.5rem`, `3.5rem`, `14px`,
`18px`, `20px` trong class Tailwind của các component sẽ sửa.
- Gap giữa các khối cấp 1 của trang: **16px** (`gap-4`).
- Gap giữa hai card cạnh nhau: **12px** (`gap-3`).
- Padding trong card: **14/16px** (giữ nguyên `.dash-card .ant-card-body`).
- Padding trong modal: **16/22px** (giữ nguyên).
- Padding nhóm form: **12px**.

### 1.3 Cỡ chữ — chốt 5 bậc

| Vai trò | Cỡ | Class / token |
| --- | --- | --- |
| Tiêu đề trang | 22px / 600 | `PageHeader` (đã có, **đang không ai dùng**) |
| Tiêu đề card | 13px / 600 | `.dash-card .ant-card-head` + `CardHeading` |
| Nhãn (micro) | 10px / 700 / uppercase / letterspacing .08em | `.micro-label` |
| Số lớn (KPI) | 26px / 600 | `.stat-value` (mới) |
| Chữ thường | 13.5px / 400 | `.dash-card .ant-table-tbody td` |
| Chữ phụ | 12.5px | `.cell-secondary` / `.cell-meta` |

Bỏ: 11px, 11.5px, 12px, 13px, 14px, 15px, 17px, 20px, 22px rải rác → gom về bảng trên.

### 1.4 Bo góc
`8px` (nút, input) · `12px` (inset panel, tag nhóm) · `14px` (card) · `16px` (modal) ·
`9999px` (pill). Đang có `rounded-2xl` (16px) rải rác ở `ItemCards.tsx`, `PageSkeleton.tsx`,
`PostsReview.tsx` → đổi sang `rounded-[14px]` cho khớp card.

---

## 2. Component dùng chung sẽ tạo / sửa

| File | Việc |
| --- | --- |
| `src/app/globals.css` | thêm token màu 1.1; thêm `.stat-value`, `.page-section`; sửa `.dash-card` padding/gap; xoá các class không dùng |
| `src/app/providers.tsx` | đưa token màu vào `theme.token` (antd) để `Tag`/`Alert`/`Badge` dùng chung nguồn; giữ `isDark ? … : …` |
| `src/components/PageHeader.tsx` | **đang tồn tại nhưng không trang nào dùng** → đưa vào `AppShell` (thay tiêu đề header hiện tại) hoặc dùng làm tiêu đề trang trong từng `page.tsx`. Giữ API cũ. |
| `src/components/StatusTag.tsx` (mới) | 1 nơi duy nhất map trạng thái → màu: `ok / warn / danger / muted / info`. Thay `STATUS_COLOR` (JobsPageView, CrawlQueuePanel), `STATUS_KEY` (2 file), `poolStatusInfo().tagColor`, `IP_TYPE_INFO`, `CATEGORY_COLOR`, `checkStatusTagColor`, `AccountIssuesCard` color. |
| `src/components/DataTable.tsx` (mới) | wrapper: `Table` + `MobileTable` + skeleton + empty + pagination, 1 lần gọi cho mọi bảng. Chuẩn hoá: cột quan trọng trái, số canh phải, hành động gom 1 cột cuối. |
| `src/components/DataStates.tsx` (mới) | `<DataLoading>`, `<DataError>`, `<DataEmpty>` — 1 bộ 3 trạng thái dùng chung. |
| `src/components/TableActions.tsx` (mới) | nút hành động gom: ≤2 nút thì hiện trực tiếp, >2 nút thì `Dropdown` với nút cuối cùng. |
| `src/components/DashboardCard.tsx` | thêm `CardHeading` variant `title`/`desc`/`badge`; cho phép `size="sm"` để card nhỏ dùng chung padding. |
| `src/components/StatCard.tsx` | nhận `tone: "ok" \| "warn" \| "danger" \| "muted"` thay vì màu hex tự do (`color="#35c08a"` ở 6 chỗ). |
| `src/components/MobileTable.tsx` | thêm `mobileSecondary` để cột phụ gập lại; giữ `mobileHidden`/`mobilePrimary`. |
| `src/components/SpiderWebBackdrop.tsx` | hạ alpha xuống, đảm bảo không giảm tương phản chữ (xem §9). |

---

## 3. Từng trang: vấn đề cụ thể → đề xuất

### 3.1 Tổng quan `/` — `src/components/platform/AllPlatformsOverview.tsx` (499 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| **Thứ bậc yếu**: `CrawlHealthBanner` là `Alert` thường, nằm trên cùng nhưng bằng phẳng với phần còn lại. Số KPI (posts/comments) đậm màu hơn cảnh báo. | `:259` | Đặt cảnh báo trong một "status strip" riêng: nền `--danger` 8%, viền trái 3px `--danger`, chữ đậm. Khi **không có** lỗi → hiện 1 dòng xanh "tất cả nền tảng ổn" (có thể bỏ, tùy chọn — sẽ hỏi). |
| KPI: 4 thẻ dùng 4 màu hex khác nhau không theo hệ token (`#1076ae #f19542 #35c08a #e0649a`). | `:268-300` | Bỏ `color` prop → `tone` prop dùng token. 4 KPI nên dùng **một** màu accent, chỉ đổi màu khi có vấn đề (đỏ/vàng). Số lớn không nên cạnh tranh với cảnh báo. |
| `PlatformHealthCell` dùng `style={{ borderColor: ... }}` inline — lẫn 3 kiểu viền. | `:131-142` | Tách 3 class `.tone-danger` / `.tone-warning` / `.tone-ok` trong globals.css. |
| 3 `section-rule` (`sectionLive`, `sectionVolume`, `sectionTrend`, `sectionResources`, `sectionInfra`) — 5 tiêu đề nhỏ giữa trang, đọc như 5 trang con. | `:309, :317, :389, :437, :451` | Giữ `section-rule` nhưng **gộp còn 3**: "Sức khoẻ" (banner + queue + health strip), "Sản lượng" (hourly + volume + funnel + trend), "Tài nguyên" (accounts + issues + perf + kafka). |
| Chart rời rạc 5 khối, mỗi khối 1 `minHeight` hard-code (`280 / 300 / 220 / 240`). | `:349, :369, :396, :421, :479` | 1 hằng `CHART_HEIGHT` từ `lib/constants.ts` cho tất cả. |
| `StatCard` cho "Job success" dùng `href="/jobs"` — click vào số để điều hướng, không phải ai cũng nhận ra. | `:291` | Giữ, nhưng thêm mũi tên nhỏ ở góc để gợi ý. |
| File 499 dòng. | toàn file | Tách: `OverviewKpis.tsx`, `OverviewHealth.tsx` (banner + queue + platform health), `OverviewVolume.tsx` (hourly + volume + funnel), `OverviewTrend.tsx`, `OverviewResources.tsx`. `AllPlatformsOverview.tsx` còn ~120 dòng. |

### 3.2 Settings `/settings` — `src/app/settings/page.tsx` (172 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| **6 tab** nhưng "Tài khoản" + "Proxy" gộp vào 1 tab (`accounts-proxies`) → tab đó nặng nhất, phải cuộn. | `:63-90` | Tách thành 2 tab: `accounts` và `proxies`. Giữ `?tab=accounts-proxies` làm alias redirect → `accounts` (không phá link cũ). |
| Tab "Omar" chỉ là thẻ bảo "Omar đã chuyển sang TikTok" — 1 tab cho 1 thông báo. | `:133-167` | Bỏ tab Omar khỏi Settings; chỉ còn link tới `/?tab=tiktok&sub=omar`. **Cần xác nhận** — không muốn mất link cũ. |
| `SettingsSummary` 4 KPI dùng 4 hex | `SettingsSummary.tsx:38-73` | `tone` prop. |
| Form nhóm: `ProxySettingsCard` dùng `Collapse` — tốt, nhưng **nút Lưu nằm ngoài** collapse, ở đáy card, cách xa nhóm đang sửa. | `ProxySettingsCard.tsx:169` | Nút lưu **dính cuối card** (`position: sticky; bottom`) hoặc đặt trong header card. Tương tự cho `AiSettingsCard` (nút Lưu ở `:118`). |
| `AiSettingsCard` — 1 card chứa 3 việc không liên quan (chọn provider / bật-tắt / prompt). | toàn file | Tách thành 2 card: "Nhà cung cấp đang dùng" + "Prompt hệ thống". |
| `CleanupScheduleCard` dùng `--border`, `--surface-muted`, `--text` (không tồn tại). | `:298-299, :304` | Sửa sang `--line`, `--paper-deep`, `--ink`. |
| `AiSettingsCard` dùng `--border` (không tồn tại). | `:70` | Sửa sang `--line`. |
| Xoá / reset / bỏ ghim proxy: xoá proxy có Popconfirm ✅, xoá provider có Popconfirm ✅, xoá account có `modal.confirm` ✅, nhưng "bỏ ghim proxy" (chọn `0` trong `ProxyPicker`) **không hỏi**. | `AccountsTable.tsx:600-606` | `ProxyPicker` khi chọn `0` → `Popconfirm` "Bỏ ghim proxy? Tài khoản sẽ được ghim lại khi có proxy trống." Nút bỏ ghim dùng màu `--warn`. |
| Filter đặt *trong* card body ở `AccountsTable` (`:461`), nhưng ở *extra* ở `MoviesTable` (`:189`) — không nhất quán. | 2 file | Chuẩn: filter luôn ở **thanh trên** (`.filter-bar`), nút hành động ở `extra` của card. |

### 3.3 Jobs `/jobs` — `src/components/JobsPageView.tsx` (466 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| 5 KPI có **3 màu hex + tone trộn**. | `:355-381` | `tone` prop; số "failed" màu đỏ **chỉ** khi failed > done. |
| Bảng Live: cột `platform` + `type` + `label` + `status` + `time` + actions = 6 cột, cột `label` (text dài) ở giữa. | `:124-172` | Cột quan trọng bên trái: `platform` → `label` → `type` → `status` → `time` → actions. |
| `LiveTable` và `HistoryTable` định nghĩa cột riêng, lệch nhau. | `:113-308` | Gộp 1 bảng `JobTable` dùng chung, khác nhau ở cột `duration` + `expandable`. |
| Bộ lọc `Segmented` + `Select` nằm **trong** card body, dưới tiêu đề card — không nhất quán với `AccountsTable` (filter-bar). | `:436-457` | Đưa lên `.filter-bar` ngay dưới tiêu đề card. |
| Nút "Dừng hết" (danger) nằm trong `extra` card — dễ bấm nhầm. | `:390-396` | Giữ vị trí nhưng thêm `Popconfirm` (đây là hành động nguy hiểm, dừng cả hàng đợi). |
| `STATUS_COLOR` map trùng lặp với `CrawlQueuePanel`. | `:56-62` | Dùng `StatusTag` chung. |
| File 466 dòng. | toàn file | Tách `JobTable.tsx`, `JobsKpis.tsx`, `JobsHistorySection.tsx`. |

### 3.4 Logs `/logs` — `src/components/LogSummary.tsx` (257 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| 4 KPI (error/warn/scanned/platforms) — **tất cả là số liệu**, nhưng lỗi/cảnh báo là thứ cần thấy trước. | `:162-196` | Số lỗi và số cảnh báo dùng `tone` đỏ/vàng. "Scanned"/"platforms" là số thường → 1 màu accent. |
| `Alert` lỗi (`:157`) và `Alert` file không tới được (`:159`) nằm giữa filter bar và KPI → đẩy lên trên filter bar. | `:157` | Lỗi API = trạng thái nghiêm trọng nhất → đặt **trên cùng**, dạng `crawl-alert-error`. |
| Filter bar có 2 `Segmented` (preset + số dòng) + text + nút — hơi nhiều, nhưng ổn. | `:118-153` | Giữ, thêm label cho 2 Segmented. |
| Bảng log: cột `time` (font-mono) → `level` → `platform` → `message`. | `:71-111` | Đưa `message` lên đầu (quan trọng nhất) — nhưng mobile `mobilePrimary` là message rồi. Chốt: desktop giữ `time` + `level` + `platform` + `message` (message rộng), `level` gộp vào `message` qua Tag? **Không** — giữ cột, chỉ đổi thứ tự cột phụ sang sau message. |
| `rowClassName` dùng `.summary-error-row` / `.summary-warn-row` (bo góc trái 3px) — tốt. | `:244` | Giữ. |

### 3.5 Posts `/posts` — `src/components/platform/PostsReview.tsx` (212 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| Card "recentlyScrapedPosts" chỉ chứa 2 bộ lọc + tab + thanh chọn — **không có dữ liệu**. Card rỗng trông vừa thừa vừa làm tốn chiều cao. | `:113-171` | Bỏ card; đưa bộ lọc + tab + thanh "đã chọn N" lên đầu trang dưới dạng `.filter-bar`. |
| Grid `rounded-2xl` + shadow mặc định → không khớp `DashboardCard`. | `:47` | `rounded-[14px]`, bỏ `shadow-...` (card trong app không có shadow). |
| `PlatformBadge` đặt ở góc trên phải ảnh (overlay) — OK. | `:59` | Giữ. |

### 3.6 Comments `/comments` — `src/components/platform/CommentsReview.tsx` (246 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| Bộ lọc (keyword + platform) ở `extra` của card, tab sentiment + segmented view ở **body** → hai hàng bộ lọc ở hai nơi khác nhau. | `:132-166` | Gom: `extra` = nút; `filter-bar` = platform + keyword + sentiment + view. |
| `Tabs` sentiment dùng class `ui-tabs` — pill tròn, khác style `Segmented` ở Posts. | `:145` | Thống nhất: dùng `Segmented` cho cả Posts lẫn Comments (chọn 1 trong 2), hoặc giữ `Tabs` cho cả hai. Đề xuất: **Segmented** (nhỏ gọn hơn trong filter bar). |

### 3.7 Movies `/movies` — `src/components/MoviesTable.tsx` (237 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| Search nằm ở `extra` cùng nút "Thêm phim" — lệch chuẩn filter-bar. | `:189-201` | Search → `.filter-bar`; nút "Thêm" giữ ở `extra`. |
| Bảng 7 cột: poster / title / director / cast / distributor / description / actions. `description` rộng 240px + `cast` không giới hạn → bảng rất rộng. | `:127-180` | `description` → ẩn sau tooltip (Tooltip title = mô tả đầy đủ), `cast` giới hạn 2 tên + "+N". `director`/`distributor` giữ. Actions gom: hiện 4 nút → `Dropdown` (tiêu chí "dropdown nếu > 2 nút"). |
| Không có trạng thái rỗng/đang tải thống nhất — `Table` có `loading` mặc định của antd, mobile `MobileTable` có skeleton riêng. | `:202-221` | `DataTable` wrapper loại cả. |

### 3.8 Omar — `src/components/omar/OmarTab.tsx` (895 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| **File lớn nhất repo.** 8 card, 12 mutation, 4 bảng, 1 cây chọn — tất cả trong 1 component. | toàn file | Tách thành: `OmarKeyCard.tsx` (key + quota + rate cap), `OmarRunCard.tsx` (chạy/dừng + trạng thái vòng), `OmarYieldCard.tsx` (bảng hiệu quả), `OmarTrendingCard.tsx` (video nổi), `OmarSearchCard.tsx` (bảng tìm kiếm), `OmarChannelsCard.tsx`, `OmarCommentsCard.tsx` (kèm `CommentKeywordPicker`), `OmarHashtagProgressCard.tsx`. File chính còn ~120 dòng. **Chỉ tách, không viết lại logic.** |
| Bảng `omarYield` có cột "Hashtag" hard-code **tiếng Anh** (`:269`) — lỗi song ngữ. | `:269` | `t("omarYieldSourceHashtag")` hoặc key tương ứng. |
| Bảng `omarYield` dùng `scroll={{ x: true }}` → bảng cuộn ngang. | `:500` | Bỏ `scroll` (cột ít, tự vừa). |
| Card "từ khoá bình luận" (CommentKeywordPicker) nằm **trong** card OmarComments, không có nút lưu rõ ràng — nút lưu nằm giữa form. | `:859-891` | Nút lưu dính đáy nhóm. |
| Bảng `search`: cột "Video" hiển thị `n (published)` — số trong ngoặc không giải thích. | `:239-247` | Tooltip đã có; thêm chữ rõ nghĩa. |
| Nhiều nút "Lưu" (key, rate cap, keywords) rải rác. | 3 chỗ | Mỗi nhóm form có nút lưu riêng ở cuối nhóm (đã là vậy) — giữ, nhưng nhất quán style (nút chính + nút phụ). |

---

## 4. Biểu đồ

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| `lib/chartSeries.ts:40-53` — bảng màu chart riêng (`#60a5fa`, `#e5e7eb`, `#22d3ee`…) không nằm trong hệ token. | toàn file | Chuyển sang token `--chart-*` trong `globals.css`, đọc qua `getComputedStyle` hoặc dùng trực tiếp `var(--chart-N)` (G2 chấp nhận CSS var trong `scale.color.range`? → **kiểm tra**; nếu không thì đọc biến qua helper). |
| `SystemPerformanceChart.tsx:8-12` — `METRIC_COLOR` hex riêng (`#0d9488 #6366f1 #d97706`). | toàn file | → `--chart-5 / --chart-4 / --chart-2`. |
| `JobResultsChart.tsx` — kiểm tra màu. | | → `--chart-ok / --chart-danger / --chart-neutral`. |
| `METRIC_CHART_COLOR` (`posts: #4f46e5`, `comments: #d97706`) — tím không có trong hệ. | `chartSeries.ts:55` | `posts` → `--chart-1`, `comments` → `--chart-2`. |
| Format số: một số chart dùng `toLocaleString()`, số khác không. | các chart | 1 helper `formatCount(n)` trong `lib/format.ts`, dùng mọi nơi. |
| Format trục thời gian: `formatShortDay` (en-US cố định) dùng cho cả 2 ngôn ngữ. | `lib/platform.tsx:69` | `formatShortDay(day, locale)` — dùng `vi-VN` khi locale vi (`dd/MM`). |
| Trạng thái rỗng/đang tải: mỗi chart tự quản lý (`ChartCardSkeleton` + `Empty` rời rạc). | nhiều file | `ChartPanel` wrapper: nhận `loading`, `isEmpty`, `error` và tự render đúng 1 trong 3. |

---

## 5. Trạng thái tải / lỗi / rỗng

Hiện có 3 cách khác nhau:
- `ChartCardSkeleton` / `TableRowsSkeleton` / `TabSkeleton` / `PostGridSkeleton` / `MobileCardSkeletonList` (5 skeleton riêng).
- `Empty` của antd dùng lẫn lộn `image={Empty.PRESENTED_IMAGE_SIMPLE}` và mặc định.
- Lỗi: `Alert` ở 3 nơi, `Typography.Text type="danger"` ở 1 nơi.

Đề xuất: `DataStates.tsx` xuất `<DataLoading kind="table"|"chart"|"cards">`, `<DataError message>`,
`<DataEmpty description>` — 1 bộ duy nhất, mọi khối dữ liệu dùng đủ 3 trạng thái.

---

## 6. AppShell — `src/components/AppShell.tsx` (325 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| Tiêu đề trang nằm ở **header** (`:268-274`) — mỗi trang không có tiêu đề riêng. `PageHeader` tồn tại nhưng không dùng ở đâu. | | Dùng `PageHeader` trong từng `page.tsx` (tiêu đề + mô tả), header chỉ giữ logo + điều hướng + chip trạng thái. Nhất quán, và người vận hành luôn biết đang ở đâu khi cuộn. |
| Sidebar: 7 mục + 3 nhóm "ops/data/system" — ổn, nhưng icon + nhãn không có mô tả con khi hover. | `:154-190` | Giữ. Trang hiện tại đã nổi bật (`.ant-menu-item-selected`). ✅ |
| Overlay mobile dùng `bg-[#161310]/60` — hex cứng. | `:199` | → `bg-[var(--sider)]/60`. |
| Header: chip trạng thái lặp 2 lần (desktop + mobile) — code trùng nhưng chấp nhận được. | `:283-317` | Giữ (mobile cần hàng riêng). |
| Sider width 232px — hơi rộng. | `:33` | Giữ 232 (đủ cho "Cài đặt" + tiếng Việt dài). |
| `SIDER_WIDTH` hard-code trong JSX `marginInlineStart`. | `:253` | OK. |

---

## 7. SpiderWebBackdrop — `src/components/SpiderWebBackdrop.tsx` (279 dòng)

| Vấn đề | Vị trí | Đề xuất |
| --- | --- | --- |
| Canvas `fixed inset-0 z-0`; nội dung trang có `z-[1]`. Nhưng `page-canvas` có gradient + canvas cùng nhau → 2 lớp wash. | `AppShell.tsx:319` | 1 lớp thôi: giữ canvas, **bỏ** radial-gradient trong `.page-canvas` (chỉ giữ nền phẳng `var(--paper)`). |
| Alpha canvas: spoke `0.11`, ring `0.07-0.13`, node `0.42` — trên nền sáng gần như vô hình, trên nền tối thì lọt. | `:149, :158, :210` | Hạ node xuống `0.28`, ring `0.05`, spoke `0.08` → không lấn át chữ. |
| Không có `pointer-events-none` trên canvas? Có (`:279`). ✅ | | |
| Canvas phủ lên sidebar (`z-0` vs sider `z-30`) ✅ | | |

---

## 8. Thứ tự thực hiện (đề xuất)

1. **Nền**: `globals.css` (token + lớp tiện ích) → `providers.tsx` (theme antd) →
   `StatusTag` / `DataStates` / `DataTable` / `TableActions` / `PageHeader` dùng chung.
2. **Tổng quan** `/` (tách file + hierarchy).
3. **Settings** (tách tab, sửa 2 lỗi token, sticky nút lưu, Popconfirm bỏ ghim).
4. **Jobs** (gộp bảng, filter bar, Popconfirm dừng hết).
5. **Logs** (đẩy lỗi lên trên, tone KPI).
6. **Posts / Comments** (gộp filter bar, đồng nhất Segmented).
7. **Movies** (filter bar, tooltip cho description, dropdown actions).
8. **Omar** (tách 8 file con).
9. **AppShell + Backdrop** (PageHeader, bỏ gradient chồng, giảm alpha).
10. **Biểu đồ** (token màu, format số/ngày, ChartPanel).

---

## 9. Câu hỏi cần anh/chị xác nhận trước khi sửa

1. **Tiêu đề trang**: đưa `PageHeader` vào từng trang (header chỉ giữ nav + chip) — OK?
   Nếu không, giữ tiêu đề ở header như hiện tại và bỏ `PageHeader`.
2. **Tab Omar trong Settings**: bỏ hẳn (chỉ còn link sang TikTok) hay giữ?
3. **Tab Settings**: tách `accounts-proxies` thành `accounts` + `proxies`?
4. **Hiển thị "không có lỗi"**: có nên hiện 1 dòng xanh "mọi nền tảng ổn" ở Tổng quan
   khi không có cảnh báo nào? (hiện tại: trống hoàn toàn)
5. **Màu KPI**: bỏ màu 4-hue trên KPI, dùng 1 màu accent + đổi sang đỏ/vàng khi có vấn đề — OK?
6. **Bảng Movies**: cột "Mô tả" ẩn sau tooltip — OK, hay phải luôn hiện?
7. **Actions gom dropdown**: ngưỡng > 2 nút — áp dụng cho Movies (4 nút), Proxies (2 nút),
   Accounts (3 nút, đã có dropdown)? Đề xuất: Accounts/Movies/FilterKeywords gom dropdown,
   Proxies giữ 2 nút.
8. **`Segmented` vs `Tabs`** cho bộ lọc sentiment (Posts/Comments): chọn 1.

---

## 10. Ngoài phạm vi (cố ý không làm)

- **Không** đổi `src/lib/api.ts`, `src/lib/types.ts`, query key, interval polling, logic `src/hooks/*`.
- **Không** thêm thư viện mới.
- **Không** đổi nội dung chữ (trừ 1 chỗ: cột "Hashtag" trong OmarYield đang hard-code tiếng Anh).
- **Không** thêm màu hex mới ngoài `globals.css` / `providers.tsx`.
- **Không** xoá tính năng / cột / cảnh báo nào.
