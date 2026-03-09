/**
 * 评估服务
 * 管理面试答案的 AI 评估任务，包括状态追踪、重试逻辑和错误处理
 */

import { db } from "@/lib/db";
import { generateFeedback, QuestionMetadata } from "@/lib/ai";

// 评估配置
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 指数退避延迟（毫秒）

// 评估任务类型
export interface EvaluationTask {
  answerId: string;
  sessionId: string;
  questionId: string;
  questionTitle: string;
  questionKeyPoints: string;
  answer: string;
  metadata: QuestionMetadata;
}

// 评估结果类型
export interface EvaluationResult {
  success: boolean;
  score?: number;
  feedback?: Record<string, unknown>;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
}

/**
 * 执行单个答案的评估
 */
export async function evaluateAnswer(task: EvaluationTask): Promise<EvaluationResult> {
  const { answerId, questionTitle, questionKeyPoints, answer, metadata } = task;

  try {
    // 更新状态为 PROCESSING
    await db.interviewAnswer.update({
      where: { id: answerId },
      data: {
        evaluationStatus: "PROCESSING",
        evaluationStartedAt: new Date(),
      },
    });

    // 调用 AI 生成深度反馈
    const feedback = await generateFeedback(
      questionTitle,
      questionKeyPoints || "",
      answer,
      metadata
    );

    // 构建简化反馈格式
    const simpleFeedback = {
      score: feedback.totalScore,
      good: [
        ...(feedback.dimensions.content.missing.length === 0 ? ["内容完整，覆盖考察要点"] : []),
        ...(feedback.dimensions.structure.score >= 70 ? ["结构清晰，逻辑连贯"] : []),
        ...(feedback.dimensions.expression.score >= 70 ? ["表达专业，用词准确"] : []),
        ...(feedback.dimensions.highlights.score >= 70 ? ["回答有亮点，展现个人特色"] : []),
        ...feedback.dimensions.highlights.strongPoints.slice(0, 2),
      ],
      improve: [
        ...(feedback.dimensions.content.missing.length > 0
          ? [`内容可补充：${feedback.dimensions.content.missing.join("、")}`]
          : []),
        ...(feedback.dimensions.structure.issues.length > 0
          ? [`结构优化：${feedback.dimensions.structure.issues[0]}`]
          : []),
        ...(feedback.dimensions.expression.suggestions.length > 0
          ? [`表达改进：${feedback.dimensions.expression.suggestions[0]}`]
          : []),
      ],
      suggestion: feedback.coachMessage || feedback.dimensions.content.feedback,
      dimensions: feedback.dimensions,
      improvements: feedback.improvements,
      optimizedAnswer: feedback.optimizedAnswer,
    };

    // 确保至少有一些反馈
    if (simpleFeedback.improve.length === 0) {
      simpleFeedback.improve.push("继续保持，可以尝试加入更多具体数据支撑");
    }
    if (simpleFeedback.good.length === 0) {
      simpleFeedback.good.push("回答基本完整，表达清晰");
    }

    // 更新答案记录
    await db.interviewAnswer.update({
      where: { id: answerId },
      data: {
        score: feedback.totalScore,
        feedback: JSON.stringify(simpleFeedback),
        evaluationStatus: "COMPLETED",
        evaluationCompletedAt: new Date(),
        evaluationError: null,
      },
    });

    return {
      success: true,
      score: feedback.totalScore,
      feedback: simpleFeedback,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    const errorCode = extractErrorCode(errorMessage);
    const retryable = isRetryableError(errorCode);

    console.error(`评估失败 [${answerId}]:`, errorMessage);

    // 获取当前重试次数
    const currentAnswer = await db.interviewAnswer.findUnique({
      where: { id: answerId },
      select: { evaluationRetries: true },
    });

    const retries = (currentAnswer?.evaluationRetries || 0) + 1;

    if (retryable && retries <= MAX_RETRIES) {
      // 标记为 PENDING 等待重试
      await db.interviewAnswer.update({
        where: { id: answerId },
        data: {
          evaluationStatus: "PENDING",
          evaluationRetries: retries,
          evaluationError: `重试 ${retries}/${MAX_RETRIES}: ${errorMessage}`,
        },
      });

      return {
        success: false,
        error: errorMessage,
        errorCode,
        retryable: true,
      };
    } else {
      // 标记为 FAILED
      await db.interviewAnswer.update({
        where: { id: answerId },
        data: {
          evaluationStatus: "FAILED",
          evaluationRetries: retries,
          evaluationError: retryable
            ? `重试次数已达上限: ${errorMessage}`
            : errorMessage,
        },
      });

      return {
        success: false,
        error: errorMessage,
        errorCode,
        retryable: false,
      };
    }
  }
}

/**
 * 从错误消息中提取错误代码
 */
function extractErrorCode(message: string): string {
  if (message.includes("RATE_LIMIT")) return "RATE_LIMIT";
  if (message.includes("TIMEOUT")) return "TIMEOUT";
  if (message.includes("INVALID_API_KEY")) return "INVALID_API_KEY";
  if (message.includes("INSUFFICIENT_BALANCE")) return "INSUFFICIENT_BALANCE";
  if (message.includes("NETWORK_ERROR")) return "NETWORK_ERROR";
  if (message.includes("PARSE_ERROR")) return "PARSE_ERROR";
  return "UNKNOWN";
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(errorCode: string): boolean {
  return ["RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR", "PARSE_ERROR", "UNKNOWN"].includes(
    errorCode
  );
}

/**
 * 获取重试延迟时间
 */
export function getRetryDelay(retryCount: number): number {
  return RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
}

/**
 * 批量处理待评估的答案
 * 用于报告页检测到 PENDING 状态时触发
 */
export async function processPendingEvaluations(
  sessionId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ completed: number; failed: number }> {
  // 获取所有待评估的答案
  const pendingAnswers = await db.interviewAnswer.findMany({
    where: {
      sessionId,
      evaluationStatus: "PENDING",
      answer: { not: "（跳过）" },
    },
    orderBy: { orderIndex: "asc" },
  });

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < pendingAnswers.length; i++) {
    const answer = pendingAnswers[i];

    // 构建评估任务
    const task: EvaluationTask = {
      answerId: answer.id,
      sessionId: answer.sessionId,
      questionId: answer.questionId,
      questionTitle: answer.questionTitle,
      questionKeyPoints: answer.questionKeyPoints || "",
      answer: answer.answer || "",
      metadata: {
        type: answer.questionType || "GENERAL",
        difficulty: parseDifficulty(answer.questionDifficulty),
      },
    };

    // 执行评估
    const result = await evaluateAnswer(task);

    if (result.success) {
      completed++;
    } else if (!result.retryable) {
      failed++;
    }

    // 通知进度
    onProgress?.(i + 1, pendingAnswers.length);

    // 500ms 间隔避免限流
    if (i < pendingAnswers.length - 1) {
      await delay(500);
    }
  }

  return { completed, failed };
}

/**
 * 解析难度字符串为数字
 */
function parseDifficulty(difficulty: string | null): number {
  if (!difficulty) return 2;
  if (difficulty === "easy" || difficulty === "1") return 1;
  if (difficulty === "hard" || difficulty === "3") return 3;
  return 2;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 检测并重置超时的评估任务
 * 用于定期清理卡在 PROCESSING 状态的任务
 */
export async function resetStaleEvaluations(
  staleThresholdMs: number = 5 * 60 * 1000 // 默认 5 分钟
): Promise<number> {
  const staleThreshold = new Date(Date.now() - staleThresholdMs);

  const result = await db.interviewAnswer.updateMany({
    where: {
      evaluationStatus: "PROCESSING",
      evaluationStartedAt: { lt: staleThreshold },
    },
    data: {
      evaluationStatus: "PENDING",
      evaluationError: "评估超时，已重新加入队列",
    },
  });

  return result.count;
}
