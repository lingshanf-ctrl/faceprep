// 题目数据客户端 - 分页加载 + 缓存

import { useState, useEffect, useCallback } from "react";

export interface Question {
  id: string;
  title: string;
  category: string;
  type: string;
  difficulty: number;
  frequency: number;
  keyPoints: string;
}

export interface QuestionDetail extends Question {
  framework?: string;
  referenceAnswer: string;
  commonMistakes?: string;
  tips?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 内存缓存
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存键
function getCacheKey(endpoint: string, params: Record<string, string>) {
  return `${endpoint}?${new URLSearchParams(params).toString()}`;
}

// 通用 fetch 带缓存
async function fetchWithCache<T>(
  endpoint: string,
  params: Record<string, string> = {},
  options?: { skipCache?: boolean }
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);

  // 检查缓存
  if (!options?.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const query = new URLSearchParams(params).toString();
  const url = `${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const data = await response.json();

  // 更新缓存
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

// 获取题目列表
export async function getQuestions(params?: {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  difficulty?: number;
  search?: string;
  sortBy?: string;
  order?: string;
}): Promise<{ questions: Question[]; pagination: Pagination }> {
  const searchParams: Record<string, string> = {};
  if (params?.page) searchParams.page = params.page.toString();
  if (params?.limit) searchParams.limit = params.limit.toString();
  if (params?.category) searchParams.category = params.category;
  if (params?.type) searchParams.type = params.type;
  if (params?.difficulty) searchParams.difficulty = params.difficulty.toString();
  if (params?.search) searchParams.search = params.search;
  if (params?.sortBy) searchParams.sortBy = params.sortBy;
  if (params?.order) searchParams.order = params.order;

  return fetchWithCache("/api/questions", searchParams);
}

// 获取题目详情
export async function getQuestionDetail(id: string): Promise<QuestionDetail> {
  const data = await fetchWithCache<{ question: QuestionDetail }>(`/api/questions/${id}`);
  return data.question;
}

// React Hook: 使用题目列表
export function useQuestions(initialParams?: Parameters<typeof getQuestions>[0]) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (params?: Parameters<typeof getQuestions>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestions(params);
      setQuestions(data.questions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(initialParams);
  }, [fetchQuestions, initialParams]);

  return {
    questions,
    pagination,
    loading,
    error,
    refetch: fetchQuestions,
  };
}

// React Hook: 使用题目详情
export function useQuestionDetail(id?: string) {
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setQuestion(null);
      return;
    }

    let cancelled = false;

    async function load(questionId: string) {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuestionDetail(questionId);
        if (!cancelled) {
          setQuestion(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load(id);

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { question, loading, error };
}

// 预加载下一页
export function prefetchQuestions(params?: Parameters<typeof getQuestions>[0]) {
  return getQuestions(params);
}

// 清除缓存
export function clearQuestionsCache() {
  cache.clear();
}
