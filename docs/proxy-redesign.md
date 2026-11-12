# Thiết kế lại proxy nhiều nguồn — khảo sát (Giai đoạn 0) + kết quả Giai đoạn 1

Tài liệu này bắt đầu là **khảo sát, chưa sửa gì**. Mục tiêu: vẽ toàn bộ đường đi của proxy qua
3 repo (`spider-hub-dashboard`, `cinemark-api`, `spider-hub`), ghi rõ loại nguồn proxy
đang có, cột nào còn dùng / không dùng, và mọi chỗ đang dính `proxiestrust`.

> Các repo đều PUBLIC: tài liệu này không chứa IP proxy thật, user/mật khẩu, token,
> link reset, email hay UID. Mọi ví dụ đều là dạng giả.

---

## 0. Giai đoạn 1 — ĐÃ LÀM (2026-11-12)

Phần còn lại của tài liệu là khảo sát **trước** Giai đoạn 1, giữ lại để thấy bối cảnh.
Những gì đã thay đổi:

| Việc | Kết quả | Commit |
| --- | --- | --- |
| `proxy_providers.kind` | Cột `text NOT NULL DEFAULT ''` — `static` / `rotate_url` / `webtui` / `zingproxy`. Spider-hub tra adapter theo cột này, **không đoán theo URL nữa** | `spider-hub` `6b22a82` |
| `platform_proxies.provider_key` | Cột `text` — gói nào sở hữu dòng proxy này (`NULL` = nhập tay/tĩnh) | `spider-hub` `6b22a82` |
| Registry adapter | `spider-hub/social_crawler/clients/proxy_provider.py` → `ADAPTERS[kind]`, giao diện chung: `rotate()` / `reset_ip()` / `lease()` / `static_port()`. Adapter zingproxy nằm ở `clients/zingproxy.py` | `spider-hub` `744033e` |
| **Bỏ proxiestrust** | Xoá API lease cũ (`get_new_proxy`), chế độ "cấp quyền theo IP nguồn" (`ip_allowlist`), setting `provider_min_get_new_interval_seconds` → `provider_min_call_interval_seconds` | `spider-hub` `744033e` |
| Đổi tên gói | `proxiestrust_default` → `default`, `proxiestrust_tiktok_us` → `tiktok_us` (tên trung tính, không dính một nhà cung cấp). Script migration cập nhật mọi tham chiếu: `platform_proxies.provider_key` + setting `tiktok_synthetic_provider` | `spider-hub/scripts/migrate_proxy_providers.py` |
| Phía ghi API | `ProxyProviderUpdate` = Pydantic **discriminated union** theo `kind`; thêm `DELETE /settings/proxy/providers/{key}`; `/settings/proxies` trả `provider_key`, `provider_kind`, `provider_last_used_at`, `provider_last_status` | `cinemark-api` `e5a974b` |
| Dashboard | Form chọn `kind`, bỏ trường `ip_allowlist`, thêm nút xoá gói, hiện loại gói + gói sở hữu mỗi proxy | `spider-hub-dashboard` `022bbcd` |

**Quan trọng — hành vi được giữ nguyên:** hai gói `proxiestrust_*` trên DB thực ra là gói
*cổng xoay cố định* (token = `host:port:user:pass`, `api_url` = link đổi IP), không phải
API lease. Chúng vẫn chạy y như cũ qua adapter `rotate_url` — chỉ là tên và cách gọi đã
đổi. TikTok vẫn lấy IP Mỹ từ đúng gói đó, qua `lease_proxy()`.

Cột `proxy_providers.ip_allowlist` **chưa xoá khỏi DB** (còn tồn tại, không còn code nào
đọc/ghi). Xoá bằng `scripts/migrate_proxy_providers.py --apply --drop-ip-allowlist` sau khi
đã deploy cả hai phía.

**Thứ tự deploy (VPS):**

1. `python scripts/migrate_proxy_providers.py` (dry-run) → xem kế hoạch đổi tên + kind + provider_key.
2. `python scripts/migrate_proxy_providers.py --apply` → ghi vào DB (có `--revert` để hoàn tác).
3. Deploy `cinemark-api` (ghi `kind`, `provider_key`).
4. Deploy `spider-hub` (đọc `kind`, `provider_key`).
5. Deploy dashboard.

Bước 2 phải xong **trước** bước 4: code mới mặc định tìm gói `tiktok_us`, còn code cũ
tìm `proxiestrust_tiktok_us`. Nếu deploy spider-hub trước mà migration chưa chạy,
`lease_proxy("tiktok_us")` không tìm thấy gói → TikTok rơi về pool proxy thường.

