// Dùng chung cho các route "Đăng nhập tay" (src/app/dash-api/*): kiểm tra API key của dashboard với cinemark-api, và
// vé vào màn hình noVNC (/novnc) - cookie ký HMAC, nginx hỏi /dash-api/novnc-auth trước mỗi request vào /novnc
// (spider-hub deploy/login-display/spider-hub-locations.conf). Thay Basic Auth của nginx từ 27/10/2026: dashboard đã có
// đăng nhập bằng key.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";

export const SPIDER_HUB_DIR = process.env.SPIDER_HUB_DIR || path.resolve(process.cwd(), "..", "spider-hub");
const API_BASE = process.env.MANUAL_LOGIN_API_BASE || "http://127.0.0.1:8000";
const ALLOW_REMOTE = process.env.MANUAL_LOGIN_ALLOW_REMOTE === "1";
export const NOVNC_COOKIE = "spider_novnc";
export const NOVNC_TTL_SECONDS = 25 * 60;

function isLocal(req: NextRequest): boolean {
  const host = (req.headers.get("host") || "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

const keyCache = new Map<string, number>(); // key -> hết hạn (ms), để không hỏi cinemark-api mỗi lần poll

/** Request được phép dùng đăng nhập tay: từ localhost (dashboard trên Mac), hoặc mang API key ĐÚNG của dashboard khi
 * chạy trên server (MANUAL_LOGIN_ALLOW_REMOTE=1). cinemark-api chưa đặt API_AUTH_KEY thì từ xa luôn bị từ chối - không
 * có key thì không có gì chặn người lạ mở trình duyệt đăng nhập Facebook. */
export async function allowed(req: NextRequest): Promise<boolean> {
  if (isLocal(req)) return true;
  if (!ALLOW_REMOTE) return false;
  const key = req.headers.get("x-api-key") || "";
  if (!key) return false;
  const cached = keyCache.get(key);
  if (cached && cached > Date.now()) return true;
  try {
    const res = await fetch(`${API_BASE}/auth/check`, { headers: { "X-API-Key": key }, cache: "no-store" });
    const body = (await res.json()) as { auth_required?: boolean; valid?: boolean };
    if (res.ok && body.auth_required && body.valid) {
      keyCache.set(key, Date.now() + 60_000);
      return true;
    }
  } catch {
    // cinemark-api không trả lời -> không cho qua
  }
  return false;
}

function secret(): Buffer {
  const dir = path.join(SPIDER_HUB_DIR, "logs", "manual_login");
  const file = path.join(dir, ".novnc_secret");
  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  return Buffer.from(readFileSync(file, "utf-8").trim(), "hex");
}

function sign(expires: number): string {
  return createHmac("sha256", secret()).update(String(expires)).digest("hex");
}

/** Vé vào /novnc, hết hạn sau NOVNC_TTL_SECONDS (đủ một phiên đăng nhập tay 15 phút). */
export function issueNovncTicket(): string {
  const expires = Math.floor(Date.now() / 1000) + NOVNC_TTL_SECONDS;
  return `${expires}.${sign(expires)}`;
}

export function validNovncTicket(ticket: string | undefined): boolean {
  const [exp, sig] = (ticket || "").split(".");
  const expires = Number(exp);
  if (!sig || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(expires), "hex");
  const given = Buffer.from(sig, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
