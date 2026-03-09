import { NextRequest, NextResponse } from "next/server";
import { getAIProvider, AIError } from "@/lib/ai";
import { InterviewSession } from "@/lib/interview-store";

// 面试整体评价请求体
interface OverallEvaluateRequest {
  session: InterviewSession;
}

// AI整体评价结果
export interface OverallEvaluation {
  // 综合评价
  overallFeedback: string;
  // 能力雷达图分析
  dimensionAnalysis: {
    technical: { score: number; analysis: string };
    project: { score: number; analysis: string };
    behavioral: { score: number; analysis: string };
    communication: { score: number; analysis: string };
  };
  // 核心优势（3-5条）
  strengths: string[];
  // 关键改进点（3-5条）
  improvements: string[];
  // 后续学习路径
  nextSteps: string[];
  // 岗位匹配度
  jobMatch: {
    score: number;
    analysis: string;
  };
  // 教练总结
  coachSummary: string;
}

// 整体评价系统 Prompt
const OVERALL_SYSTEM_PROMPT = `你是一位拥有15年经验的顶级面试教练和HR总监，曾为谷歌、阿里、字节等顶级公司面试过数千名候选人。

你的分析风格：
1. 洞察本质：不只看分数，更看候选人的思维方式和成长潜力
2. 系统性思考：将多道题的表现联系起来，看出候选人的整体画像
3. 具体可执行：每条建议都有明确的行动步骤
4. 鼓励为主：即使表现一般，也要指出闪光点和发展空间

你的分析基于：
- 岗位JD要求和候选人背景的匹配度
- 多道题之间的回答一致性（是否有欺骗或夸大）
- 不同题型展现的能力互补性
- 临场发挥的稳定性和应变能力`;

// 用户 Prompt 模板
const OVERALL_USER_PROMPT = `请作为资深面试教练，对以下完整面试进行系统性分析和评价。

===== 面试基本信息 =====
【岗位】{position}
【公司】{company}
【面试题目数量】{questionCount}道

===== 岗位JD =====
{jdText}

===== 候选人简历（如有） =====
{resumeText}

===== 每道题的详细表现 =====
{answersDetail}

===== 各维度平均分 =====
技术能力：{technicalScore}
项目经验：{projectScore}
行为面试：{behavioralScore}
沟通表达：{communicationScore}
总分：{overallScore}

===== 分析任务 =====

## 1. 综合评价（200字以内）
结合JD要求和候选人整体表现，给出一段综合评语。包括：
- 候选人的核心特质画像（如"技术扎实但表达需加强的实干型"）
- 与目标岗位的匹配程度
- 如果这是真实面试，通过概率估计

## 2. 各维度深度分析
对每个维度，给出：
- 基于具体题目的分析（不是简单重复分数）
- 这个维度展现的核心能力
- 提升这个维度的针对性建议

## 3. 核心优势（3-5条，每条20字以内）
从所有回答中提炼出最突出的能力点，用具体表现支撑。

## 4. 关键改进点（3-5条，每条30字以内）
按优先级排序，给出最关键的改进方向。

## 5. 后续学习路径（4-6条）
接下来1-4周的具体练习计划，从最重要到次重要排序。

## 6. 岗位匹配度
- 分数（0-100）：与JD要求的匹配程度
- 分析：为什么给出这个分数，具体哪些方面匹配/不匹配

## 7. 教练总结（100字以内）
一句走心的总结，既肯定努力，又指明方向。

===== 输出格式 =====
严格按照以下JSON格式返回，不要包含其他内容：

{
  "overallFeedback": "综合评价",
  "dimensionAnalysis": {
    "technical": { "score": 整数, "analysis": "分析" },
    "project": { "score": 整数, "analysis": "分析" },
    "behavioral": { "score": 整数, "analysis": "分析" },
    "communication": { "score": 整数, "analysis": "分析" }
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进1", "改进2", "改进3"],
  "nextSteps": ["步骤1", "步骤2", "步骤3", "步骤4"],
  "jobMatch": { "score": 整数, "analysis": "匹配度分析" },
  "coachSummary": "教练总结"
}`;

