import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

// 获取客户端 IP
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (req as unknown as { ip?: string }).ip || "unknown";
}

// 获取匿名ID
function getAnonymousId(req: NextRequest): string | null {
  return req.headers.get("X-Anonymous-Id");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      );
    }

    // 检查频率限制（基于 IP）
    const ip = getClientIp(req);
    const rateLimitKey = `register:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message || "注册请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已注册" },
        { status: 409 }
      );
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
      },
    });

    // 迁移匿名用户数据（如果有）
    const anonymousId = getAnonymousId(req);
    const oldAnonymousId = req.headers.get("X-Anonymous-Id-Old");
    const idsToMigrate = [anonymousId, oldAnonymousId].filter(Boolean) as string[];

    for (const anonId of idsToMigrate) {
      try {
        const practicesBefore = await db.practice.count({ where: { userId: anonId } });
        const sessionsBefore = await db.interviewSession.count({ where: { userId: anonId } });

        if (practicesBefore > 0 || sessionsBefore > 0) {
          const updatedPractices = await db.practice.updateMany({
            where: { userId: anonId },
            data: { userId: user.id },
          });

          const updatedSessions = await db.interviewSession.updateMany({
            where: { userId: anonId },
            data: { userId: user.id },
          });

          console.log(`[Register Data Migration] Migrated ${updatedPractices.count} practices and ${updatedSessions.count} sessions from ${anonId} to ${user.id}`);
        }
      } catch (migrationError) {
        console.error("[Register Data Migration Error]", migrationError);
      }
    }

    // 创建会话
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    console.log(`[Register Success] ${email} from ${ip}`);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
