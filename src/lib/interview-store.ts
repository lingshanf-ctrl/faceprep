// 面试会话存储 - 使用数据库 API 持久化

// AI 整体评价结果
export interface AIOverallEvaluation {
  overallFeedback: string;
  dimensionAnalysis: {
    technical: { score: number; analysis: string };
    project: { score: number; analysis: string };
    behavioral: { score: number; analysis: string };
    communication: { score: number; analysis: string };
  };
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  jobMatch: {
    score: number;
    analysis: string;
  };
  coachSummary: string;
  generatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  title: string;
  type: 'INTRO' | 'PROJECT' | 'TECHNICAL' | 'BEHAVIORAL' | 'HR';
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string;
  order: number;
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  score: number;
  feedback: {
    good: string[];
    improve: string[];
    suggestion: string;
    dimensions?: {
      content: { score: number; feedback: string; missing: string[] };
      structure: { score: number; feedback: string; issues: string[] };
      expression: { score: number; feedback: string; suggestions: string[] };
      highlights: { score: number; feedback: string; strongPoints: string[] };
    };
    improvements?: Array<{
      priority: "high" | "medium" | "low";
      action: string;
      expectedGain: string;
    }>;
    optimizedAnswer?: string;
  };
  duration: number;
  startedAt: string;
  completedAt: string;
}

export interface DimensionScores {
  technical: number;
  behavioral: number;
  project: number;
  communication: number;
}

export interface InterviewSession {
  id: string;
  title: string;
  jdText: string;
  resumeText?: string;
  jobInfo: {
    company?: string;
    position?: string;
    level?: 'junior' | 'mid' | 'senior';
  };
  questions: InterviewQuestion[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  answers: InterviewAnswer[];
  overallScore: number;
  dimensionScores: DimensionScores;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  aiEvaluation?: AIOverallEvaluation;
}

// 获取匿名ID
function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('anonymous-id');
  if (!id) {
    id = 'anon-' + crypto.randomUUID();
    localStorage.setItem('anonymous-id', id);
  }
  return id;
}