function formatAnswersForPrompt(session: InterviewSession): string {
  return session.answers.map((answer, idx) => {
    const question = session.questions.find(q => q.id === answer.questionId);
    if (!question) return "";

    const dims = answer.feedback.dimensions;
    const dimensionsStr = dims
      ? `  - 内容完整性：${dims.content.score}分\n` +
        `  - 结构逻辑性：${dims.structure.score}分\n` +
        `  - 表达专业性：${dims.expression.score}分\n` +
        `  - 差异化亮点：${dims.highlights.score}分`
      : "  - 综合评分：" + answer.score + "分";

    return `【第${idx + 1}题】${question.title}
题型：${question.type} | 难度：${question.difficulty}
得分：${answer.score}分
四维评分：
${dimensionsStr}
回答内容：
${answer.answer.slice(0, 500)}${answer.answer.length > 500 ? "..." : ""}
AI评价：${answer.feedback.suggestion}
亮点：${answer.feedback.good.join("、") || "无"}
待改进：${answer.feedback.improve.join("、") || "无"}
---`;
  }).filter(Boolean).join("\n\n");
}

// 生成AI整体评价
async function generateOverallEvaluation(
  session: InterviewSession,
  provider?: string
): Promise<OverallEvaluation> {
  const ai = getAIProvider(provider);

  const answersDetail = formatAnswersForPrompt(session);

  const prompt = OVERALL_USER_PROMPT
    .replace("{position}", session.jobInfo.position || "未指定")
    .replace("{company}", session.jobInfo.company || "未指定")
    .replace("{questionCount}", String(session.questions.length))
    .replace("{jdText}", session.jdText.slice(0, 1000))
    .replace("{resumeText}", session.resumeText?.slice(0, 500) || "未提供")
    .replace("{answersDetail}", answersDetail)
    .replace("{technicalScore}", String(session.dimensionScores.technical))
    .replace("{projectScore}", String(session.dimensionScores.project))
    .replace("{behavioralScore}", String(session.dimensionScores.behavioral))
    .replace("{communicationScore}", String(session.dimensionScores.communication))
    .replace("{overallScore}", String(session.overallScore));

  const result = await ai.complete({
    messages: [
      { role: "system", content: OVERALL_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 4000,
  });

  // 解析 JSON 响应
  let jsonStr = result.content;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());

  return {
    overallFeedback: parsed.overallFeedback || "",
    dimensionAnalysis: {
      technical: {
        score: Math.min(100, Math.max(0, Number(parsed.dimensionAnalysis?.technical?.score) || session.dimensionScores.technical)),
        analysis: parsed.dimensionAnalysis?.technical?.analysis || "",
      },
      project: {
        score: Math.min(100, Math.max(0, Number(parsed.dimensionAnalysis?.project?.score) || session.dimensionScores.project)),
        analysis: parsed.dimensionAnalysis?.project?.analysis || "",
      },
      behavioral: {
        score: Math.min(100, Math.max(0, Number(parsed.dimensionAnalysis?.behavioral?.score) || session.dimensionScores.behavioral)),
        analysis: parsed.dimensionAnalysis?.behavioral?.analysis || "",
      },
      communication: {
        score: Math.min(100, Math.max(0, Number(parsed.dimensionAnalysis?.communication?.score) || session.dimensionScores.communication)),
        analysis: parsed.dimensionAnalysis?.communication?.analysis || "",
      },
    },
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 6) : [],
    jobMatch: {
      score: Math.min(100, Math.max(0, Number(parsed.jobMatch?.score) || session.overallScore)),
      analysis: parsed.jobMatch?.analysis || "",
    },
    coachSummary: parsed.coachSummary || "",
  };
}

// POST /api/interview/overall-evaluate
export async function POST(request: NextRequest) {
  try {
    const body: OverallEvaluateRequest = await request.json();
    const { session } = body;

    if (!session || !session.answers || session.answers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: session with answers" },
        { status: 400 }
      );
    }

    // 调用 AI 生成整体评价
    const evaluation = await generateOverallEvaluation(session);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Overall evaluation error:", error);

    if (error instanceof AIError) {
      let errorMessage = "AI 服务暂时不可用";
      let statusCode = 500;

      switch (error.code) {
        case "RATE_LIMIT":
          errorMessage = "AI 服务繁忙，请稍后重试";
          statusCode = 429;
          break;
        case "INVALID_API_KEY":
        case "INSUFFICIENT_BALANCE":
          errorMessage = "AI 服务配置错误，请联系管理员";
          statusCode = 503;
          break;
        case "TIMEOUT":
          errorMessage = "AI 响应超时，请稍后重试";
          statusCode = 504;
          break;
        case "NETWORK_ERROR":
          errorMessage = "网络连接失败，请检查网络";
          statusCode = 503;
          break;
      }

      return NextResponse.json(
        { error: errorMessage, code: error.code },
        { status: statusCode }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 响应解析失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "评价生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
