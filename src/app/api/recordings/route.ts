import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 上传录音记录
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      questionId,
      audioUrl,
      duration,
      transcript,
      answerId,
    } = body;

    // 这里实际项目中应该：
    // 1. 将音频文件上传到云存储（如 AWS S3、阿里云 OSS）
    // 2. 调用语音识别 API（如百度语音、科大讯飞）转文字
    // 3. 保存记录到数据库

    // 示例：更新 InterviewAnswer 记录
    if (answerId) {
      const updated = await db.interviewAnswer.update({
        where: { id: answerId },
        data: {
          // audioUrl, // 需要添加字段到 schema
          // duration,
        },
      });

      return NextResponse.json({ answer: updated });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save recording:", error);
    return NextResponse.json(
      { error: "Failed to save recording" },
      { status: 500 }
    );
  }
}
