/**
 * AI 智能题目生成器
 * 基于岗位 JD 和简历，通过 AI 生成针对性面试题目
 *
 * 保留规则引擎作为备选方案（见 src/lib/question-generator.ts）
 */

import { getAIProvider } from "./index";

export interface AIGenerateOptions {
  jdText: string;
  resumeText?: string;
  questionCount?: number;
}

export interface AIGeneratedQuestion {
  id: string;
  title: string;
  type: "INTRO" | "PROJECT" | "TECHNICAL" | "BEHAVIORAL" | "HR";
  keyPoints: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  reason?: string; // AI 生成这道题的原因
}

// AI 生成题目系统 Prompt
const QUESTION_GENERATOR_SYSTEM_PROMPT = `你是一位资深的面试专家和 HR 总监，拥有 15 年技术面试经验。

你的任务是根据岗位 JD 和候选人简历，生成针对性的面试题目。

生成原则：
1. 题目必须与岗位要求和候选人背景高度相关
2. 题目难度要匹配候选人经验水平
3. 题目要有区分度，能区分优秀和普通候选人
4. 题目要具体，避免泛泛而谈
5. 技术题要考察实际应用能力，不只是理论知识

题型分布建议：
- INTRO：自我介绍类（1题，简单）
- PROJECT：项目深挖类（2题，中等/困难）
- TECHNICAL：技术考察类（2-3题，覆盖核心技能）
- BEHAVIORAL：行为面试类（1题，考察软技能）
- HR：HR面试类（1题，动机匹配）`;

// AI 生成题目用户 Prompt
const QUESTION_GENERATOR_USER_PROMPT = `请基于以下岗位 JD 和候选人简历，生成 {questionCount} 道针对性的面试题目。

===== 岗位描述（JD）=====
{jdText}

===== 候选人简历 =====
{resumeText}

===== 生成要求 =====

请返回 JSON 数组格式，每道题包含以下字段：
{
  "id": "题目编号如 ai-1",
  "title": "题目内容，要具体、有针对性",
  "type": "题目类型：INTRO/PROJECT/TECHNICAL/BEHAVIORAL/HR",
  "keyPoints": "考察要点，面试官关注的重点",
  "category": "专业分类如 FRONTEND/BACKEND/PRODUCT 等",
  "difficulty": "难度：easy/medium/hard",
  "reason": "生成这道题的原因，结合 JD 或简历"
}

要求：
1. 题目要结合 JD 中的具体技能要求
2. 如果有简历，要针对简历中的项目经历和技术栈深挖
3. 技术题要考察实际应用，不只是概念
4. 行为题要针对候选人的背景定制
5. 总题数：{questionCount} 道

请直接返回 JSON 数组，不要包含其他内容。`;

/**
 * 使用 AI 生成面试题目
 */
export async function generateQuestionsWithAI(
  options: AIGenerateOptions
): Promise<AIGeneratedQuestion[]> {
  const { jdText, resumeText = "", questionCount = 5 } = options;

  const ai = getAIProvider();

  // 构建 Prompt
  const userPrompt = QUESTION_GENERATOR_USER_PROMPT
    .replace("{jdText}", jdText)
    .replace("{resumeText}", resumeText || "（无简历信息，请基于 JD 生成通用题目）")
    .replace(/{questionCount}/g, String(questionCount));

  try {
    const result = await ai.complete({
      messages: [
        { role: "system", content: QUESTION_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 解析 JSON 响应
    let jsonStr = result.content;

    // 尝试提取 JSON（处理可能的 markdown 代码块）
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // 清理可能的非 JSON 内容
    jsonStr = jsonStr.trim();
    if (jsonStr.startsWith("[") && jsonStr.endsWith("]")) {
      const questions: AIGeneratedQuestion[] = JSON.parse(jsonStr);

      // 验证并补充默认字段
      return questions.map((q, idx) => ({
        id: q.id || `ai-${idx + 1}`,
        title: q.title,
        type: q.type || "TECHNICAL",
        keyPoints: q.keyPoints || "基础知识、实际应用",
        category: q.category || "GENERAL",
        difficulty: q.difficulty || "medium",
        reason: q.reason,
      }));
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("AI 生成题目失败:", error);
    throw error;
  }
}

/**
 * 获取 AI 生成建议
 */
export async function getAIGenerationTips(
  jdText: string,
  resumeText?: string
): Promise<string[]> {
  const ai = getAIProvider();

  const prompt = `请基于以下岗位 JD 和简历，给候选人 3-5 条针对性的面试准备建议。

===== 岗位描述 =====
${jdText}

===== 候选人简历 =====
${resumeText || "（无简历）"}

请返回 JSON 数组格式：["建议1", "建议2", "建议3"]`;

  try {
    const result = await ai.complete({
      messages: [
        {
          role: "system",
          content:
            "你是一位面试辅导专家，擅长给候选人提供针对性的面试建议。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 800,
    });

    let jsonStr = result.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const tips = JSON.parse(jsonStr.trim());
    return Array.isArray(tips) ? tips.slice(0, 5) : [];
  } catch (error) {
    console.error("AI 生成建议失败:", error);
    return [];
  }
}

/**
 * 批量生成题目（带备用方案）
 * 如果 AI 生成失败，返回 null，由调用方决定是否使用规则引擎
 */
export async function generateQuestionsWithAIOrNull(
  options: AIGenerateOptions
): Promise<AIGeneratedQuestion[] | null> {
  try {
    // 设置 15 秒超时
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI generation timeout")), 15000)
    );

    const questionsPromise = generateQuestionsWithAI(options);

    return await Promise.race([questionsPromise, timeoutPromise]);
  } catch (error) {
    console.error("AI 生成失败，可降级到规则引擎:", error);
    return null;
  }
}