---

## 1. Sơ đồ dữ liệu

```
                     ┌──────────────────────────────┐
                     │  Supabase / Postgres (Sydney) │
                     └───────────────┬──────────────┘
                                     │
      ┌──────────────────────────────┼───────────────────────────────┐
      │                              │                               │
┌─────▼──────────┐        ┌──────────▼─────────┐        ┌────────▼────────┐
│ platform_       │        │ proxy_providers    │        │ proxy_settings  │
│ proxies         │        │ (key, api_url,     │        │ (id=1, settings │
│ (proxy_url,     │        │  token,            │        │  jsonb)         │
│  username,      │        │  ip_allowlist,     │        │  ~20 key        │
│  password,      │        │  last_used_at,     │        └────────▲────────┘
│  platform,      │        │  last_status)      │                 │
│  ip_type, ...)  │        └──────────▲─────────┘                 │
└─────┬──────────┘                   │                           │
      │                              │                           │
      │  GHI/ĐỌC                     │  GHI/ĐỌC                 │ GHI/ĐỌC
      │                              │                           │
┌─────▼──────────────────────────────▼───────────────────────────▼──────┐
│                         cinemark-api (FastAPI)                        │
│  /settings/proxies            /settings/proxy           /settings/proxy│
│  /settings/proxies/{id}       (settings jsonb)          /providers     │
│  app/api/routes/settings.py                                      │
│  app/services/accounts/platform_config_db.py                      │
│  app/schemas/settings.py                                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP
                    ┌───────▼─────────┐        ┌──────────────────────┐
                    │ spider-hub-     │        │ spider-hub (crawler) │
                    │ dashboard       │        │ db/proxy_settings.py │
                    │ (Next.js 16)    │◀──────▶│ clients/proxy_provider│
                    │ ProxiesTable    │  settings│ clients/zingproxy.py │
                    │ ProxyProviders… │        │ runtime/ip_switch.py  │
                    │ ProxySettings…  │        │ health/proxy_health… │
                    └─────────────────┘        │ spiders/tiktok/…     │
                                              └──────────────────────┘
```

Luồng ghi/đọc hiện tại:

| Chiều | Đường đi |
| --- | --- |
| Dashboard → DB | `dashboard` → `PUT /settings/proxy/providers/{key}` → `platform_config_db.upsert_proxy_provider` → `proxy_providers` |
| Dashboard → DB | `dashboard` → `PUT /settings/proxy` → `upsert_proxy_settings` → `proxy_settings.settings` (jsonb) |
| Dashboard → DB | `dashboard` → `POST/PATCH /settings/proxies` → `create_proxy`/`update_proxy` → `platform_proxies` |
| Crawler → DB (đọc) | `spider-hub` → `db/proxy_settings.get_setting/get_provider` → `proxy_settings` / `proxy_providers` (cache 60 s) |
| Crawler → DB (đọc) | `spider-hub` → `db/proxies.list_proxies` → `platform_proxies` (không cache) |
| Crawler → DB (ghi) | `spider-hub` → `db/proxies.record_proxy_outcome` → `platform_proxies.status/cooldown_until/consecutive_failures` |
| Crawler → DB (ghi) | `spider-hub` → `proxy_settings.record_provider_use` → `proxy_providers.last_used_at/last_status` |

Điểm quan trọng: **`proxy_providers` không có quan hệ với `platform_proxies`.** Một dòng
`platform_proxies` không biết nó thuộc nhà cung cấp nào; code phải **đoán** bằng cách
so khớp `proxy_url` với `host:port` nằm trong `token` của provider. Đây là gốc rễ của
mọi nhánh đoán-theo-URL mà Giai đoạn 1 sẽ thay bằng cột `provider_key` + `kind`.

---

## 2. Các loại nguồn proxy đang có, và code nhận ra nó thế nào

Không có cột `kind`. Loại được **đoán** ở 3 nơi khác nhau trong `spider-hub`:

