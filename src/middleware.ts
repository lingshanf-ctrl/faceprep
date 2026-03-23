import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/admin 鉴权由各路由的 verifyAdmin()（session cookie）统一处理，middleware 不再拦截

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
