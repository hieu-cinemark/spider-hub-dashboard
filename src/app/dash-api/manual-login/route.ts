// "Đăng nhập tay" (27/10/2026): chạy spider-hub `scripts/manual_login.py` trên máy đang chạy dashboard, mở Chromium có
// cửa sổ qua proxy đã ghim của tài khoản - xem docstring của script. Hai cách chạy:
//  - Trên VPS (deploy/spider-hub-dashboard.service): MANUAL_LOGIN_DISPLAY=:99 (màn hình ảo, xem qua noVNC
//    NEXT_PUBLIC_MANUAL_LOGIN_VIEWER_URL), MANUAL_LOGIN_REDIS_PORT=6379, MANUAL_LOGIN_ALLOW_REMOTE=1 - dashboard chỉ nghe
//    127.0.0.1, vào từ ngoài qua nginx :8443 (TLS + Basic Auth, spider-hub deploy/login-display); nginx luôn ghi đè
//    X-Spider-Auth-User bằng người đã qua Basic Auth, nên request từ xa phải mang header đó.
//  - Trên Mac: Redis của server qua SSH tunnel (cổng 16379 mặc định), chỉ nhận request từ localhost.
// Route này khởi chạy tiến trình trên máy - không bao giờ mở cho request chưa qua lớp mật khẩu của nginx.
// Nằm ở /dash-api, KHÔNG ở /api: nginx chuyển mọi /api/* sang cinemark-api (27/10/2026: nút bấm trên VPS rơi vào
// cinemark-api, 404, script không bao giờ chạy).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const PLATFORMS = new Set(["facebook", "threads"]);
const SPIDER_HUB_DIR = process.env.SPIDER_HUB_DIR || path.resolve(process.cwd(), "..", "spider-hub");
const REDIS_PORT = process.env.MANUAL_LOGIN_REDIS_PORT || "16379";
const DISPLAY = process.env.MANUAL_LOGIN_DISPLAY || process.env.DISPLAY || "";
const ALLOW_REMOTE = process.env.MANUAL_LOGIN_ALLOW_REMOTE === "1";

/** Cùng quy tắc với scripts/manual_login.py: status_path() / _safe(). */
function statusFile(platform: string, accountKey: string): string {
  const safe = accountKey.toLowerCase().replace(/[^a-z0-9._@-]+/g, "_").slice(0, 120);
  return path.join(SPIDER_HUB_DIR, "logs", "manual_login", `${platform}_${safe}.json`);
}

function allowed(req: NextRequest): boolean {
  const host = (req.headers.get("host") || "").split(":")[0];
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  // Qua nginx Basic Auth: nginx ghi đè header này bằng $remote_user (người dùng tự gửi cũng bị thay).
  return ALLOW_REMOTE && Boolean(req.headers.get("x-spider-auth-user"));
}

function parse(platform: unknown, account: unknown): { platform: string; account: string } | null {
  if (typeof platform !== "string" || !PLATFORMS.has(platform)) return null;
  if (typeof account !== "string" || !/^[\w.@+-]{3,200}$/.test(account.trim())) return null;
  return { platform, account: account.trim().toLowerCase() };
}

export async function POST(req: NextRequest) {
  if (!allowed(req)) {
    return NextResponse.json(
      { error: "Không có quyền mở trình duyệt đăng nhập (cần chạy trên localhost, hoặc qua cổng có mật khẩu của nginx)." },
      { status: 403 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const input = parse(body.platform, body.account);
  if (!input) return NextResponse.json({ error: "Thiếu hoặc sai nền tảng / tài khoản." }, { status: 400 });
  const python = path.join(SPIDER_HUB_DIR, ".venv", "bin", "python");
  if (!existsSync(python)) {
    return NextResponse.json({ error: `Không tìm thấy spider-hub ở ${SPIDER_HUB_DIR} (đặt SPIDER_HUB_DIR).` }, { status: 500 });
  }
  const logDir = path.join(SPIDER_HUB_DIR, "logs", "manual_login");
  mkdirSync(logDir, { recursive: true });
  rmSync(statusFile(input.platform, input.account), { force: true }); // trạng thái của lần chạy trước
  const out = openSync(path.join(logDir, `${input.platform}_run.log`), "a");
  const child = spawn(
    python,
    ["-m", "scripts.manual_login", "--platform", input.platform, "--account", input.account],
    {
      cwd: SPIDER_HUB_DIR,
      detached: true,
      stdio: ["ignore", out, out],
      // Chạy trên máy cá nhân: không gửi cảnh báo Telegram thật (spider-hub .env có token).
      env: {
        ...process.env,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT,
        ...(DISPLAY ? { DISPLAY } : {}),
        TELEGRAM_BOT_TOKEN: "",
        TELEGRAM_CHAT_ID: "",
      },
    },
  );
  child.unref();
  return NextResponse.json({ started: true, pid: child.pid });
}

export async function GET(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const input = parse(req.nextUrl.searchParams.get("platform"), req.nextUrl.searchParams.get("account"));
  if (!input) return NextResponse.json({ error: "Thiếu hoặc sai nền tảng / tài khoản." }, { status: 400 });
  const file = statusFile(input.platform, input.account);
  if (!existsSync(file)) return NextResponse.json({ state: "pending", message: "" });
  try {
    return NextResponse.json(JSON.parse(readFileSync(file, "utf-8")));
  } catch {
    return NextResponse.json({ state: "pending", message: "" });
  }
}