// API 请求帮助函数
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Anonymous-Id': getAnonymousId(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// 内存缓存
let sessionsCache: InterviewSession[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5秒缓存

// 清除缓存
function clearCache() {
  sessionsCache = null;
  cacheTimestamp = 0;
}

// 获取所有面试会话
export async function getInterviewSessionsAsync(): Promise<InterviewSession[]> {
  if (typeof window === 'undefined') return [];

  // 使用缓存
  if (sessionsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return sessionsCache;
  }

  try {
    const data = await apiRequest<{ sessions: InterviewSession[] }>('/api/interview/sessions');
    sessionsCache = data.sessions || [];
    cacheTimestamp = Date.now();
    return sessionsCache;
  } catch (error) {
    console.error('Failed to fetch interview sessions:', error);
    return [];
  }
}

// 同步版本（用于兼容现有代码，返回缓存数据）
export function getInterviewSessions(): InterviewSession[] {
  if (typeof window === 'undefined') return [];

  // 触发异步加载
  getInterviewSessionsAsync().catch(console.error);

  // 返回缓存数据
  return sessionsCache || [];
}

// 创建面试会话
export async function createInterviewSessionAsync(
  title: string,
  jdText: string,
  resumeText: string | undefined,
  questions: InterviewQuestion[],
  jobInfo: InterviewSession['jobInfo']
): Promise<InterviewSession> {
  clearCache();

  const data = await apiRequest<{ session: InterviewSession }>('/api/interview/sessions', {
    method: 'POST',
    body: JSON.stringify({
      title,
      jdText,
      resumeText,
      questions: questions.map((q, idx) => ({ ...q, order: idx })),
      jobInfo,
    }),
  });

  return data.session;
}

// 同步版本（用于兼容，实际上是异步的）
export function createInterviewSession(
  title: string,
  jdText: string,
  resumeText: string | undefined,
  questions: InterviewQuestion[],
  jobInfo: InterviewSession['jobInfo']
): InterviewSession {
  const tempSession: InterviewSession = {
    id: 'temp-' + crypto.randomUUID(),
    title,
    jdText,
    resumeText,
    jobInfo,
    questions: questions.map((q, idx) => ({ ...q, order: idx })),
    status: 'pending',
    createdAt: new Date().toISOString(),
    answers: [],
    overallScore: 0,
    dimensionScores: { technical: 0, behavioral: 0, project: 0, communication: 0 },
    overallFeedback: '',
    strengths: [],
    improvements: [],
    nextSteps: [],
  };

  // 异步创建真实会话
  createInterviewSessionAsync(title, jdText, resumeText, questions, jobInfo)
    .then(session => {
      // 更新缓存中的临时会话为真实会话
      if (sessionsCache) {
        const idx = sessionsCache.findIndex(s => s.id === tempSession.id);
        if (idx >= 0) {
          sessionsCache[idx] = session;
        } else {
          sessionsCache.unshift(session);
        }
      }
    })
    .catch(console.error);

  // 先添加到缓存
  if (sessionsCache) {
    sessionsCache.unshift(tempSession);
  }

  return tempSession;
}

// 获取单个面试会话
export async function getInterviewSessionAsync(id: string): Promise<InterviewSession | undefined> {
  if (typeof window === 'undefined') return undefined;

  try {
    const data = await apiRequest<{ session: InterviewSession }>(`/api/interview/sessions/${id}`);
    return data.session;
  } catch (error) {
    console.error('Failed to fetch interview session:', error);
    return undefined;
  }
}

// 同步版本
export function getInterviewSession(id: string): InterviewSession | undefined {
  // 先从缓存查找
  if (sessionsCache) {
    const cached = sessionsCache.find(s => s.id === id);
    if (cached) return cached;
  }
  return undefined;
}

// 开始面试
export async function startInterviewAsync(id: string): Promise<InterviewSession | undefined> {
  try {
    const data = await apiRequest<{ session: InterviewSession }>(`/api/interview/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    clearCache();
    return data.session;
  } catch (error) {
    console.error('Failed to start interview:', error);
    return undefined;
  }
}

export function startInterview(id: string): InterviewSession | undefined {
  startInterviewAsync(id).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === id);
    if (session && session.status === 'pending') {
      session.status = 'in_progress';
      return session;
    }
  }
  return undefined;
}

// 提交答案
export async function submitAnswerAsync(
  sessionId: string,
  answer: InterviewAnswer
): Promise<InterviewSession | undefined> {
  try {
    // 使用新的 API 路径，避免 Next.js 路由冲突
    await apiRequest(`/api/interview/answers?sessionId=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({
        questionId: answer.questionId,
        answer: answer.answer,
        score: answer.score,
        feedback: answer.feedback,
        duration: answer.duration,
        startedAt: answer.startedAt,
        completedAt: answer.completedAt,
      }),
    });
    clearCache();
    return await getInterviewSessionAsync(sessionId);
  } catch (error) {
    console.error('Failed to submit answer:', error);
    return undefined;
  }
}

export function submitAnswer(
  sessionId: string,
  answer: InterviewAnswer
): InterviewSession | undefined {
  submitAnswerAsync(sessionId, answer).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === sessionId);
    if (session) {
      session.answers.push(answer);
      return session;
    }
  }
  return undefined;
}

// 计算维度得分
function calculateDimensionScores(
  answers: InterviewAnswer[],
  questions: InterviewQuestion[]
): DimensionScores {
  const scores: DimensionScores = { technical: 0, behavioral: 0, project: 0, communication: 0 };
  const counts = { technical: 0, behavioral: 0, project: 0, communication: 0 };

  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    switch (question.type) {
      case 'TECHNICAL':
        scores.technical += answer.score;
        counts.technical++;
        break;
      case 'BEHAVIORAL':
      case 'HR':
        scores.behavioral += answer.score;
        counts.behavioral++;
        break;
      case 'PROJECT':
        scores.project += answer.score;
        counts.project++;
        break;
      case 'INTRO':
        scores.communication += answer.score;
        counts.communication++;
        break;
    }
  });

  (Object.keys(scores) as Array<keyof DimensionScores>).forEach(key => {
    if (counts[key] > 0) {
      scores[key] = Math.round(scores[key] / counts[key]);
    }
  });

  return scores;
}

