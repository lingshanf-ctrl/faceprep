import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID
async function getUserId(request: NextRequest): Promise<{ userId: string; isAnonymous: boolean }> {
  const session = await getSession();
  if (session?.id) {
    return { userId: session.id, isAnonymous: false };
  }
  const anonymousId = getAnonymousId(request);
  if (anonymousId) {
    return { userId: anonymousId, isAnonymous: true };
  }
  return { userId: "", isAnonymous: true };
}

// 解析 JSON 字段
function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

// 格式化面试会话为前端期望的格式
function formatSession(session: any) {
  return {
    id: session.id,
    title: session.title,
    jdText: session.jdText || "",
    resumeText: session.resumeText || "",
    jobInfo: {
      company: session.jobCompany || undefined,
      position: session.jobPosition || undefined,
      level: session.jobLevel || undefined,
    },
    questions: parseJsonField(session.questions, []),
    status: session.status === "IN_PROGRESS" ? "in_progress" : session.status.toLowerCase(),
    createdAt: session.createdAt.toISOString(),
    completedAt: session.completedAt?.toISOString() || undefined,
    answers: session.answers?.map((a: any) => ({
      questionId: a.questionId,
      answer: a.answer || "",
      score: a.score || 0,
      feedback: parseJsonField(a.feedback, { good: [], improve: [], suggestion: "" }),
      duration: a.duration || 0,
      startedAt: a.startedAt?.toISOString() || "",
      completedAt: a.completedAt?.toISOString() || "",
    })) || [],
    overallScore: session.overallScore || 0,
    dimensionScores: parseJsonField(session.dimensionScores, {
      technical: 0,
      behavioral: 0,
      project: 0,
      communication: 0,
    }),
    overallFeedback: session.overallFeedback || "",
    strengths: parseJsonField(session.strengths, []),
    improvements: parseJsonField(session.improvements, []),
    nextSteps: parseJsonField(session.nextSteps, []),
    aiEvaluation: parseJsonField(session.aiEvaluation, null),
  };
}

// 获取用户的面试会话列表
export async function GET(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, in_progress, completed
    const limit = parseInt(searchParams.get("limit") || "50");

    const sessions = await db.interviewSession.findMany({
      where: {
        userId,
        ...(status && { status: status.toUpperCase() as any }),
      },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formattedSessions = sessions.map(formatSession);

    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json({ sessions: formattedSessions, isAnonymous }, { headers });
  } catch (error) {
    console.error("Failed to fetch interview sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview sessions" },
      { status: 500 }
    );
  }
}

// 创建面试会话
export async function POST(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, jdText, resumeText, jobInfo, questions } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // 匿名用户限制
    if (isAnonymous) {
      const count = await db.interviewSession.count({ where: { userId } });
      if (count >= 5) {
        return NextResponse.json(
          {
            error: "匿名用户最多保存5个面试会话，请登录以继续",
            requireLogin: true,
          },
          { status: 403 }
        );
      }
    }

    const session = await db.interviewSession.create({
      data: {
        userId,
        title,
        jdText: jdText || null,
        resumeText: resumeText || null,
        jobCompany: jobInfo?.company || null,
        jobPosition: jobInfo?.position || null,
        jobLevel: jobInfo?.level || null,
        questions: questions ? JSON.stringify(questions) : null,
        status: "PENDING",
        overallScore: 0,
        dimensionScores: JSON.stringify({
          technical: 0,
          behavioral: 0,
          project: 0,
          communication: 0,
        }),
      },
      include: {
        answers: true,
      },
    });

    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json(
      { session: formatSession(session), isAnonymous },
      { headers, status: 201 }
    );
  } catch (error) {
    console.error("Failed to create interview session:", error);
    return NextResponse.json(
      { error: "Failed to create interview session" },
      { status: 500 }
    );
  }
}
