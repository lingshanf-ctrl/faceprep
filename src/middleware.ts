import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 管理员 token（从环境变量获取）
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "hellodata";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护 /api/admin 路径，/admin 页面由前端自己处理认证
  if (pathname.startsWith("/api/admin")) {
    const adminToken = request.headers.get("x-admin-token");

    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