// 生成整体反馈
function generateOverallFeedback(
  overallScore: number,
  dimensionScores: DimensionScores
): { feedback: string; strengths: string[]; improvements: string[]; nextSteps: string[] } {
  const feedbacks: Record<number, string> = {
    90: '表现非常出色！你对技术问题的理解深刻，表达清晰，展现了优秀工程师的潜质。',
    80: '表现良好。基础扎实，有一定的项目经验，但在某些方面还有提升空间。',
    70: '表现尚可。具备基础知识，但需要更多实践经验和系统学习。',
    60: '需要加强准备。建议多练习基础问题，积累项目经验。',
  };

  const level = overallScore >= 90 ? 90 : overallScore >= 80 ? 80 : overallScore >= 70 ? 70 : 60;
  const feedback = feedbacks[level];

  const strengths: string[] = [];
  if (dimensionScores.technical >= 80) strengths.push('技术基础扎实，对核心概念理解透彻');
  if (dimensionScores.project >= 80) strengths.push('项目经验丰富，能够清晰阐述项目细节');
  if (dimensionScores.behavioral >= 80) strengths.push('沟通表达流畅，能够很好地展示自己');
  if (dimensionScores.communication >= 80) strengths.push('自我介绍和总结能力强');
  if (strengths.length === 0) strengths.push('具备基本的面试应答能力');

  const improvements: string[] = [];
  if (dimensionScores.technical < 70) improvements.push('技术基础需要加强，建议系统学习核心知识');
  if (dimensionScores.project < 70) improvements.push('项目经验描述不够充分，建议用STAR法则组织语言');
  if (dimensionScores.behavioral < 70) improvements.push('行为面试回答需要更具体，多准备实际案例');
  if (dimensionScores.communication < 70) improvements.push('表达可以更加简洁有力，突出核心优势');
  if (improvements.length === 0) improvements.push('继续保持，向更高目标迈进');

  const nextSteps: string[] = [];
  if (dimensionScores.technical < 80) nextSteps.push('针对薄弱技术点进行专项学习');
  if (dimensionScores.project < 80) nextSteps.push('整理3-5个核心项目，用STAR法则反复练习');
  nextSteps.push('定期进行模拟面试，提升临场表现');
  nextSteps.push('关注行业动态，了解最新技术趋势');

  return { feedback, strengths, improvements, nextSteps };
}