| # | Nơi đoán | Luật đoán | Kết quả |
| --- | --- | --- | --- |
| 1 | `clients/proxy_provider.get_new_proxy` | `token` có dạng `host:port:user:pass` (4 phần) → **gói cổng xoay cố định**, gọi `api_url` như link RESET, giữ nguyên cổng, đổi IP phía sau. Ngược lại → **API trả về proxy mới** (`status=SUCCESS`, đọc field `proxy` hoặc `proxy_ip_allow`). | Mặc định của mọi provider không phải webtui/zingproxy |
| 2 | `clients/proxy_provider._is_webtui` | `"webtui" in api_url` | webtui (xoay bằng `rotate_ip`, cổng giữ nguyên) |
| 3 | `clients/zingproxy.is_provider` | `urlsplit(api_url).hostname == "api.zingproxy.com"` | zingproxy (link `/open/change-ip/<key>`, đo IP qua chính cổng) |

Hệ quả: **thứ tự ưu tiên là ngầm định**. `reset_provider_for_proxy_url` thử webtui
trước, rồi mới thử gói cổng-xoay-cố-định. `rotate_port_for_account_switch` thử
zingproxy trước, rồi webtui. Một provider mới có thể bị adapter sai chỉ vì URL của nó
trùng với điều kiện của adapter khác — và không có cách nào ghi đè.

### 2.1 Bốn "loại" thực tế đang tồn tại trên DB

| Loại | Cơ chế | Trạng thái trên DB (khảo sát 2026-11-12) |
| --- | --- | --- |
| `webtui` | `GET https://proxy.webtui.vn/api.php?action=rotate_ip&token=…&proxy_id=…`, chờ IP công khai đổi (tối đa 120 s), mốc xoay lưu trong Redis `webtui:last_rotate:{proxy_id}` | 2 dòng: `webtui`, `webtui2` — cả hai còn dùng (xoay gần nhất 2026-11-12 và 2026-11-11) |
| `zingproxy` | `GET https://api.zingproxy.com/open/change-ip/<key>`, khoá Redis theo hash link, đo IP qua chính cổng, tối đa 120 s | 0 dòng trên DB hiện tại (adapter đã viết đầy đủ + có test `tests/test_zingproxy.py` + tài liệu `spider-hub/docs/zingproxy.md`) |
| `cong-xoay-cung-dinh` (cổng xoay cố định, kiểu proxiestrust) | `token` = `host:port:user:pass`, `api_url` = link RESET; gọi GET, chờ 5 s cho IP mới có hiệu lực | 2 dòng: `proxiestrust_default`, `proxiestrust_tiktok_us` |
| `api-tra-ve-proxy-moi` (lease API, kiểu proxiestrust) | `GET api_url?token=…[&ip_allow_on=on]`, đọc `proxy` / `proxy_ip_allow` | 0 dòng trên DB hiện tại (nhánh này là code của proxiestrust thuần) |

Ghi chú: hai dòng `proxiestrust_*` **không phải** `api-tra-ve-proxy-moi` mà là
`cong-xoay-cung-dinh` — token của chúng là chuỗi `host:port:user:pass`, nên code đi
nhánh link RESET. Việc `get_new_proxy` vẫn gọi được chúng là do tên hàm cũ.

### 2.2 `ip_allowlist` — chế độ riêng của proxiestrust

Cột boolean trên `proxy_providers`. Khi bật:
- thêm tham số `ip_allow_on=on` vào request;
- đọc field `proxy_ip_allow` (thay vì `proxy`) trong response;
- parse dạng `host:port` (**không** có user/pass) → lease không mang thông tin đăng nhập.

Cơ chế này **chỉ có ý nghĩa với proxiestrust**. Webtui/zingproxy không đọc cột này.
Trên DB hiện tại cả 4 dòng đều `ip_allowlist = false`, và các dòng `proxiestrust_*`
là dòng `cổng xoay cố định` — vốn **không dùng** `ip_allowlist` (nhánh RESET chạy
trước khi đọc cột này). Nói cách khác: **`ip_allowlist` hiện là cột chết** trên DB,
chỉ còn ý nghĩa với nhánh `api-tra-ve-proxy-moi` vốn không có dòng nào.

---

## 3. Bảng cột / setting: dùng ở đâu, còn cần không

### 3.1 `platform_proxies`

