// API 客户端 - 封装后端调用，支持离线缓存和匿名用户

import { getAnonymousId } from "./anonymous-user";

const API_BASE = "/api";

// 检查网络状态
function isOnline() {
  return typeof navigator !== "undefined" && navigator.onLine;
}

// 获取请求头（包含匿名ID）
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 添加匿名ID头部（如果未登录）
  const anonymousId = getAnonymousId();
  if (anonymousId) {
    headers["X-Anonymous-Id"] = anonymousId;
  }

  return headers;
}

// 通用 fetch 封装
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; offline?: boolean; requireLogin?: boolean }> {
  // 离线时返回离线标记
  if (!isOnline()) {
    return { offline: true, error: "离线状态" };
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        ...getHeaders(),
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        error: error.error || `请求失败: ${response.status}`,
        requireLogin: error.requireLogin,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    return { error: "网络请求失败" };
  }
}

// 练习记录 API
export const practicesApi = {
  // 获取练习记录列表
  async getList(params?: { limit?: number; offset?: number; questionId?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    if (params?.questionId) query.set("questionId", params.questionId);

    return fetchApi<{
      practices: PracticeRecord[];
      total: number;
    }>(`/practices?${query.toString()}`);
  },

  // 创建练习记录
  async create(data: {
    questionId: string;
    questionTitle: string;
    answer: string;
    score?: number;
    feedback?: string;
    duration?: number;
    asyncEvaluate?: boolean;
  }) {
    return fetchApi<{ practice: PracticeRecord; asyncEvaluate?: boolean }>("/practices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 获取单个练习记录
  async getById(id: string) {
    return fetchApi<{ practice: PracticeRecord }>(`/practices/${id}`);
  },

  // 删除练习记录
  async delete(id: string) {
    return fetchApi(`/practices/${id}`, {
      method: "DELETE",
    });
  },
};

// 统计 API
export const statsApi = {
  // 获取统计数据
  async getStats() {
    return fetchApi<{
      totalPractices: number;
      averageScore: number;
      highestScore: number;
      recentTrend: number[];
      streak: number;
      categoryScores: { category: string; avgScore: number; count: number }[];
    }>("/stats");
  },
};

// 自定义题目 API
export const customQuestionsApi = {
  // 获取列表
  async getList(params?: { category?: string; type?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.type) query.set("type", params.type);

    return fetchApi<{ questions: CustomQuestion[] }>(
      `/custom-questions?${query.toString()}`
    );
  },

  // 创建
  async create(data: {
    title: string;
    category: string;
    type: string;
    difficulty?: number;
    keyPoints?: string;
    referenceAnswer?: string;
  }) {
    return fetchApi<{ question: CustomQuestion }>("/custom-questions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 批量创建
  async batchCreate(questions: Array<{
    title: string;
    category: string;
    type: string;
    difficulty?: number;
    keyPoints?: string;
    referenceAnswer?: string;
  }>) {
    return fetchApi<{ questions: CustomQuestion[] }>("/custom-questions", {
      method: "PUT",
      body: JSON.stringify({ questions }),
    });
  },
};

// 类型定义
export interface PracticeRecord {
  id: string;
  questionId: string;
  questionTitle: string;
  answer: string;
  score: number;
  feedback: {
    good: string[];
    improve: string[];
    suggestion: string;
    starAnswer?: string;
  };
  createdAt: string;
}

export interface CustomQuestion {
  id: string;
  title: string;
  category: string;
  type: string;
  difficulty: number;
  keyPoints?: string;
  referenceAnswer?: string;
  createdAt: string;
}
