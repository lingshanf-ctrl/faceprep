import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 管理员 token（从环境变量获取）
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 /admin 路径
  if (pathname.startsWith("/admin")) {
    // 检查请求中是否有正确的 admin token
    // 可以从 header 或 cookie 中获取
    const adminToken = request.headers.get("x-admin-token") ||
                       request.cookies.get("admin-token")?.value;

    // 如果没有 token 或 token 不正确，返回 404
    // 让扫描者以为这个页面不存在
    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }

    // token 正确，允许访问
    return NextResponse.next();
  }

  // 保护 /api/admin 路径
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
