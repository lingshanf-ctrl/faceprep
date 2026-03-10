import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateFeedbackWithFallback } from "@/lib/ai";
import { EvaluationStatus, UsageSourceType } from "@prisma/client";
import { consumeCredit } from "@/lib/membership-service";

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 最大重试次数
const MAX_RETRIES = 3;

/**
 * 检查用户会员状态，判断是否可以使用付费模型
 */
async function checkUserMembership(userId: string): Promise<{ userType: "free" | "paid"; reason?: string }> {
  try {
    // 查找用户有效的会员订单
    const memberships = await db.membershipOrder.findMany({
      where: {
        userId,
        status: "ACTIVE",
        OR: [
          // 月卡：在有效期内
          {
            type: "MONTHLY",
            endDate: { gt: new Date() },
          },
          // 次卡：还有剩余次数
          {
            type: "CREDIT",
            usedCredits: { lt: db.membershipOrder.fields.totalCredits },
          },
        ],
      },
    });

    if (memberships.length === 0) {
      return { userType: "free", reason: "no_active_membership" };
    }

    // 检查是否有月卡
    const monthlyMembership = memberships.find(m => m.type === "MONTHLY" && m.endDate && m.endDate > new Date());
    if (monthlyMembership) {
      return { userType: "paid", reason: "monthly_active" };
    }

    // 检查是否有次卡
    const creditsMembership = memberships.find(m =>
      m.type === "CREDIT" &&
      m.totalCredits &&
      m.usedCredits < m.totalCredits
    );
    if (creditsMembership) {
      return { userType: "paid", reason: "credits_available" };
    }

    return { userType: "free", reason: "membership_expired" };
  } catch (error) {
    console.error("[Membership Check] Error:", error);
    return { userType: "free", reason: "error" };
  }
}

/**
 * POST /api/practices/evaluate
 * 异步触发AI评估
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { practiceId } = await request.json();
    if (!practiceId) {
      return NextResponse.json(
        { error: "Practice ID is required" },
        { status: 400 }
      );
    }

    // 根据用户会员状态自动判断用户类型
    const { userType, reason } = await checkUserMembership(session.id);
    console.log(`[Evaluate] User ${session.id} membership check: ${userType} (${reason})`);

    // 获取练习记录
    const practice = await db.practice.findUnique({
      where: { id: practiceId },
      include: { question: true },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Practice not found" },
        { status: 404 }
      );
    }

    if (practice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 如果已经评估完成，直接返回
    if (practice.evaluationStatus === EvaluationStatus.COMPLETED) {
      return NextResponse.json({
        success: true,
        status: EvaluationStatus.COMPLETED,
        message: "Evaluation already completed",
      });
    }

    // 如果正在评估中，直接返回状态
    if (practice.evaluationStatus === EvaluationStatus.PROCESSING) {
      return NextResponse.json({
        success: true,
        status: EvaluationStatus.PROCESSING,
        message: "Evaluation in progress",
      });
    }

    // 更新状态为评估中
    await db.practice.update({
      where: { id: practiceId },
      data: {
        evaluationStatus: EvaluationStatus.PROCESSING,
        evaluationStartedAt: new Date(),
        evaluationError: null,
      },
    });

    // 异步执行评估（不等待完成）
    evaluateInBackground(practiceId, practice, session.id, userType).catch(console.error);

    return NextResponse.json({
      success: true,
      status: EvaluationStatus.PROCESSING,
      message: "Evaluation started",
      model: userType === "paid" ? "kimi-k2.5" : "qwen-turbo",
      depth: userType === "paid" ? "advanced" : "basic",
      userType,
      reason,
    });
  } catch (error) {
    console.error("Failed to start evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 后台执行AI评估
 */
async function evaluateInBackground(
  practiceId: string,
  practice: any,
  userId: string,
  userType: "free" | "paid" = "free"
) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // 准备题目元数据
      const metadata = {
        type: practice.questionType || practice.question?.type || "GENERAL",
        difficulty: practice.questionDifficulty || practice.question?.difficulty || 2,
        referenceAnswer: practice.question?.referenceAnswer || "",
        commonMistakes: practice.question?.commonMistakes || "",
        framework: practice.question?.framework || "",
        keyPoints: practice.question?.keyPoints || "",
      };

      // 根据用户类型选择模型深度
      const depth = userType === "paid" ? "advanced" : "basic";

      console.log(`[Evaluate] Practice ${practiceId} using ${depth} model for ${userType} user`);
      console.log(`[Evaluate] AI Config: provider=${depth === 'advanced' ? 'kimi' : 'qwen'}, model=${depth === 'advanced' ? 'kimi-k2.5' : 'qwen-turbo'}`);

      // 调用双模型反馈生成（带降级策略）
      const feedback = await generateFeedbackWithFallback(
        practice.answer,
        metadata,
        { depth, userType }
      );

      console.log(`[Evaluate] Feedback generated with model: ${feedback.evaluationModel}, depth: ${feedback.evaluationDepth}, targetUserType: ${feedback.targetUserType}`);

      // 如果实际使用的模型与预期不符，记录警告
      if (depth === 'advanced' && feedback.evaluationModel !== 'kimi') {
        console.warn(`[Evaluate] Model mismatch! Expected kimi for advanced depth, but got ${feedback.evaluationModel}. Fallback may have occurred.`);
      }

      // 更新练习记录
      await db.practice.update({
        where: { id: practiceId },
        data: {
          score: feedback.totalScore,
          feedback: JSON.stringify({
            totalScore: feedback.totalScore,
            dimensions: feedback.dimensions,
            gapAnalysis: feedback.gapAnalysis,
            improvements: feedback.improvements,
            optimizedAnswer: feedback.optimizedAnswer,
            coachMessage: feedback.coachMessage,
            // 兼容旧版字段
            good: feedback.good,
            improve: feedback.improve,
            suggestion: feedback.suggestion,
            starAnswer: feedback.starAnswer,
            // 双模型信息
            evaluationModel: feedback.evaluationModel,
            evaluationDepth: feedback.evaluationDepth,
          }),
          evaluationStatus: EvaluationStatus.COMPLETED,
          evaluationCompletedAt: new Date(),
          evaluationError: null,
          evaluationRetries: retries,
        },
      });

      console.log(`[Evaluate] Practice ${practiceId} completed with score ${feedback.totalScore}`);

      // 扣除次卡次数（如果是次卡用户）
      if (userType === "paid") {
        const consumeResult = await consumeCredit(
          userId,
          UsageSourceType.PRACTICE,
          practiceId,
          practice.question?.keyPoints || "练习题目"
        );
        console.log(`[Evaluate] Credit consumption result:`, consumeResult);
      }

      return;
    } catch (error) {
      retries++;
      console.error(`[Evaluate] Attempt ${retries} failed for practice ${practiceId}:`, error);

      if (retries >= MAX_RETRIES) {
        // 更新为失败状态
        await db.practice.update({
          where: { id: practiceId },
          data: {
            evaluationStatus: EvaluationStatus.FAILED,
            evaluationError: error instanceof Error ? error.message : "Unknown error",
            evaluationRetries: retries,
          },
        });
        return;
      }

      // 指数退避重试
      await delay(Math.pow(2, retries) * 1000);
    }
  }
}
