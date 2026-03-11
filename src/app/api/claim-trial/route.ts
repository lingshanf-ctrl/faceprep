import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MembershipType } from "@prisma/client";

// 简单的速率限制（内存存储，重启后清空）
// 生产环境建议使用 Redis
const ipClaimAttempts = new Map<string, { count: number; lastAttempt: number }>();
const emailClaimAttempts = new Map<string, { count: number; lastAttempt: number }>();

// 清理过期的速率限制记录（10分钟前的）
function cleanupRateLimits() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  for (const [ip, data] of ipClaimAttempts.entries()) {
    if (now - data.lastAttempt > TEN_MINUTES) {
      ipClaimAttempts.delete(ip);
    }
  }

  for (const [email, data] of emailClaimAttempts.entries()) {
    if (now - data.lastAttempt > TEN_MINUTES) {
      emailClaimAttempts.delete(email);
    }
  }
}

// 检查速率限制
function checkRateLimit(
  store: Map<string, { count: number; lastAttempt: number }>,
  key: string,
  maxAttempts: number = 5
): boolean {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;

  const data = store.get(key);

  if (!data) {
    store.set(key, { count: 1, lastAttempt: now });
    return true;
  }

  // 如果超过5分钟，重置计数
  if (now - data.lastAttempt > FIVE_MINUTES) {
    store.set(key, { count: 1, lastAttempt: now });
    return true;
  }

  // 检查是否超过最大尝试次数
  if (data.count >= maxAttempts) {
    return false;
  }

  data.count++;
  data.lastAttempt = now;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 清理过期记录
    cleanupRateLimits();

    const body = await req.json();
    const { email } = body;

    // 1. 验证邮箱格式
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. IP 速率限制
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ipClaimAttempts, clientIp, 10)) {
      return NextResponse.json(
        { error: "操作过于频繁，请 5 分钟后再试" },
        { status: 429 }
      );
    }

    // 3. 邮箱速率限制
    if (!checkRateLimit(emailClaimAttempts, normalizedEmail, 3)) {
      return NextResponse.json(
        { error: "该邮箱尝试次数过多，请 5 分钟后再试" },
        { status: 429 }
      );
    }

    // 4. 查找用户
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // 为了安全，不暴露用户是否存在
      // 但体验卡需要先有账户，所以提示用户注册
      return NextResponse.json(
        {
          error:
            "该邮箱未注册，请先注册账户",
          needRegister: true,
        },
        { status: 404 }
      );
    }

    // 5. 检查是否已领取过体验卡
    const existingClaim = await db.trialClaim.findUnique({
      where: { userId: user.id },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          error: "您已领取过体验卡，每人限领一次",
          alreadyClaimed: true,
          claimedAt: existingClaim.claimedAt,
        },
        { status: 400 }
      );
    }

    // 6. 检查是否已有有效会员（防止薅羊毛）
    const activeMembership = await db.membershipOrder.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [
          { type: "MONTHLY", endDate: { gt: new Date() } },
          { type: "CREDIT", totalCredits: { gt: 0 } },
        ],
      },
    });

    if (activeMembership) {
      return NextResponse.json(
        {
          error: "您已有有效会员，体验卡仅限新用户",
          hasActiveMembership: true,
        },
        { status: 400 }
      );
    }

    // 7. 创建领取记录（先创建，防止并发重复领取）
    const userAgent = req.headers.get("user-agent") || "";

    await db.trialClaim.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        credits: 3,
        claimedIp: clientIp,
        userAgent: userAgent.slice(0, 200), // 限制长度
        source: "direct_link",
      },
    });

    // 8. 发放体验卡（3次次卡）
    await db.membershipOrder.create({
      data: {
        userId: user.id,
        type: MembershipType.CREDIT,
        status: "ACTIVE",
        totalCredits: 3,
        usedCredits: 0,
        note: "体验卡领取",
        createdBy: "trial_claim",
      },
    });

    // 9. 返回成功
    return NextResponse.json({
      success: true,
      message: "体验卡领取成功！您已获得 3 次 AI 深度评估机会",
      credits: 3,
    });
  } catch (error) {
    console.error("[Claim Trial Error]", error);

    // 检查是否是唯一约束错误（并发领取）
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "您已领取过体验卡，每人限领一次" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "领取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取领取状态（可选）
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "缺少邮箱参数" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        trialClaims: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        canClaim: false,
        reason: "user_not_found",
      });
    }

    const hasClaimed = user.trialClaims.length > 0;

    return NextResponse.json({
      canClaim: !hasClaimed,
      claimed: hasClaimed,
      claimedAt: hasClaimed ? user.trialClaims[0].claimedAt : null,
    });
  } catch (error) {
    console.error("[Check Trial Status Error]", error);
    return NextResponse.json(
      { error: "查询失败" },
      { status: 500 }
    );
  }
}
