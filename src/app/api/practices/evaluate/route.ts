import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateFeedbackWithFallback } from "@/lib/ai";
import { EvaluationStatus, UsageSourceType } from "@prisma/client";
import { consumeCredit } from "@/lib/membership-service";
import { checkPracticeUserMembership } from "@/lib/practice-evaluation";
import { generateRuleBasedFeedback } from "@/lib/rule-engine-feedback";

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// AI 最大重试次数（超时不重试，降低等待时间）
const MAX_RETRIES = 2;

const checkUserMembership = checkPracticeUserMembership;

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

    const { practiceId, forceReEvaluate } = await request.json();
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

    // 如果已经评估完成且不强制重新评估，直接返回
    if (practice.evaluationStatus === EvaluationStatus.COMPLETED && !forceReEvaluate) {
      return NextResponse.json({
        success: true,
        status: EvaluationStatus.COMPLETED,
        message: "Evaluation already completed",
      });
    }

    // 如果正在评估中，检查是否卡住（超过5分钟）
    const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5分钟
    if (practice.evaluationStatus === EvaluationStatus.PROCESSING) {
      const isStuck = practice.evaluationStartedAt &&
        Date.now() - new Date(practice.evaluationStartedAt).getTime() > STUCK_THRESHOLD_MS;

      if (!isStuck) {
        return NextResponse.json({
          success: true,
          status: EvaluationStatus.PROCESSING,
          message: "Evaluation in progress",
        });
      }

      // 卡住的记录继续执行，重新评估
      console.log(`[Evaluate] Practice ${practiceId} was stuck in PROCESSING, restarting evaluation`);
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
      model: userType === "paid" ? "deepseek-chat" : "qwen-turbo",
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
 * 构建反馈 JSON 存储对象
 */
function buildFeedbackJson(feedback: Awaited<ReturnType<typeof generateFeedbackWithFallback>>) {
  return JSON.stringify({
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
  });
}

/**
 * 后台执行AI评估（两阶段）
 *
 * 阶段一：立即用规则引擎生成基础反馈（< 100ms），保存到 DB 让用户立即看到结果
 * 阶段二：异步调用 AI 生成深度分析，完成后静默升级 DB 中的反馈
 */
async function evaluateInBackground(
  practiceId: string,
  practice: any,
  userId: string,
  userType: "free" | "paid" = "free"
) {
  const metadata = {
    type: practice.questionType || practice.question?.type || "GENERAL",
    difficulty: practice.questionDifficulty || practice.question?.difficulty || 2,
    referenceAnswer: practice.question?.referenceAnswer || "",
    commonMistakes: practice.question?.commonMistakes || "",
    framework: practice.question?.framework || "",
    keyPoints: practice.question?.keyPoints || "",
  };

  const depth = userType === "paid" ? "advanced" : "basic";

  // ── 阶段一：规则引擎立即出结果 ──────────────────────────────────────
  // 无论用户类型，先用规则引擎生成快速基础反馈，让用户 <1s 内看到结果
  try {
    const quick = generateRuleBasedFeedback(practice.answer, {
      keyPoints: metadata.keyPoints,
      type: metadata.type,
    });
    await db.practice.update({
      where: { id: practiceId },
      data: {
        score: quick.basicScore,
        feedback: JSON.stringify({
          totalScore: quick.basicScore,
          good: quick.richGoodPoints,
          improve: quick.richImprovePoints,
          suggestion: quick.topSuggestion,
          coachMessage: quick.coachMessage,
          evaluationModel: "rule-engine",
          evaluationDepth: "basic",
          aiUpgrading: true, // 标记 AI 深度分析仍在进行
        }),
        evaluationStatus: EvaluationStatus.COMPLETED,
        evaluationCompletedAt: new Date(),
        evaluationModel: "rule-engine",
        evaluationError: null,
      },
    });
    console.log(`[Evaluate] Phase-1 done for ${practiceId}: rule-engine result saved, score=${quick.basicScore}`);
  } catch (e) {
    console.error(`[Evaluate] Phase-1 rule engine failed for ${practiceId}:`, e);
    // 规则引擎失败不阻断流程，继续 AI 分析
  }

  // ── 阶段二：AI 深度分析，完成后升级结果 ───────────────────────────────
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[Evaluate] Phase-2 start: depth=${depth}, userType=${userType}, attempt=${retries + 1}`);

      const feedback = await generateFeedbackWithFallback(practice.answer, metadata, { depth, userType });

      console.log(`[Evaluate] Phase-2 AI done: model=${feedback.evaluationModel}, score=${feedback.totalScore}`);

      await db.practice.update({
        where: { id: practiceId },
        data: {
          score: feedback.totalScore,
          feedback: buildFeedbackJson(feedback),
          evaluationStatus: EvaluationStatus.COMPLETED,
          evaluationCompletedAt: new Date(),
          evaluationError: null,
          evaluationRetries: retries,
          evaluationModel: feedback.evaluationModel,
        },
      });

      // 扣除次卡次数（仅付费用户）
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
      console.error(`[Evaluate] Phase-2 attempt ${retries} failed for ${practiceId}:`, error);

      if (retries >= MAX_RETRIES) {
        // AI 全部失败：规则引擎结果保留，清除 aiUpgrading 标记
        // 付费用户不扣费（AI 未成功）
        try {
          const current = await db.practice.findUnique({
            where: { id: practiceId },
            select: { feedback: true },
          });
          if (current?.feedback) {
            const parsed = JSON.parse(current.feedback);
            if (parsed.aiUpgrading) {
              parsed.aiUpgrading = false;
              parsed.aiUpgradeFailed = true;
              await db.practice.update({
                where: { id: practiceId },
                data: { feedback: JSON.stringify(parsed) },
              });
            }
          }
        } catch {
          // 忽略清理失败
        }
        console.error(`[Evaluate] Phase-2 all retries exhausted for ${practiceId}, keeping rule-engine result`);
        return;
      }

      // 指数退避
      await delay(Math.pow(2, retries) * 1000);
    }
  }
}