// 完成面试
export async function completeInterviewAsync(sessionId: string): Promise<InterviewSession | undefined> {
  const session = await getInterviewSessionAsync(sessionId);
  if (!session || session.answers.length === 0) return undefined;

  const totalScore = session.answers.reduce((sum, a) => sum + a.score, 0);
  const overallScore = Math.round(totalScore / session.answers.length);
  const dimensionScores = calculateDimensionScores(session.answers, session.questions);
  const { feedback, strengths, improvements, nextSteps } = generateOverallFeedback(overallScore, dimensionScores);

  try {
    const data = await apiRequest<{ session: InterviewSession }>(`/api/interview/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'completed',
        overallScore,
        dimensionScores,
        overallFeedback: feedback,
        strengths,
        improvements,
        nextSteps,
        completedAt: new Date().toISOString(),
      }),
    });
    clearCache();
    return data.session;
  } catch (error) {
    console.error('Failed to complete interview:', error);
    return undefined;
  }
}

export function completeInterview(sessionId: string): InterviewSession | undefined {
  completeInterviewAsync(sessionId).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === sessionId);
    if (session && session.answers.length > 0) {
      const totalScore = session.answers.reduce((sum, a) => sum + a.score, 0);
      session.overallScore = Math.round(totalScore / session.answers.length);
      session.dimensionScores = calculateDimensionScores(session.answers, session.questions);
      const { feedback, strengths, improvements, nextSteps } = generateOverallFeedback(
        session.overallScore,
        session.dimensionScores
      );
      session.overallFeedback = feedback;
      session.strengths = strengths;
      session.improvements = improvements;
      session.nextSteps = nextSteps;
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      return session;
    }
  }
  return undefined;
}

// 获取 AI 整体评价
export async function fetchAIEvaluation(session: InterviewSession): Promise<AIOverallEvaluation | null> {
  try {
    const response = await fetch('/api/interview/overall-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });

    if (!response.ok) {
      console.error('AI evaluation failed');
      return null;
    }

    const data = await response.json();
    if (data.success && data.evaluation) {
      return {
        ...data.evaluation,
        generatedAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch AI evaluation:', error);
    return null;
  }
}

// 更新面试会话的 AI 评价
export async function updateSessionWithAIEvaluationAsync(
  sessionId: string,
  aiEvaluation: AIOverallEvaluation
): Promise<InterviewSession | undefined> {
  try {
    const dimensionScores = aiEvaluation.dimensionAnalysis ? {
      technical: aiEvaluation.dimensionAnalysis.technical.score,
      project: aiEvaluation.dimensionAnalysis.project.score,
      behavioral: aiEvaluation.dimensionAnalysis.behavioral.score,
      communication: aiEvaluation.dimensionAnalysis.communication.score,
    } : undefined;

    const data = await apiRequest<{ session: InterviewSession }>(`/api/interview/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        aiEvaluation,
        overallFeedback: aiEvaluation.overallFeedback,
        strengths: aiEvaluation.strengths,
        improvements: aiEvaluation.improvements,
        nextSteps: aiEvaluation.nextSteps,
        ...(dimensionScores && { dimensionScores }),
      }),
    });
    clearCache();
    return data.session;
  } catch (error) {
    console.error('Failed to update AI evaluation:', error);
    return undefined;
  }
}

export function updateSessionWithAIEvaluation(
  sessionId: string,
  aiEvaluation: AIOverallEvaluation
): InterviewSession | undefined {
  updateSessionWithAIEvaluationAsync(sessionId, aiEvaluation).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === sessionId);
    if (session) {
      session.aiEvaluation = aiEvaluation;
      session.overallFeedback = aiEvaluation.overallFeedback;
      session.strengths = aiEvaluation.strengths;
      session.improvements = aiEvaluation.improvements;
      session.nextSteps = aiEvaluation.nextSteps;
      if (aiEvaluation.dimensionAnalysis) {
        session.dimensionScores = {
          technical: aiEvaluation.dimensionAnalysis.technical.score,
          project: aiEvaluation.dimensionAnalysis.project.score,
          behavioral: aiEvaluation.dimensionAnalysis.behavioral.score,
          communication: aiEvaluation.dimensionAnalysis.communication.score,
        };
      }
      return session;
    }
  }
  return undefined;
}

// 完成面试并获取 AI 评价
export async function completeInterviewWithAI(sessionId: string): Promise<InterviewSession | undefined> {
  const session = await completeInterviewAsync(sessionId);
  if (!session) return undefined;

  try {
    const aiEvaluation = await fetchAIEvaluation(session);
    if (aiEvaluation) {
      return await updateSessionWithAIEvaluationAsync(sessionId, aiEvaluation);
    }
  } catch (error) {
    console.error('AI evaluation error:', error);
  }

  return session;
}

// 删除面试会话
export async function deleteInterviewSessionAsync(id: string): Promise<void> {
  try {
    await apiRequest(`/api/interview/sessions/${id}`, { method: 'DELETE' });
    clearCache();
  } catch (error) {
    console.error('Failed to delete interview session:', error);
  }
}

export function deleteInterviewSession(id: string): void {
  deleteInterviewSessionAsync(id).catch(console.error);
  if (sessionsCache) {
    sessionsCache = sessionsCache.filter(s => s.id !== id);
  }
}