| Cột | Ai đọc/ghi | Còn cần? |
| --- | --- | --- |
| `id` | khóa, dashboard, `assigned_proxy_id` | Có |
| `platform` | `all` / `facebook` / `threads` / `tiktok` / `public` — `db/proxies.py` lọc theo `platform IN (platform,'all')`; `facebook/auth/http_refresh.py` và `post_metrics.py` lấy `platform='public'` | Có |
| `proxy_url` (`host:port`) | khớp với token provider để đoán nguồn; `ip_switch` xoay theo `proxy["url"]` | Có (sẽ thêm `provider_key` bên cạnh) |
| `username` / `password` | dựng URL proxy | Có |
| `login_use_proxy` | `tiktok/auth/bootstrap.py` (nhánh đã đăng nhập), `accounts/nurture.py` | Có |
| `ip_type` (`unknown`/`static`/`rotating`) | `db/proxies.meta_proxy_violation` — **Facebook chỉ chạy proxy `static`**; `pin_account_to_least_loaded_proxy` lọc theo `ip_type`; `runtime/ip_switch.claim` bỏ qua xoay khi `static`; `measure_proxy_ip.py --write` ghi nhãn | Có, nhưng là **nhãn thủ công** — sẽ mâu thuẫn với `kind` của provider. Cần chốt: `ip_type` = thuộc tính vật lý của IP, `kind` = thuộc tính của nguồn. |
| `enabled` | pool chỉ lấy proxy `enabled = true` | Có |
| `status` (`active`/`degraded`) | `db/proxies.record_proxy_outcome` | Có |
| `cooldown_until` | pool + circuit breaker | Có |
| `consecutive_failures` | cooldown = `base * 2^failures` | Có |
| `last_used_at` | sắp xếp ưu tiên proxy ít dùng | Có |
| `created_at` / `updated_at` | dashboard hiển thị | Có |
| `assigned_account_count` | **không phải cột** — subquery trong `list_proxies` | Có (giữ nguyên) |
| **`provider_key`** (mới) | chưa có | **Thêm ở Giai đoạn 1** — `NULL` = proxy nhập tay/tĩnh |

### 3.2 `proxy_providers`

| Cột | Ai đọc/ghi | Còn cần? |
| --- | --- | --- |
| `key` | khoá; `tiktok_synthetic_provider` trỏ vào đây; `reset_provider_for_proxy_url` duyệt tất cả key | Có |
| `api_url` | URL API của adapter (link RESET / link change-ip / endpoint rotate_ip) | Có, nhưng **ý nghĩa khác nhau theo loại** → Giai đoạn 1 nên đặt tên lại theo `kind` |
| `token` | token API (webtui/zingproxy/proxiestrust lease) **hoặc** chuỗi `host:port:user:pass` (gói cổng xoay cố định) | Cần tách: 2 ý nghĩa trong 1 cột |
| `ip_allowlist` | chỉ nhánh `api-tra-ve-proxy-moi` | **Có thể bỏ** nếu bỏ proxiestrust (giữ cột trong DB) |
| `last_used_at` / `last_status` | `record_provider_use` ghi; dashboard hiện "lần xoay gần nhất + trạng thái" | Có — nhưng chỉ ghi được khi code **thực sự gọi** provider; webtui ghi qua `record_provider_use`, zingproxy ghi qua cùng hàm |
| **`kind`** (mới) | chưa có | **Thêm ở Giai đoạn 1**: `static` / `webtui` / `zingproxy` / `rotate_url` |

### 3.3 `proxy_settings` (jsonb singleton)

| Key | Đọc ở đâu | Còn cần? |
| --- | --- | --- |
| `repin_after_consecutive_failures` | `runtime/pool.py:248` | Có |
| `max_accounts_per_ip` | `db/proxies.py:244` | **Có, nhưng thiếu ở `cinemark-api`!** `ProxySettings` (app/schemas/settings.py) **không** có key này, nên dashboard không sửa được và spider-hub luôn dùng mặc định 2. Cần thêm vào API. |
| `cooldown_base_minutes` | `db/proxies.py:414` | Có |
| `cooldown_max_minutes` | `db/proxies.py:415` | Có |
| `health_check_ping_url` | `health/proxy_health_check.py:65` | Có |
| `health_check_timeout_seconds` | `health/proxy_health_check.py:67` | Có |
| `health_check_alert_after_failures` | `health/proxy_health_check.py:121` | Có |
| `health_check_streak_ttl_hours` | `health/proxy_health_check.py:87` | Có |
| `provider_request_timeout_seconds` | `proxy_provider.py` (4 chỗ), `zingproxy.py:92` | Có (dùng chung cho mọi adapter) |
| `provider_min_get_new_interval_seconds` | `proxy_provider.py:107` (`_wait_min_interval`) | **Chỉ dùng cho nhánh proxiestrust** (`get_new_proxy` + `_reset_static_port`) |
| `provider_max_cooldown_wait_seconds` | `proxy_provider.py:476` (proxiestrust), `zingproxy.py:93` | Dùng chung — zingproxy cần, nên **giữ** |
| `exhausted_backoff_base_seconds` | `consumer/loop.py` | Có |
| `exhausted_backoff_growth_factor` | `consumer/loop.py` | Có |
| `exhausted_backoff_max_seconds` | `consumer/crawl_request_consumer.py` | Có |
| `exhausted_max_requeues` | `consumer/loop.py` | Có |
| `tiktok_synthetic_provider` | `spiders/tiktok/client.py:177` và `:252`, `spiders/tiktok/auth/bootstrap.py:101` | Có, nhưng **giá trị mặc định là `proxiestrust_tiktok_us`** |
| `tiktok_hashtag_max_attempts` | `spiders/tiktok/features/hashtag_search/search.py:173`, `channel_videos/search.py:90` | Có |
| `tiktok_comments_max_attempts` | `spiders/tiktok/features/comments/comments.py:125` | Có |
| `fb_logged_out_metrics_enabled` | `consumer/jobs/post_metrics.py` | Có |

