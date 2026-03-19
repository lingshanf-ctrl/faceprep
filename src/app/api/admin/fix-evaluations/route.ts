import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { EvaluationStatus } from "@prisma/client";
import { triggerPracticeEvaluation } from "@/lib/practice-evaluation";
import { processPendingEvaluations } from "@/lib/evaluation-service";

/**
 * GET /api/admin/fix-evaluations
 * 获取所有卡住的评估记录（PROCESSING 超过一定时间或 PENDING 过久的）
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stuckMinutes = parseInt(searchParams.get("stuckMinutes") || "5"); // 默认5分钟以上算卡住
    const includeFailed = searchParams.get("includeFailed") === "true";

    const cutoffTime = new Date(Date.now() - stuckMinutes * 60 * 1000);

    // 查询 AI Phase-2 失败的记录（COMPLETED 但 feedback 中含 aiUpgradeFailed=true）
    const aiUpgradeFailed = await db.practice.findMany({
      where: {
        evaluationStatus: EvaluationStatus.COMPLETED,
        feedback: { contains: '"aiUpgradeFailed":true' },
      },
      orderBy: { evaluationCompletedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
        question: { select: { id: true, title: true, category: true } },
      },
    });

    // 查询卡住的 PROCESSING 记录
    const stuckProcessing = await db.practice.findMany({
      where: {
        evaluationStatus: EvaluationStatus.PROCESSING,
        evaluationStartedAt: {
          lt: cutoffTime,
        },
      },
      orderBy: {
        evaluationStartedAt: "asc",
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        question: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    // 查询卡住的 PENDING 记录（可能已经卡住了但还没开始处理）
    const stuckPending = await db.practice.findMany({
      where: {
        evaluationStatus: EvaluationStatus.PENDING,
        createdAt: {
          lt: cutoffTime,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        question: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    // 可选：包含失败的记录
    let failedRecords: typeof stuckProcessing = [];
    if (includeFailed) {
      failedRecords = await db.practice.findMany({
        where: {
          evaluationStatus: EvaluationStatus.FAILED,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          question: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      });
    }


    // ── InterviewAnswer 卡住记录 ──
    const interviewUserSelect = {
      id: true,
      email: true,
      name: true,
    };

    const stuckInterviewProcessing = await db.interviewAnswer.findMany({
      where: {
        evaluationStatus: EvaluationStatus.PROCESSING,
        evaluationStartedAt: { lt: cutoffTime },
      },
      orderBy: { evaluationStartedAt: "asc" },
      take: 100,
      include: {
        session: {
          select: {
            id: true,
            userId: true,
            user: { select: interviewUserSelect },
          },
        },
      },
    });

    const stuckInterviewPending = await db.interviewAnswer.findMany({
      where: {
        evaluationStatus: EvaluationStatus.PENDING,
        startedAt: { lt: cutoffTime },
      },
      orderBy: { startedAt: "asc" },
      take: 100,
      include: {
        session: {
          select: {
            id: true,
            userId: true,
            user: { select: interviewUserSelect },
          },
        },
      },
    });

    let failedInterviewRecords: typeof stuckInterviewProcessing = [];
    if (includeFailed) {
      failedInterviewRecords = await db.interviewAnswer.findMany({
        where: { evaluationStatus: EvaluationStatus.FAILED },
        orderBy: { startedAt: "desc" },
        take: 50,
        include: {
          session: {
            select: {
              id: true,
              userId: true,
              user: { select: interviewUserSelect },
            },
          },
        },
      });
    }

    return NextResponse.json({
      summary: {
        stuckProcessing: stuckProcessing.length,
        stuckPending: stuckPending.length,
        failed: failedRecords.length,
        aiUpgradeFailed: aiUpgradeFailed.length,
        interviewProcessing: stuckInterviewProcessing.length,
        interviewPending: stuckInterviewPending.length,
        interviewFailed: failedInterviewRecords.length,
        stuckMinutes,
      },
      records: {
        aiUpgradeFailed: aiUpgradeFailed.map(p => ({
          id: p.id,
          userId: p.userId,
          userEmail: p.user?.email,
          userName: p.user?.name,
          questionId: p.questionId,
          questionTitle: p.question?.title,
          questionCategory: p.question?.category,
          evaluationStatus: p.evaluationStatus,
          evaluationModel: p.evaluationModel,
          evaluationCompletedAt: p.evaluationCompletedAt,
          createdAt: p.createdAt,
        })),
        processing: stuckProcessing.map(p => ({
          id: p.id,
          userId: p.userId,
          userEmail: p.user?.email,
          userName: p.user?.name,
          questionId: p.questionId,
          questionTitle: p.question?.title,
          questionCategory: p.question?.category,
          evaluationStatus: p.evaluationStatus,
          evaluationStartedAt: p.evaluationStartedAt,
          evaluationRetries: p.evaluationRetries,
          evaluationError: p.evaluationError,
          evaluationModel: p.evaluationModel,
          createdAt: p.createdAt,
          stuckForMinutes: p.evaluationStartedAt
            ? Math.round((Date.now() - new Date(p.evaluationStartedAt).getTime()) / 60000)
            : null,
        })),
        pending: stuckPending.map(p => ({
          id: p.id,
          userId: p.userId,
          userEmail: p.user?.email,
          userName: p.user?.name,
          questionId: p.questionId,
          questionTitle: p.question?.title,
          questionCategory: p.question?.category,
          evaluationStatus: p.evaluationStatus,
          evaluationModel: p.evaluationModel,
          createdAt: p.createdAt,
          pendingForMinutes: Math.round((Date.now() - new Date(p.createdAt).getTime()) / 60000),
        })),
        failed: failedRecords.map(p => ({
          id: p.id,
          userId: p.userId,
          userEmail: p.user?.email,
          userName: p.user?.name,
          questionId: p.questionId,
          questionTitle: p.question?.title,
          evaluationStatus: p.evaluationStatus,
          evaluationError: p.evaluationError,
          evaluationRetries: p.evaluationRetries,
          evaluationModel: p.evaluationModel,
          createdAt: p.createdAt,
        })),
        interviewProcessing: stuckInterviewProcessing.map(a => ({
          id: a.id,
          sessionId: a.sessionId,
          userId: a.session?.userId,
          userEmail: a.session?.user?.email,
          userName: a.session?.user?.name,
          questionTitle: a.questionTitle,
          questionCategory: a.questionType,
          evaluationStatus: a.evaluationStatus,
          evaluationStartedAt: a.evaluationStartedAt,
          evaluationRetries: a.evaluationRetries,
          evaluationError: a.evaluationError,
          evaluationModel: a.evaluationModel,
          createdAt: a.startedAt,
          stuckForMinutes: a.evaluationStartedAt
            ? Math.round((Date.now() - new Date(a.evaluationStartedAt).getTime()) / 60000)
            : null,
        })),
        interviewPending: stuckInterviewPending.map(a => ({
          id: a.id,
          sessionId: a.sessionId,
          userId: a.session?.userId,
          userEmail: a.session?.user?.email,
          userName: a.session?.user?.name,
          questionTitle: a.questionTitle,
          questionCategory: a.questionType,
          evaluationStatus: a.evaluationStatus,
          evaluationRetries: a.evaluationRetries,
          evaluationModel: a.evaluationModel,
          createdAt: a.startedAt,
          pendingForMinutes: Math.round((Date.now() - new Date(a.startedAt).getTime()) / 60000),
        })),
        interviewFailed: failedInterviewRecords.map(a => ({
          id: a.id,
          sessionId: a.sessionId,
          userId: a.session?.userId,
          userEmail: a.session?.user?.email,
          userName: a.session?.user?.name,
          questionTitle: a.questionTitle,
          questionCategory: a.questionType,
          evaluationStatus: a.evaluationStatus,
          evaluationError: a.evaluationError,
          evaluationRetries: a.evaluationRetries,
          evaluationModel: a.evaluationModel,
          createdAt: a.startedAt,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin Fix Evaluations GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch stuck evaluations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fix-evaluations
 * 批量修复或重置卡住的评估记录
 *
 * Body:
 *   - action: "reset" | "mark-failed" | "trigger-evaluate"
 *   - ids?: string[] - 指定ID列表，不传则自动修复所有卡住的记录
 *   - stuckMinutes?: number - 多少分钟算卡住，默认5分钟
 *   - force?: boolean - 是否强制处理，不管状态
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const {
      action = "reset", // reset, mark-failed, trigger-evaluate
      ids,
      stuckMinutes = 5,
      force = false,
      entityType = "practice", // "practice" | "interview"
    } = body;

    const cutoffTime = new Date(Date.now() - stuckMinutes * 60 * 1000);

    // ── 面试答案评估修复 ──
    if (entityType === "interview") {
      let interviewWhereClause: any;

      if (ids && ids.length > 0) {
        interviewWhereClause = {
          id: { in: ids },
          ...(force ? {} : {
            evaluationStatus: {
              in: [EvaluationStatus.PROCESSING, EvaluationStatus.PENDING, EvaluationStatus.FAILED],
            },
          }),
        };
      } else {
        interviewWhereClause = {
          OR: [
            { evaluationStatus: EvaluationStatus.PROCESSING, evaluationStartedAt: { lt: cutoffTime } },
            { evaluationStatus: EvaluationStatus.PENDING, startedAt: { lt: cutoffTime } },
          ],
        };
      }

      const interviewRecordsToFix = await db.interviewAnswer.findMany({
        where: interviewWhereClause,
        select: { id: true, sessionId: true, evaluationStatus: true, evaluationStartedAt: true, startedAt: true },
      });

      if (interviewRecordsToFix.length === 0) {
        return NextResponse.json({ success: true, message: "没有找到需要处理的面试答案记录", count: 0 });
      }

      const interviewIds = interviewRecordsToFix.map(r => r.id);
      let interviewResult;

      if (action === "mark-failed") {
        interviewResult = await db.interviewAnswer.updateMany({
          where: { id: { in: interviewIds } },
          data: { evaluationStatus: EvaluationStatus.FAILED, evaluationError: "管理员手动标记失败" },
        });
      } else {
        // reset / trigger-evaluate: 重置为 PENDING 然后触发重新评估
        interviewResult = await db.interviewAnswer.updateMany({
          where: { id: { in: interviewIds } },
          data: {
            evaluationStatus: EvaluationStatus.PENDING,
            evaluationRetries: 0,
            evaluationError: null,
            evaluationStartedAt: null,
            evaluationCompletedAt: null,
          },
        });
        // 按 sessionId 分组，触发每个会话的评估
        const sessionIds = [...new Set(interviewRecordsToFix.map(r => r.sessionId))];
        for (const sid of sessionIds) {
          processPendingEvaluations(sid).catch(err =>
            console.error(`[Admin Fix] Failed to process interview evaluations for session ${sid}:`, err)
          );
        }
      }

      return NextResponse.json({
        success: true,
        action,
        count: interviewResult.count,
        message: `成功处理 ${interviewResult.count} 条面试答案记录，操作: ${action}`,
      });
    }

    // ── 练习评估修复（原逻辑）──
    let whereClause: any;

    if (ids && ids.length > 0) {
      // 使用指定的ID列表 - 支持 PROCESSING, PENDING, FAILED, 以及 COMPLETED+aiUpgradeFailed 状态
      whereClause = {
        id: { in: ids },
        ...(force ? {} : {
          OR: [
            {
              evaluationStatus: {
                in: [EvaluationStatus.PROCESSING, EvaluationStatus.PENDING, EvaluationStatus.FAILED],
              },
            },
            {
              evaluationStatus: EvaluationStatus.COMPLETED,
              feedback: { contains: '"aiUpgradeFailed":true' },
            },
          ],
        }),
      };
    } else {
      // 自动查找卡住的记录（含 aiUpgradeFailed）
      whereClause = {
        OR: [
          {
            evaluationStatus: EvaluationStatus.PROCESSING,
            evaluationStartedAt: { lt: cutoffTime },
          },
          {
            evaluationStatus: EvaluationStatus.PENDING,
            createdAt: { lt: cutoffTime },
          },
          {
            evaluationStatus: EvaluationStatus.COMPLETED,
            feedback: { contains: '"aiUpgradeFailed":true' },
          },
        ],
      };
    }

    // 先查询要处理的记录
    const recordsToFix = await db.practice.findMany({
      where: whereClause,
      select: {
        id: true,
        evaluationStatus: true,
        evaluationStartedAt: true,
        createdAt: true,
      },
    });

    if (recordsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "没有找到需要处理的记录",
        count: 0,
      });
    }

    const recordIds = recordsToFix.map(r => r.id);
    let result;

    switch (action) {
      case "reset":
      case "trigger-evaluate":
        // 重置状态为 PENDING，然后立即在后台触发 AI 评估
        result = await db.practice.updateMany({
          where: {
            id: { in: recordIds },
          },
          data: {
            evaluationStatus: EvaluationStatus.PENDING,
            evaluationRetries: 0,
            evaluationError: null,
            evaluationStartedAt: null,
            evaluationCompletedAt: null,
          },
        });
        // 为每条记录触发后台评估（不等待完成）
        for (const id of recordIds) {
          triggerPracticeEvaluation(id).catch((err) =>
            console.error(`[Admin Fix] Failed to trigger evaluation for ${id}:`, err)
          );
        }
        break;

      case "mark-failed":
        // 标记为失败
        result = await db.practice.updateMany({
          where: {
            id: { in: recordIds },
          },
          data: {
            evaluationStatus: EvaluationStatus.FAILED,
            evaluationError: "管理员手动标记失败",
            evaluationCompletedAt: new Date(),
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unknown action. Use: reset, mark-failed, trigger-evaluate" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      count: result.count,
      recordIds,
      records: recordsToFix.map(r => ({
        id: r.id,
        previousStatus: r.evaluationStatus,
        stuckForMinutes: r.evaluationStartedAt
          ? Math.round((Date.now() - new Date(r.evaluationStartedAt).getTime()) / 60000)
          : Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000),
      })),
      message: `成功处理 ${result.count} 条记录，操作: ${action}`,
    });
  } catch (error) {
    console.error("[Admin Fix Evaluations POST Error]", error);
    return NextResponse.json(
      { error: "Failed to fix evaluations" },
      { status: 500 }
    );
  }
}
