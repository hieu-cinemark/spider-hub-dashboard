// "Đăng nhập tay" (27/10/2026): chạy spider-hub `scripts/manual_login.py` NGAY TRÊN MÁY đang chạy dashboard (cần màn
// hình - Mac của người vận hành), mở Chromium có cửa sổ qua proxy đã ghim của tài khoản. Script nối Redis của server
// crawl qua SSH tunnel (MANUAL_LOGIN_REDIS_PORT, mặc định 16379) để tôn trọng "mỗi IP một tài khoản" và lưu phiên thẳng
// cho crawler - xem docstring của script. Chỉ nhận request từ localhost: route này khởi chạy tiến trình trên máy.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const PLATFORMS = new Set(["facebook", "threads"]);
const SPIDER_HUB_DIR = process.env.SPIDER_HUB_DIR || path.resolve(process.cwd(), "..", "spider-hub");
const REDIS_PORT = process.env.MANUAL_LOGIN_REDIS_PORT || "16379";

/** Cùng quy tắc với scripts/manual_login.py: status_path() / _safe(). */
function statusFile(platform: string, accountKey: string): string {
  const safe = accountKey.toLowerCase().replace(/[^a-z0-9._@-]+/g, "_").slice(0, 120);
  return path.join(SPIDER_HUB_DIR, "logs", "manual_login", `${platform}_${safe}.json`);
}

function isLocal(req: NextRequest): boolean {
  const host = (req.headers.get("host") || "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function parse(platform: unknown, account: unknown): { platform: string; account: string } | null {
  if (typeof platform !== "string" || !PLATFORMS.has(platform)) return null;
  if (typeof account !== "string" || !/^[\w.@+-]{3,200}$/.test(account.trim())) return null;
  return { platform, account: account.trim().toLowerCase() };
}

export async function POST(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Chỉ mở được khi dashboard chạy trên chính máy này (localhost)." }, { status: 403 });
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
      env: { ...process.env, REDIS_HOST: "127.0.0.1", REDIS_PORT, TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" },
    },
  );
  child.unref();
  return NextResponse.json({ started: true, pid: child.pid });
}

export async function GET(req: NextRequest) {
  if (!isLocal(req)) return NextResponse.json({ error: "localhost only" }, { status: 403 });
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
