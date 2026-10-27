// "Đăng nhập tay" (27/10/2026): chạy spider-hub `scripts/manual_login.py` trên máy đang chạy dashboard, mở Chromium có
// cửa sổ qua proxy đã ghim của tài khoản - xem docstring của script. Hai cách chạy:
//  - Trên VPS (deploy/spider-hub-dashboard.service): MANUAL_LOGIN_DISPLAY=:99 (màn hình ảo, xem qua noVNC
//    NEXT_PUBLIC_MANUAL_LOGIN_VIEWER_URL), Redis lấy từ .env của spider-hub, MANUAL_LOGIN_ALLOW_REMOTE=1 - request từ xa
//    phải mang API key đúng của dashboard (lib/server/manualLogin.allowed); POST thành công cấp vé (cookie) vào /novnc.
//  - Trên Mac: Redis của server qua SSH tunnel (cổng 16379 mặc định), chỉ nhận request từ localhost.
// Route này khởi chạy tiến trình trên máy - không bao giờ mở cho request không có API key đúng.
// Nằm ở /dash-api, KHÔNG ở /api: nginx chuyển mọi /api/* sang cinemark-api (27/10/2026: nút bấm trên VPS rơi vào
// cinemark-api, 404, script không bao giờ chạy).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { NOVNC_COOKIE, NOVNC_TTL_SECONDS, SPIDER_HUB_DIR, allowed, issueNovncTicket } from "@/lib/server/manualLogin";

export const runtime = "nodejs";

const PLATFORMS = new Set(["facebook", "threads"]);
// Redis cho script: trên server KHÔNG đặt gì - script dùng REDIS_* trong .env của spider-hub như crawler (spider-hub
// load_dotenv không ghi đè biến đã có, nên truyền REDIS_PORT ở đây sẽ thắng .env - 27/10/2026 làm script nối nhầm một
// Redis trống). Trên Mac mặc định là cổng SSH tunnel 16379 tới Redis của server.
const REDIS_PORT = process.env.MANUAL_LOGIN_REDIS_PORT ?? (process.platform === "darwin" ? "16379" : "");
const DISPLAY = process.env.MANUAL_LOGIN_DISPLAY || process.env.DISPLAY || "";

/** Cùng quy tắc với scripts/manual_login.py: status_path() / _safe(). */
function statusFile(platform: string, accountKey: string): string {
  const safe = accountKey.toLowerCase().replace(/[^a-z0-9._@-]+/g, "_").slice(0, 120);
  return path.join(SPIDER_HUB_DIR, "logs", "manual_login", `${platform}_${safe}.json`);
}

function parse(platform: unknown, account: unknown): { platform: string; account: string } | null {
  if (typeof platform !== "string" || !PLATFORMS.has(platform)) return null;
  if (typeof account !== "string" || !/^[\w.@+-]{3,200}$/.test(account.trim())) return null;
  return { platform, account: account.trim().toLowerCase() };
}

export async function POST(req: NextRequest) {
  if (!(await allowed(req))) {
    return NextResponse.json(
      { error: "Không có quyền mở trình duyệt đăng nhập (API key không đúng, hoặc server chưa đặt API key)." },
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
        ...(REDIS_PORT ? { REDIS_HOST: "127.0.0.1", REDIS_PORT } : {}),
        ...(DISPLAY ? { DISPLAY } : {}),
        TELEGRAM_BOT_TOKEN: "",
        TELEGRAM_CHAT_ID: "",
      },
    },
  );
  child.unref();
  const res = NextResponse.json({ started: true, pid: child.pid });
  // Vé vào màn hình noVNC (/novnc) cho đúng trình duyệt vừa bấm nút - nginx kiểm tra qua /dash-api/novnc-auth.
  res.cookies.set(NOVNC_COOKIE, issueNovncTicket(), {
    httpOnly: true,
    secure: req.headers.get("x-forwarded-proto") === "https",
    sameSite: "strict",
    path: "/",
    maxAge: NOVNC_TTL_SECONDS,
  });
  return res;
}

export async function GET(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
