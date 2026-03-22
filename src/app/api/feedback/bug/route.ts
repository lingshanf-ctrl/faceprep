import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`bug-report:${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "提交过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, content, pageUrl, userAgent } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "反馈内容不能为空" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "反馈内容不能超过500字" },
        { status: 400 }
      );
    }

    // 创建反馈记录
    const report = await db.bugReport.create({
      data: {
        type: type?.toUpperCase() || "BUG",
        content: content.trim(),
        pageUrl: pageUrl || "",
        userAgent: userAgent || "",
      },
    });

    return NextResponse.json({
      success: true,
      id: report.id,
      message: "反馈提交成功",
    });
  } catch (error) {
    console.error("提交反馈失败:", error);
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取反馈列表（仅管理员可用）
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = status ? { status } : {};

    const reports = await db.bugReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("获取反馈列表失败:", error);
    return NextResponse.json(
      { error: "获取失败" },
      { status: 500 }
    );
  }
}