**Lệch đồng bộ phải sửa ở Giai đoạn 1:** `max_accounts_per_ip` có ở `spider-hub` nhưng
thiếu ở `cinemark-api` (`app/schemas/settings.py`) → dashboard không sửa được key này.
Hai bên còn phải giữ đồng bộ khi thêm/bớt key (spider-hub đọc trong `db/proxy_settings.DEFAULTS`,
cinemark-api đọc trong `app/schemas/settings.ProxySettings`).

---

## 4. Mọi chỗ dính `proxiestrust` (grep `proxiestrust|proxies_trust|get_new`)

### 4.1 `spider-hub`

| File | Dòng | Nội dung | Xử lý Giai đoạn 1 |
| --- | --- | --- | --- |
| `social_crawler/clients/proxy_provider.py` | toàn bộ module | Triển khai nhánh proxiestrust: `get_new_proxy` (API trả IP mới), `_reset_static_port` (link RESET của gói cổng xoay cố định), `_parse_proxy_string`, `_parse_ip_allow_string`, `_wait_min_interval`, `_cooldown_wait_seconds`, `static_port_proxy`, `_last_get_new_at` | Tách thành adapter theo `kind`; giữ hành vi, bỏ đoán-theo-URL |
| | 120 | `def get_new_proxy(*, provider_key: str = "proxiestrust_default")` | **Default `proxiestrust_default` phải bỏ** (bắt buộc chỉ định `provider_key`) |
| | 121-138 | docstring giải thích `ip_allowlist` / `ip_allow_on` / `proxy_ip_allow` | Viết lại theo adapter |
| | 88-95 | `_parse_ip_allow_string` (dạng `host:port` không user/pass) | Chỉ adapter `rotate_url`/lease dùng |
| | 101-117 | `_wait_min_interval` — `provider_min_get_new_interval_seconds` | Chuyển thành thuộc tính của adapter `proxiestrust` |
| | 470-477 | `_cooldown_wait_seconds` — `provider_max_cooldown_wait_seconds` | Giữ (zingproxy dùng chung) |
| | 259-266 | `static_port_proxy` — lấy `host:port` từ token, **không** gọi reset | Cần cho `tiktok/auth/bootstrap.py`; giữ nhưng đổi tên theo `kind` |
| | 210-253 | `_reset_static_port` — gọi link RESET, chờ 5 s (`_RESET_SETTLE_SECONDS`) | Đây là loại `rotate_url` thực tế |
| `social_crawler/db/proxy_settings.py` | 67 | `"tiktok_synthetic_provider": "proxiestrust_tiktok_us"` | **Đổi mặc định** sang key không chứa tên nhà cung cấp, ví dụ `tiktok_us` |
| | 57 | `"provider_min_get_new_interval_seconds": 60.0` | Bỏ nếu không còn adapter nào dùng |
| | 11-13 | docstring: "mỗi gói proxy xoay vòng của nhà cung cấp (xem proxy_provider.get_new_proxy)" | Viết lại |
| | 55 | comment "proxy_provider.get_new_proxy (API thuê proxy xoay vòng của nhà cung cấp)" | Viết lại |
| `social_crawler/spiders/tiktok/client.py` | 71 | comment: mặc định `"proxiestrust_tiktok_us"` | Cập nhật |
| | 170-178 | comment dài về `ip_allowlist` của proxiestrust + `get_new_proxy` | Cập nhật |
| | 178 | `lease = proxy_provider.get_new_proxy(provider_key=provider_key)` | Đổi sang `ADAPTERS[kind].rotate(...)` |
| | 252 | `us_port = proxy_provider.static_port_proxy(...)` | Đổi sang adapter |
| `social_crawler/spiders/tiktok/auth/bootstrap.py` | 101 | `us_port = proxy_provider.static_port_proxy(str(get_setting("tiktok_synthetic_provider")))` | Đổi sang adapter |
| `social_crawler/spiders/tiktok/features/hashtag_search/search.py` | 109-110, 235-236 | comment về pool proxiestrust Mỹ và `_MAX_COOLDOWN_WAIT_SECONDS` của `get_new_proxy` | Cập nhật |
| `social_crawler/runtime/ip_switch.py` | 115 | `proxy_provider.rotate_port_for_account_switch(proxy["url"])` | Đổi sang registry adapter |
| | 131 | `proxy_provider.WEBTUI_MIN_ROTATE_GAP_SECONDS` | Giữ (webtui) |
| `social_crawler/health/proxy_health_check.py` | 111 | `proxy_provider.reset_provider_for_proxy_url(proxy["url"])` | Đổi sang registry adapter |
| `social_crawler/spiders/common/comet_graphql_client.py` | 1169 | `proxy_provider.reset_provider_for_proxy_url(url)` | Đổi sang registry adapter |
| `tests/test_proxy_provider.py` | toàn bộ | test cho `get_new_proxy` (API lease + link RESET) | Viết lại thành test từng adapter |
| `.env.example` | 48 | comment "Rotating-proxy vendor tokens (proxiestrust)…" | Sửa nếu bỏ proxiestrust |
| `README.md` | 307 | "proxy_provider.py — proxiestrust.com 'get new proxy' API" | Sửa |

