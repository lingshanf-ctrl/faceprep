import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 /api/admin API 路由（token 验证）
  if (pathname.startsWith("/api/admin")) {
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 503 }
      );
    }

    const requestToken = request.headers.get("x-admin-token");
    if (!requestToken || requestToken !== adminToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 保护 /admin 页面路由（未登录重定向到首页）
  // 完整的管理员身份验证在页面组件中通过 verifyAdmin() 完成
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("session-token");
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};
