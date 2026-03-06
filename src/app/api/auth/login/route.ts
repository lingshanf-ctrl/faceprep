import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

// 获取客户端 IP
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (req as unknown as { ip?: string }).ip || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    // 检查频率限制（基于 IP + 邮箱）
    const ip = getClientIp(req);
    const rateLimitKey = `login:${ip}:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message || "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    // 查找用户
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 登录成功，重置频率限制
    resetRateLimit(rateLimitKey);

    // 创建会话
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    console.log(`[Login Success] ${email} from ${ip}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