### 4.2 `cinemark-api`

| File | Dòng | Nội dung | Xử lý |
| --- | --- | --- | --- |
| `app/schemas/settings.py` | 391 | `tiktok_synthetic_provider: str = Field(default="proxiestrust_tiktok_us", …)` | **Đổi mặc định** — phải khớp với spider-hub |
| | 383 | `provider_min_get_new_interval_seconds: float = Field(default=60.0, …)` | Bỏ nếu không dùng (giữ cột trong DB, chỉ ngừng đọc/ghi) |

Không có chỗ nào khác trong `cinemark-api` chứa "proxiestrust" — nhưng `app/schemas/settings.py`
cũng **thiếu `max_accounts_per_ip`** (xem §3.3).

### 4.3 `spider-hub-dashboard`

| File | Dòng | Nội dung | Xử lý |
| --- | --- | --- | --- |
| `src/i18n/translations.ts` | 765 | `proxySectionVendorDesc: "… (e.g. proxiestrust) …"` | Viết lại, bỏ tên nhà cung cấp |
| | 799 | `proxyProviderKeyHint: "… (e.g. \"proxiestrust_tiktok_us\") …"` | Ví dụ → `tiktok_us` |
| | 806 | `proxyProviderIpAllowlistHint: "… For proxiestrust this draws from a cleaner IP pool."` | Bỏ câu cuối (hoặc bỏ cả key) |
| `src/i18n/translations.vi.ts` | 731, 765, 772 | bản tiếng Việt của 3 chuỗi trên | Sửa đồng bộ |
| `src/lib/types.ts` | 506 | `provider_min_get_new_interval_seconds: number;` | Bỏ nếu bỏ setting |
| `src/components/settings/ProxySettingsCard.tsx` | 58 | field `provider_min_get_new_interval_seconds` | Bỏ |
| `src/components/settings/ProxyProviderFormModal.tsx` | 63 | `<Input placeholder="proxiestrust_tiktok_us" …>` | Đổi placeholder |
| | 71 | `<Input placeholder="https://proxiestrust.com/sp07api/get_new" />` | Đổi placeholder (nên theo `kind`) |
| `src/components/settings/ProxyProvidersCard.tsx` | 45-47 | cột "Kiểu xác thực" (`ip_allowlist` vs user/pass) | Thay bằng cột "loại" (`kind`) |

> Lưu ý: `proxyProviderMode` / `proxyProviderModeIpAllow` / `proxyProviderModeUserPass`
> và `proxyProviderIpAllowlist` là i18n **chỉ dùng cho `ip_allowlist`** — sẽ xoá cùng
> nhóm nếu bỏ cột.

---

## 5. Khảo sát dữ liệu thật (2026-11-12)

