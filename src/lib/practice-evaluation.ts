/**
 * Practice 评估服务
 * 提取自 /api/practices/evaluate/route.ts，允许从管理员工具直接触发评估
 */

import { db } from "@/lib/db";
import { generateFeedbackWithFallback } from "@/lib/ai";
import { EvaluationStatus, UsageSourceType } from "@prisma/client";
import { consumeCredit } from "@/lib/membership-service";

const MAX_RETRIES = 3;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 检查用户会员状态，判断是否可以使用付费模型
 */
export async function checkPracticeUserMembership(
  userId: string
): Promise<{ userType: "free" | "paid"; reason?: string }> {
  try {
    const memberships = await db.membershipOrder.findMany({
      where: {
        userId,
        status: "ACTIVE",
        OR: [
          {
            type: "MONTHLY",
            endDate: { gt: new Date() },
          },
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

    const monthlyMembership = memberships.find(
      (m) => m.type === "MONTHLY" && m.endDate && m.endDate > new Date()
    );
    if (monthlyMembership) {
      return { userType: "paid", reason: "monthly_active" };
    }

    const creditsMembership = memberships.find(
      (m) =>
        m.type === "CREDIT" && m.totalCredits && m.usedCredits < m.totalCredits
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
 * 后台执行 AI 评估（带重试）
 */
async function runEvaluationWithRetry(
  practiceId: string,
  practice: any,
  userId: string,
  userType: "free" | "paid"
) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const metadata = {
        type: practice.questionType || practice.question?.type || "GENERAL",
        difficulty:
          practice.questionDifficulty || practice.question?.difficulty || 2,
        referenceAnswer: practice.question?.referenceAnswer || "",
        commonMistakes: practice.question?.commonMistakes || "",
        framework: practice.question?.framework || "",
        keyPoints: practice.question?.keyPoints || "",
      };

      const depth = userType === "paid" ? "advanced" : "basic";

      console.log(
        `[Evaluate] Practice ${practiceId} using ${depth} model for ${userType} user`
      );

      const feedback = await generateFeedbackWithFallback(
        practice.answer,
        metadata,
        { depth, userType }
      );

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
            good: feedback.good,
            improve: feedback.improve,
            suggestion: feedback.suggestion,
            starAnswer: feedback.starAnswer,
            evaluationModel: feedback.evaluationModel,
            evaluationDepth: feedback.evaluationDepth,
          }),
          evaluationStatus: EvaluationStatus.COMPLETED,
          evaluationCompletedAt: new Date(),
          evaluationError: null,
          evaluationRetries: retries,
          evaluationModel: feedback.evaluationModel,
        },
      });

      console.log(
        `[Evaluate] Practice ${practiceId} completed with score ${feedback.totalScore}`
      );

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
      console.error(
        `[Evaluate] Attempt ${retries} failed for practice ${practiceId}:`,
        error
      );

      if (retries >= MAX_RETRIES) {
        await db.practice.update({
          where: { id: practiceId },
          data: {
            evaluationStatus: EvaluationStatus.FAILED,
            evaluationError:
              error instanceof Error ? error.message : "Unknown error",
            evaluationRetries: retries,
          },
        });
        return;
      }

      await delay(Math.pow(2, retries) * 1000);
    }
  }
}

/**
 * 触发单条 Practice 的后台评估
 * 会自动设置状态为 PROCESSING 并在后台运行评估
 */
export async function triggerPracticeEvaluation(
  practiceId: string
): Promise<void> {
  const practice = await db.practice.findUnique({
    where: { id: practiceId },
    include: { question: true },
  });

  if (!practice) {
    console.error(`[Evaluate] Practice ${practiceId} not found`);
    return;
  }

  const { userType } = await checkPracticeUserMembership(practice.userId);

  await db.practice.update({
    where: { id: practiceId },
    data: {
      evaluationStatus: EvaluationStatus.PROCESSING,
      evaluationStartedAt: new Date(),
      evaluationError: null,
      evaluationRetries: 0,
    },
  });

  runEvaluationWithRetry(practiceId, practice, practice.userId, userType).catch(
    (err) => console.error(`[Evaluate] Background evaluation error for ${practiceId}:`, err)
  );
}