// 更新答案的反馈
export async function updateAnswerFeedbackAsync(
  sessionId: string,
  questionId: string,
  updates: {
    score: number;
    feedback: InterviewAnswer['feedback'];
    duration: number;
  }
): Promise<InterviewSession | undefined> {
  try {
    await apiRequest(`/api/interview/sessions/${sessionId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({
        questionId,
        score: updates.score,
        feedback: updates.feedback,
        duration: updates.duration,
      }),
    });
    clearCache();
    return await getInterviewSessionAsync(sessionId);
  } catch (error) {
    console.error('Failed to update answer feedback:', error);
    return undefined;
  }
}

export function updateAnswerFeedback(
  sessionId: string,
  questionId: string,
  updates: {
    score: number;
    feedback: InterviewAnswer['feedback'];
    duration: number;
  }
): InterviewSession | undefined {
  updateAnswerFeedbackAsync(sessionId, questionId, updates).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === sessionId);
    if (session) {
      const answer = session.answers.find(a => a.questionId === questionId);
      if (answer) {
        answer.score = updates.score;
        answer.feedback = updates.feedback;
        return session;
      }
    }
  }
  return undefined;
}

// 更新面试会话标题
export async function updateInterviewTitleAsync(id: string, title: string): Promise<InterviewSession | undefined> {
  try {
    const data = await apiRequest<{ session: InterviewSession }>(`/api/interview/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
    clearCache();
    return data.session;
  } catch (error) {
    console.error('Failed to update interview title:', error);
    return undefined;
  }
}

export function updateInterviewTitle(id: string, title: string): InterviewSession | undefined {
  updateInterviewTitleAsync(id, title).catch(console.error);

  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === id);
    if (session) {
      session.title = title;
      return session;
    }
  }
  return undefined;
}

// 克隆面试会话
export async function cloneInterviewSessionAsync(id: string): Promise<InterviewSession | undefined> {
  const session = await getInterviewSessionAsync(id);
  if (!session) return undefined;

  return await createInterviewSessionAsync(
    session.title + ' (复练)',
    session.jdText,
    session.resumeText,
    session.questions,
    session.jobInfo
  );
}

export function cloneInterviewSession(id: string): InterviewSession | undefined {
  if (sessionsCache) {
    const session = sessionsCache.find(s => s.id === id);
    if (session) {
      const newSession: InterviewSession = {
        id: 'temp-' + crypto.randomUUID(),
        title: session.title + ' (复练)',
        jdText: session.jdText,
        resumeText: session.resumeText,
        jobInfo: { ...session.jobInfo },
        questions: session.questions.map((q, idx) => ({ ...q, order: idx })),
        status: 'pending',
        createdAt: new Date().toISOString(),
        answers: [],
        overallScore: 0,
        dimensionScores: { technical: 0, behavioral: 0, project: 0, communication: 0 },
        overallFeedback: '',
        strengths: [],
        improvements: [],
        nextSteps: [],
      };

      cloneInterviewSessionAsync(id).catch(console.error);
      sessionsCache.unshift(newSession);
      return newSession;
    }
  }
  return undefined;
}

// 获取面试统计
export async function getInterviewStatsAsync(): Promise<{
  totalInterviews: number;
  averageScore: number;
  bestScore: number;
}> {
  const sessions = await getInterviewSessionsAsync();
  const completed = sessions.filter(s => s.status === 'completed');

  if (completed.length === 0) {
    return { totalInterviews: 0, averageScore: 0, bestScore: 0 };
  }

  const scores = completed.map(s => s.overallScore);
  return {
    totalInterviews: completed.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
  };
}

export function getInterviewStats() {
  const sessions = getInterviewSessions();
  const completed = sessions.filter(s => s.status === 'completed');

  if (completed.length === 0) {
    return { totalInterviews: 0, averageScore: 0, bestScore: 0 };
  }

  const scores = completed.map(s => s.overallScore);
  return {
    totalInterviews: completed.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
  };
}

// 初始化：预加载会话数据
if (typeof window !== 'undefined') {
  getInterviewSessionsAsync().catch(console.error);
}
