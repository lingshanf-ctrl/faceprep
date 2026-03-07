import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID
async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getSession();
  if (session?.id) {
    return session.id;
  }
  return getAnonymousId(request);
}

// 盲点分析 API
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 获取用户的所有练习记录
    const practices = await db.practice.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            category: true,
            type: true,
            difficulty: true,
          },
        },
      },
    });

    if (practices.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: "暂无练习数据，开始练习以生成盲点分析",
      });
    }

    // 1. 按题型统计
    const typeStats: Record<string, { count: number; totalScore: number; avgScore: number }> = {};
    const categoryStats: Record<string, { count: number; totalScore: number; avgScore: number }> = {};
    const difficultyStats: Record<number, { count: number; totalScore: number; avgScore: number }> = {};

    // 2. 多维度评分统计（如果有）
    const dimensionStats = {
      content: { count: 0, totalScore: 0 },
      structure: { count: 0, totalScore: 0 },
      expression: { count: 0, totalScore: 0 },
      highlights: { count: 0, totalScore: 0 },
    };

    // 3. 常见失分点统计
    const weakPoints: Record<string, { count: number; examples: string[] }> = {};

    practices.forEach((p) => {
      const score = p.score ?? 0;
      const type = p.question?.type || "UNKNOWN";
      const category = p.question?.category || "GENERAL";
      const difficulty = p.question?.difficulty ?? 2;

      // 题型统计
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      typeStats[type].count++;
      typeStats[type].totalScore += score;

      // 分类统计
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].totalScore += score;

      // 难度统计
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      difficultyStats[difficulty].count++;
      difficultyStats[difficulty].totalScore += score;

      // 解析 feedback 获取多维度评分
      if (p.feedback) {
        try {
          const feedback = JSON.parse(p.feedback);
          if (feedback.dimensions) {
            const { content, structure, expression, highlights } = feedback.dimensions;
            if (content?.score) {
              dimensionStats.content.count++;
              dimensionStats.content.totalScore += content.score;
            }
            if (structure?.score) {
              dimensionStats.structure.count++;
              dimensionStats.structure.totalScore += structure.score;
            }
            if (expression?.score) {
              dimensionStats.expression.count++;
              dimensionStats.expression.totalScore += expression.score;
            }
            if (highlights?.score) {
              dimensionStats.highlights.count++;
              dimensionStats.highlights.totalScore += highlights.score;
            }
          }

          // 收集不足点
          if (feedback.improvements) {
            feedback.improvements.forEach((imp: { action: string; priority: string }) => {
              const key = imp.action.slice(0, 30); // 截取前30字符作为key
              if (!weakPoints[key]) {
                weakPoints[key] = { count: 0, examples: [] };
              }
              weakPoints[key].count++;
              if (weakPoints[key].examples.length < 3) {
                weakPoints[key].examples.push(imp.action);
              }
            });
          }
        } catch {
          // 解析失败忽略
        }
      }
    });

    // 计算平均分
    Object.keys(typeStats).forEach((key) => {
      const stat = typeStats[key];
      stat.avgScore = Math.round(stat.totalScore / stat.count);
    });

    Object.keys(categoryStats).forEach((key) => {
      const stat = categoryStats[key];
      stat.avgScore = Math.round(stat.totalScore / stat.count);
    });

    Object.keys(difficultyStats).forEach((key) => {
      const stat = difficultyStats[Number(key)];
      stat.avgScore = Math.round(stat.totalScore / stat.count);
    });

    // 计算维度平均分
    const dimensionAvgs = {
      content: dimensionStats.content.count > 0
        ? Math.round(dimensionStats.content.totalScore / dimensionStats.content.count)
        : 0,
      structure: dimensionStats.structure.count > 0
        ? Math.round(dimensionStats.structure.totalScore / dimensionStats.structure.count)
        : 0,
      expression: dimensionStats.expression.count > 0
        ? Math.round(dimensionStats.expression.totalScore / dimensionStats.expression.count)
        : 0,
      highlights: dimensionStats.highlights.count > 0
        ? Math.round(dimensionStats.highlights.totalScore / dimensionStats.highlights.count)
        : 0,
    };

    // 找出薄弱环节（按平均分排序，取最低的）
    const sortedTypes = Object.entries(typeStats)
      .filter(([_, stat]) => stat.count >= 2) // 至少练习2次才算
      .sort((a, b) => a[1].avgScore - b[1].avgScore);

    const sortedCategories = Object.entries(categoryStats)
      .filter(([_, stat]) => stat.count >= 2)
      .sort((a, b) => a[1].avgScore - b[1].avgScore);

    const sortedDimensions = Object.entries(dimensionAvgs)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => a[1] - b[1]);

    // 找出最常见的失分点
    const topWeakPoints = Object.entries(weakPoints)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([_, data]) => data.examples[0]);

    // 生成建议
    const suggestions: string[] = [];

    if (sortedTypes.length > 0 && sortedTypes[0][1].avgScore < 70) {
      const typeMap: Record<string, string> = {
        INTRO: "自我介绍",
        PROJECT: "项目经历",
        TECHNICAL: "技术问题",
        BEHAVIORAL: "行为面试",
        HR: "HR问题",
      };
      suggestions.push(`加强${typeMap[sortedTypes[0][0]] || sortedTypes[0][0]}类题目的练习，当前平均${sortedTypes[0][1].avgScore}分`);
    }

    if (sortedCategories.length > 0 && sortedCategories[0][1].avgScore < 70) {
      suggestions.push(`在${sortedCategories[0][0]}领域需要更多练习，建议针对性复习相关知识点`);
    }

    if (sortedDimensions.length > 0 && sortedDimensions[0][1] < 70) {
      const dimensionMap: Record<string, string> = {
        content: "内容完整性",
        structure: "结构逻辑性",
        expression: "表达专业性",
        highlights: "差异化亮点",
      };
      suggestions.push(`重点提升${dimensionMap[sortedDimensions[0][0]]}，这是你的主要失分点`);
    }

    // 如果练习次数不足，给出提示
    if (practices.length < 5) {
      suggestions.push(`继续练习！当前仅${practices.length}次记录，更多数据将提供更精准的分析`);
    }

    return NextResponse.json({
      hasData: true,
      overview: {
        totalPractices: practices.length,
        overallAvgScore: Math.round(practices.reduce((sum, p) => sum + (p.score ?? 0), 0) / practices.length),
      },
      weakAreas: {
        type: sortedTypes.slice(0, 3).map(([type, stat]) => ({ type, ...stat })),
        category: sortedCategories.slice(0, 3).map(([category, stat]) => ({ category, ...stat })),
        dimension: sortedDimensions.slice(0, 2).map(([dimension, score]) => ({ dimension, score })),
      },
      dimensionScores: dimensionAvgs,
      difficultyDistribution: difficultyStats,
      topWeakPoints,
      suggestions,
    });
  } catch (error) {
    console.error("Failed to analyze blind spots:", error);
    return NextResponse.json(
      { error: "Failed to analyze blind spots" },
      { status: 500 }
    );
  }
}
