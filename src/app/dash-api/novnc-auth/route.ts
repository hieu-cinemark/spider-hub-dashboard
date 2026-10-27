// nginx auth_request cho /novnc/* (spider-hub deploy/login-display/spider-hub-locations.conf): 204 khi có vé hợp lệ
// (cookie do nút "Đăng nhập tay" cấp sau khi kiểm tra API key), 401 nếu không. nginx đánh dấu location này internal -
// từ ngoài không gọi thẳng được.
import { NextResponse, type NextRequest } from "next/server";
import { NOVNC_COOKIE, validNovncTicket } from "@/lib/server/manualLogin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return validNovncTicket(req.cookies.get(NOVNC_COOKIE)?.value)
    ? new NextResponse(null, { status: 204 })
    : new NextResponse(null, { status: 401 });
}