Script chỉ đọc: `spider-hub/scripts/audit_proxy_sources.py`
(chạy `PYTHONPATH=. .venv/bin/python scripts/audit_proxy_sources`). Script chỉ `SELECT`,
không in token / user / mật khẩu / IP (mọi IP và `host:port` bị thay bằng `<ip>` /
`<host:port>`).

### 5.1 `proxy_providers`

| key | loại (đoán hiện tại) | token | ip_allowlist | lần dùng cuối | kết quả |
| --- | --- | --- | --- | --- | --- |
| `proxiestrust_default` | `cong-xoay-cung-dinh` | có | false | 2026-11-03 04:25 | ok |
| `proxiestrust_tiktok_us` | `cong-xoay-cung-dinh` | có | false | **2026-11-12 07:05** | ok |
| `webtui` | `webtui` | có | false | **2026-11-12 03:15** | ok (đã xoay) |
| `webtui2` | `webtui` | có | false | 2026-11-11 09:31 | ok (đã xoay) |

→ **Không có dòng `zingproxy`, không có dòng `api-tra-ve-proxy-moi`.**
→ `proxiestrust_tiktok_us` **vừa được dùng trong ngày** (07:05 UTC 12/11).

### 5.2 `platform_proxies`

| Chỉ số | Giá trị |
| --- | --- |
| tổng số dòng | 9 |
| đang bật | 9 |
| tắt | 0 |
| pool `active` | 8 |
| pool `degraded` | 1 |
| theo nền tảng | facebook 6, public 1, threads 1, tiktok 1 |
| theo `ip_type` | static 7, unknown 2 |

Gán theo nhà cung cấp (khớp `host:port` trong token, hoặc `host:port` trong `last_status`):

| provider | số proxy đang bật |
| --- | --- |
| `proxiestrust_default` | **1** |
| `proxiestrust_tiktok_us` | **1** |
| `webtui` | 1 |
| `webtui2` | 1 |
| *(không khớp provider nào — nhập tay/tĩnh)* | 5 (id 13, 15, 18, 19, 20) |

### 5.3 Setting liên quan (giá trị hiệu lực)

| key | giá trị | nguồn |
| --- | --- | --- |
| `tiktok_synthetic_provider` | `proxiestrust_tiktok_us` | **mặc định** (chưa lưu trong DB) |
| `provider_min_get_new_interval_seconds` | 60.0 | mặc định |
| `provider_max_cooldown_wait_seconds` | 120.0 | mặc định |
| `provider_request_timeout_seconds` | 10.0 | mặc định |

> `proxy_settings` hiện **rỗng** — mọi giá trị đang lấy từ `DEFAULTS` ở
> `spider-hub/social_crawler/db/proxy_settings.py`. Nghĩa là `tiktok_synthetic_provider`
> đang là `proxiestrust_tiktok_us` vì **mặc định trong code**, không phải vì cấu hình.

### 5.4 ⛔ Điều kiện DỪNG đã bị kích hoạt

Theo yêu cầu Giai đoạn 0: **dừng và chờ quyết định của người vận hành trước khi xoá.**

| điều kiện | trạng thái |
| --- | --- |
| còn proxy `proxiestrust` **đang bật** | ✅ **CÓ** — `proxiestrust_default` (1 proxy) và `proxiestrust_tiktok_us` (1 proxy) |
| `tiktok_synthetic_provider` trỏ về proxiestrust | ✅ **CÓ** — trỏ `proxiestrust_tiktok_us` (mặc định trong cả 2 repo) |
| nguồn proxiestrust còn **đang hoạt động** | ✅ **CÓ** — `proxiestrust_tiktok_us` dùng lúc 2026-11-12 07:05 UTC, kết quả `ok` |

Nghĩa là: **không được xoá proxiestrust ở Giai đoạn 1** nếu chưa chọn nguồn thay thế.
Hai câu hỏi cần người vận hành quyết:

1. **`proxiestrust_tiktok_us` (gói TikTok Mỹ) thay bằng gì?** TikTok chỉ chạy qua IP
   Mỹ — `spiders/tiktok/client.py` ghi rõ: nếu provider có token mà không xin được
   lease thì **bỏ lượt crawl**, không rơi về pool (pool chỉ có proxy VN/SG). Các lựa chọn:
   giữ nguyên proxiestrust (chỉ đổi tên key), hoặc mua/chuyển sang gói Mỹ khác.
