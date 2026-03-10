import { db } from "@/lib/db";
import { UsageSourceType, MembershipType, OrderStatus } from "@prisma/client";

// 会员状态类型
export interface MembershipStatus {
  hasAccess: boolean;
  membershipType: "MONTHLY" | "CREDIT" | "FREE";
  activeMembershipId: string | null;
  monthlyExpiresAt: Date | null;
  creditsRemaining: number | null;
  totalCredits: number | null;
}

// 消费结果类型
export interface ConsumeResult {
  success: boolean;
  alreadyConsumed: boolean;
  membershipUsed: "MONTHLY" | "CREDIT" | null;
  creditsRemaining?: number;
  error?: string;
}

// 检查访问权限结果
export interface AccessCheckResult {
  hasAccess: boolean;
  alreadyPaid: boolean;
  membershipStatus: MembershipStatus;
}

/**
 * 获取用户会员状态
 */
export async function getMembershipStatus(
  userId: string
): Promise<MembershipStatus> {
  const now = new Date();

  // 查找有效的月卡
  const activeMonthly = await db.membershipOrder.findFirst({
    where: {
      userId,
      type: MembershipType.MONTHLY,
      status: OrderStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" },
  });

  if (activeMonthly) {
    return {
      hasAccess: true,
      membershipType: "MONTHLY",
      activeMembershipId: activeMonthly.id,
      monthlyExpiresAt: activeMonthly.endDate,
      creditsRemaining: null,
      totalCredits: null,
    };
  }

  // 查找有效的次卡（有剩余次数）
  const activeCredit = await db.membershipOrder.findFirst({
    where: {
      userId,
      type: MembershipType.CREDIT,
      status: OrderStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
  });

  if (activeCredit && activeCredit.totalCredits !== null) {
    const remaining = activeCredit.totalCredits - activeCredit.usedCredits;
    if (remaining > 0) {
      return {
        hasAccess: true,
        membershipType: "CREDIT",
        activeMembershipId: activeCredit.id,
        monthlyExpiresAt: null,
        creditsRemaining: remaining,
        totalCredits: activeCredit.totalCredits,
      };
    }
  }

  // 计算所有次卡剩余总次数
  const allCredits = await db.membershipOrder.findMany({
    where: {
      userId,
      type: MembershipType.CREDIT,
      status: OrderStatus.ACTIVE,
    },
  });

  let totalRemaining = 0;
  let totalAll = 0;
  for (const credit of allCredits) {
    if (credit.totalCredits !== null) {
      totalRemaining += credit.totalCredits - credit.usedCredits;
      totalAll += credit.totalCredits;
    }
  }

  if (totalRemaining > 0) {
    return {
      hasAccess: true,
      membershipType: "CREDIT",
      activeMembershipId: allCredits[0]?.id || null,
      monthlyExpiresAt: null,
      creditsRemaining: totalRemaining,
      totalCredits: totalAll,
    };
  }

  // 无有效会员
  return {
    hasAccess: false,
    membershipType: "FREE",
    activeMembershipId: null,
    monthlyExpiresAt: null,
    creditsRemaining: 0,
    totalCredits: 0,
  };
}

/**
 * 检查是否可以访问 AI 报告
 */
export async function canAccessAIReport(userId: string): Promise<boolean> {
  const status = await getMembershipStatus(userId);
  return status.hasAccess;
}

/**
 * 检查某个资源是否已经付费
 */
export async function hasAlreadyPaid(
  sourceType: UsageSourceType,
  sourceId: string
): Promise<boolean> {
  const existing = await db.usageRecord.findUnique({
    where: {
      sourceType_sourceId: { sourceType, sourceId },
    },
  });
  return existing !== null;
}

/**
 * 检查访问权限（综合检查）
 */
export async function checkAccess(
  userId: string,
  sourceType: UsageSourceType,
  sourceId: string
): Promise<AccessCheckResult> {
  const alreadyPaid = await hasAlreadyPaid(sourceType, sourceId);
  const membershipStatus = await getMembershipStatus(userId);

  return {
    hasAccess: alreadyPaid || membershipStatus.hasAccess,
    alreadyPaid,
    membershipStatus,
  };
}

/**
 * 消费一次权益
 * 优先使用月卡，其次使用次卡
 */
export async function consumeCredit(
  userId: string,
  sourceType: UsageSourceType,
  sourceId: string,
  sourceTitle?: string
): Promise<ConsumeResult> {
  // 1. 检查是否已付费（防止重复扣费）
  const existingUsage = await db.usageRecord.findUnique({
    where: {
      sourceType_sourceId: { sourceType, sourceId },
    },
  });

  if (existingUsage) {
    return {
      success: true,
      alreadyConsumed: true,
      membershipUsed: null,
    };
  }

  const now = new Date();

  // 2. 尝试使用月卡（优先）
  const activeMonthlies = await db.membershipOrder.findMany({
    where: {
      userId,
      type: MembershipType.MONTHLY,
      status: OrderStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" }, // 先用快过期的
  });

  if (activeMonthlies.length > 0) {
    const monthly = activeMonthlies[0];
    await db.usageRecord.create({
      data: {
        userId,
        membershipId: monthly.id,
        sourceType,
        sourceId,
        sourceTitle,
      },
    });

    return {
      success: true,
      alreadyConsumed: false,
      membershipUsed: "MONTHLY",
    };
  }

  // 3. 尝试使用次卡
  const activeCredits = await db.membershipOrder.findMany({
    where: {
      userId,
      type: MembershipType.CREDIT,
      status: OrderStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" }, // FIFO
  });

  // 找到有剩余次数的次卡
  for (const credit of activeCredits) {
    if (
      credit.totalCredits !== null &&
      credit.usedCredits < credit.totalCredits
    ) {
      // 使用事务确保原子性
      const newUsedCredits = credit.usedCredits + 1;
      const isConsumed = newUsedCredits >= credit.totalCredits;

      await db.$transaction([
        db.usageRecord.create({
          data: {
            userId,
            membershipId: credit.id,
            sourceType,
            sourceId,
            sourceTitle,
          },
        }),
        db.membershipOrder.update({
          where: { id: credit.id },
          data: {
            usedCredits: newUsedCredits,
            status: isConsumed ? OrderStatus.CONSUMED : OrderStatus.ACTIVE,
          },
        }),
      ]);

      // 计算剩余总次数
      let totalRemaining = credit.totalCredits - newUsedCredits;
      for (const other of activeCredits) {
        if (
          other.id !== credit.id &&
          other.totalCredits !== null &&
          other.usedCredits < other.totalCredits
        ) {
          totalRemaining += other.totalCredits - other.usedCredits;
        }
      }

      return {
        success: true,
        alreadyConsumed: false,
        membershipUsed: "CREDIT",
        creditsRemaining: totalRemaining,
      };
    }
  }

  // 4. 无有效会员
  return {
    success: false,
    alreadyConsumed: false,
    membershipUsed: null,
    error: "NO_MEMBERSHIP",
  };
}

/**
 * 为用户开通会员（管理员使用）
 */
export async function grantMembership(params: {
  userId: string;
  type: MembershipType;
  credits?: number; // 次卡次数
  durationDays?: number; // 月卡天数
  note?: string;
  createdBy: string; // 管理员 ID
}): Promise<{ success: boolean; membership?: { id: string }; error?: string }> {
  const { userId, type, credits, durationDays, note, createdBy } = params;

  // 验证用户存在
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "USER_NOT_FOUND" };
  }

  const now = new Date();

  if (type === MembershipType.CREDIT) {
    if (!credits || credits <= 0) {
      return { success: false, error: "INVALID_CREDITS" };
    }

    const membership = await db.membershipOrder.create({
      data: {
        userId,
        type: MembershipType.CREDIT,
        totalCredits: credits,
        usedCredits: 0,
        status: OrderStatus.ACTIVE,
        note,
        createdBy,
      },
    });

    return { success: true, membership: { id: membership.id } };
  }

  if (type === MembershipType.MONTHLY) {
    if (!durationDays || durationDays <= 0) {
      return { success: false, error: "INVALID_DURATION" };
    }

    const startDate = now;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const membership = await db.membershipOrder.create({
      data: {
        userId,
        type: MembershipType.MONTHLY,
        startDate,
        endDate,
        status: OrderStatus.ACTIVE,
        note,
        createdBy,
      },
    });

    return { success: true, membership: { id: membership.id } };
  }

  return { success: false, error: "INVALID_TYPE" };
}

/**
 * 获取用户的会员订单列表
 */
export async function getUserMemberships(userId: string) {
  return db.membershipOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usageRecords: true },
      },
    },
  });
}

/**
 * 获取用户的消费记录
 */
export async function getUserUsageRecords(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    db.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        membership: {
          select: {
            type: true,
            totalCredits: true,
          },
        },
      },
    }),
    db.usageRecord.count({ where: { userId } }),
  ]);

  return {
    records,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 更新过期的月卡状态（可以定时运行）
 */
export async function updateExpiredMemberships(): Promise<number> {
  const now = new Date();

  const result = await db.membershipOrder.updateMany({
    where: {
      type: MembershipType.MONTHLY,
      status: OrderStatus.ACTIVE,
      endDate: { lt: now },
    },
    data: {
      status: OrderStatus.EXPIRED,
    },
  });

  return result.count;
}
