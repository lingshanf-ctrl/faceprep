// 面试会话存储 - 整套题组的快照和面试记录

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
    // AI 评估的完整维度数据
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

  // 面试结果
  answers: InterviewAnswer[];
  overallScore: number;
  dimensionScores: DimensionScores;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

const INTERVIEW_STORAGE_KEY = 'job-pilot-interview-sessions';

// 获取所有面试会话
export function getInterviewSessions(): InterviewSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 创建面试会话
export function createInterviewSession(
  title: string,
  jdText: string,
  resumeText: string | undefined,
  questions: InterviewQuestion[],
  jobInfo: InterviewSession['jobInfo']
): InterviewSession {
  const sessions = getInterviewSessions();

  const newSession: InterviewSession = {
    id: crypto.randomUUID(),
    title,
    jdText,
    resumeText,
    jobInfo,
    questions: questions.map((q, idx) => ({ ...q, order: idx })),
    status: 'pending',
    createdAt: new Date().toISOString(),
    answers: [],
    overallScore: 0,
    dimensionScores: {
      technical: 0,
      behavioral: 0,
      project: 0,
      communication: 0,
    },
    overallFeedback: '',
    strengths: [],
    improvements: [],
    nextSteps: [],
  };

  sessions.unshift(newSession);
  localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));

  return newSession;
}

// 获取单个面试会话
export function getInterviewSession(id: string): InterviewSession | undefined {
  const sessions = getInterviewSessions();
  return sessions.find(s => s.id === id);
}

// 开始面试
export function startInterview(id: string): InterviewSession | undefined {
  const sessions = getInterviewSessions();
  const session = sessions.find(s => s.id === id);

  if (session && session.status === 'pending') {
    session.status = 'in_progress';
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(sessions));
  }

  return session;
}

// 提交答案
export function submitAnswer(
  sessionId: string,
  answer: InterviewAnswer
): InterviewSession | undefined {
  const sessions = getInterviewSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);

  if (sessionIndex === -1) return undefined;

  const session = sessions[sessionIndex];
  session.answers.push(answer);

  localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(sessions));
  return session;
}

// 计算维度得分
function calculateDimensionScores(
  answers: InterviewAnswer[],
  questions: InterviewQuestion[]
): DimensionScores {
  const scores: DimensionScores = {
    technical: 0,
    behavioral: 0,
    project: 0,
    communication: 0,
  };

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

  // 计算平均分
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
  dimensionScores: DimensionScores,
  answers: InterviewAnswer[]
): { feedback: string; strengths: string[]; improvements: string[]; nextSteps: string[] } {
  const feedbacks: Record<number, string> = {
    90: '表现非常出色！你对技术问题的理解深刻，表达清晰，展现了优秀工程师的潜质。',
    80: '表现良好。基础扎实，有一定的项目经验，但在某些方面还有提升空间。',
    70: '表现尚可。具备基础知识，但需要更多实践经验和系统学习。',
    60: '需要加强准备。建议多练习基础问题，积累项目经验。',
  };

  const level = overallScore >= 90 ? 90 : overallScore >= 80 ? 80 : overallScore >= 70 ? 70 : 60;
  const feedback = feedbacks[level];

  // 分析优势
  const strengths: string[] = [];
  if (dimensionScores.technical >= 80) strengths.push('技术基础扎实，对核心概念理解透彻');
  if (dimensionScores.project >= 80) strengths.push('项目经验丰富，能够清晰阐述项目细节');
  if (dimensionScores.behavioral >= 80) strengths.push('沟通表达流畅，能够很好地展示自己');
  if (dimensionScores.communication >= 80) strengths.push('自我介绍和总结能力强');
  if (strengths.length === 0) strengths.push('具备基本的面试应答能力');

  // 分析改进点
  const improvements: string[] = [];
  if (dimensionScores.technical < 70) improvements.push('技术基础需要加强，建议系统学习核心知识');
  if (dimensionScores.project < 70) improvements.push('项目经验描述不够充分，建议用STAR法则组织语言');
  if (dimensionScores.behavioral < 70) improvements.push('行为面试回答需要更具体，多准备实际案例');
  if (dimensionScores.communication < 70) improvements.push('表达可以更加简洁有力，突出核心优势');
  if (improvements.length === 0) improvements.push('继续保持，向更高目标迈进');

  // 后续建议
  const nextSteps: string[] = [];
  if (dimensionScores.technical < 80) nextSteps.push('针对薄弱技术点进行专项学习');
  if (dimensionScores.project < 80) nextSteps.push('整理3-5个核心项目，用STAR法则反复练习');
  nextSteps.push('定期进行模拟面试，提升临场表现');
  nextSteps.push('关注行业动态，了解最新技术趋势');

  return { feedback, strengths, improvements, nextSteps };
}

// 完成面试
export function completeInterview(sessionId: string): InterviewSession | undefined {
  const sessions = getInterviewSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);

  if (sessionIndex === -1) return undefined;

  const session = sessions[sessionIndex];

  if (session.answers.length === 0) return undefined;

  // 计算总分
  const totalScore = session.answers.reduce((sum, a) => sum + a.score, 0);
  session.overallScore = Math.round(totalScore / session.answers.length);

  // 计算各维度得分
  session.dimensionScores = calculateDimensionScores(session.answers, session.questions);

  // 生成整体反馈
  const { feedback, strengths, improvements, nextSteps } = generateOverallFeedback(
    session.overallScore,
    session.dimensionScores,
    session.answers
  );
  session.overallFeedback = feedback;
  session.strengths = strengths;
  session.improvements = improvements;
  session.nextSteps = nextSteps;

  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(sessions));
  return session;
}

// 删除面试会话
export function deleteInterviewSession(id: string): void {
  const sessions = getInterviewSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(filtered));
}

// 获取面试统计
export function getInterviewStats() {
  const sessions = getInterviewSessions();
  const completed = sessions.filter(s => s.status === 'completed');

  if (completed.length === 0) {
    return {
      totalInterviews: 0,
      averageScore: 0,
      bestScore: 0,
    };
  }

  const scores = completed.map(s => s.overallScore);
  return {
    totalInterviews: completed.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
  };
}