2. **`proxiestrust_default` (gói cổng xoay cố định VN) thay bằng gì?** Đây là gói có
   `link reset`, IP sau cổng đổi được. `webtui`/`webtui2` cũng là cổng-xoay-theo-cổng
   (đã dùng cho Meta), nên về mặt kỹ thuật có thể dùng lại — nhưng khác quốc gia và
   khác nhà cung cấp, cần xác nhận.

---

## 6. Kết luận & đề xuất Giai đoạn 1

### 6.1 Vấn đề gốc

1. **Không có quan hệ giữa proxy và nhà cung cấp.** `platform_proxies` không biết mình
   thuộc provider nào → mọi logic xoay phải đoán bằng cách so `proxy_url` với token.
   → Thêm `platform_proxies.provider_key` (FK logic, `NULL` = nhập tay).
2. **Không có `kind` tường minh.** Loại được suy ra từ URL/token bằng 3 luật đoán
   khác nhau ở 3 nơi → thêm `proxy_providers.kind`.
3. **Một cột `token` mang 2 ý nghĩa** (token API vs chuỗi `host:port:user:pass`).
4. **`ip_allowlist` là cột chết** trên DB (cả 4 dòng đều false; 2 dòng proxiestrust là
   dạng cổng-xoay-cố-định không dùng cột này).
5. **`provider_min_get_new_interval_seconds`** chỉ phục vụ nhánh proxiestrust.
6. **`max_accounts_per_ip` lệch giữa 2 repo** — spider-hub có, cinemark-api thiếu → UI
   không sửa được.
7. **Dashboard thiếu chức năng**: không lọc được proxy theo nguồn/nền tảng/trạng thái,
   không hành động hàng loạt, không có nút xoá provider, không thấy "số proxy của
   provider".

### 6.2 Lộ trình (chi tiết ở Giai đoạn 1)

| Bước | Repo | Nội dung |
| --- | --- | --- |
| 1 | cinemark-api + spider-hub | Thêm cột `proxy_providers.kind` (`static`/`webtui`/`zingproxy`/`rotate_url`) và `platform_proxies.provider_key`; migration điền `provider_key` bằng **đúng luật đoán hiện tại** (dry-run in kết quả trước, có lệnh hoàn tác) |
| 2 | spider-hub | `clients/proxy_provider.py` → registry `ADAPTERS[kind]`, cùng giao diện `rotate(proxy) -> (ok, egress_ip \| lỗi)`, `cooldown`, `health`. Xoá mọi nhánh đoán-theo-URL. Giữ nguyên hành vi webtui/zingproxy/proxiestrust |
| 3 | spider-hub | Xoá proxiestrust **nếu và chỉ nếu** người vận hành đã quyết định nguồn thay thế (§5.4). Setting bỏ thì **giữ cột trong DB**, chỉ ngừng đọc/ghi |
| 4 | cinemark-api | CRUD provider nhận `kind` + trường theo loại (Pydantic **discriminated union**); `/settings/proxies` trả thêm `provider_key`, `kind`, `last_rotate_at`, `last_rotate_status`; token vẫn che |
| 5 | cinemark-api + spider-hub | Đồng bộ `ProxySettings` 2 bên (thêm `max_accounts_per_ip`, bỏ/giữ `provider_min_get_new_interval_seconds`) |
| 6 | dashboard | Tách 3 phần: Nguồn proxy / Danh sách proxy / Thông số pool & health (chi tiết ở Giai đoạn 2) |

### 6.3 Thứ tự deploy (đề xuất)

`cinemark-api` → `spider-hub` → `dashboard`.

Migration DB chạy **trên VPS** (Supabase, cùng DB cả 3 repo dùng):
- Cột mới (`kind`, `provider_key`) được thêm bằng `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
  → không phá code cũ, có thể thêm trước khi deploy code.
- **Điền `provider_key` bằng luật đoán hiện tại** → chạy sau khi đã thêm cột, và **trước**
  khi deploy spider-hub mới (code mới đọc cột này).
- `cinemark-api` mới (đọc/ghi `kind`) phải deploy **trước** spider-hub mới? Không bắt
  buộc: spider-hub chỉ *đọc* `kind`, nếu chưa có cột thì rơi về luật đoán cũ. Nhưng nếu
  `kind` có `NOT NULL`/default thì phải deploy API trước để nó điền được giá trị đúng.

### 6.4 Kiểm tra mỗi commit

- `cinemark-api` / `spider-hub`: `TELEGRAM_BOT_TOKEN= TELEGRAM_CHAT_ID= .venv/bin/python -m pytest -q`,
  `ruff check` trên file đã sửa.
- `spider-hub-dashboard`: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
