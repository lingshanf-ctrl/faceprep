// 我的专属题库存储 - 用户自定义题目管理

export interface CustomQuestion {
  id: string;
  title: string;
  type: 'INTRO' | 'PROJECT' | 'TECHNICAL' | 'BEHAVIORAL' | 'HR';
  category: 'FRONTEND' | 'BACKEND' | 'PRODUCT' | 'DESIGN' | 'OPERATION' | 'GENERAL';
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string;
  referenceAnswer?: string;
  createdAt: string;
}

export interface CustomQuestionSet {
  id: string;
  name: string;
  description?: string;
  questions: CustomQuestion[];
  createdAt: string;
  updatedAt: string;
}

const CUSTOM_QUESTIONS_KEY = 'job-pilot-custom-questions';
const CUSTOM_SETS_KEY = 'job-pilot-custom-sets';

// ============ 题目 CRUD ============

export function getCustomQuestions(): CustomQuestion[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addCustomQuestion(question: Omit<CustomQuestion, 'id' | 'createdAt'>): CustomQuestion {
  const questions = getCustomQuestions();

  const newQuestion: CustomQuestion = {
    ...question,
    id: `custom-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  questions.unshift(newQuestion);
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));

  return newQuestion;
}

export function addCustomQuestions(questions: Omit<CustomQuestion, 'id' | 'createdAt'>[]): CustomQuestion[] {
  const existingQuestions = getCustomQuestions();
  const now = Date.now();

  const newQuestions: CustomQuestion[] = questions.map((q, idx) => ({
    ...q,
    id: `custom-${now}-${idx}`,
    createdAt: new Date().toISOString(),
  }));

  const allQuestions = [...newQuestions, ...existingQuestions];
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(allQuestions));

  return newQuestions;
}

export function updateCustomQuestion(id: string, updates: Partial<CustomQuestion>): CustomQuestion | null {
  const questions = getCustomQuestions();
  const index = questions.findIndex(q => q.id === id);

  if (index === -1) return null;

  questions[index] = { ...questions[index], ...updates };
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));

  return questions[index];
}

export function deleteCustomQuestion(id: string): boolean {
  const questions = getCustomQuestions();
  const filtered = questions.filter(q => q.id !== id);

  if (filtered.length === questions.length) return false;

  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(filtered));
  return true;
}

export function clearCustomQuestions(): void {
  localStorage.removeItem(CUSTOM_QUESTIONS_KEY);
}

// ============ 题组管理 ============

export function getCustomSets(): CustomQuestionSet[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(CUSTOM_SETS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function createCustomSet(name: string, questionIds: string[], description?: string): CustomQuestionSet | null {
  const allQuestions = getCustomQuestions();
  const selectedQuestions = allQuestions.filter(q => questionIds.includes(q.id));

  if (selectedQuestions.length === 0) return null;

  const sets = getCustomSets();
  const now = new Date().toISOString();

  const newSet: CustomQuestionSet = {
    id: `set-${Date.now()}`,
    name,
    description,
    questions: selectedQuestions,
    createdAt: now,
    updatedAt: now,
  };

  sets.unshift(newSet);
  localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(sets));

  return newSet;
}

export function deleteCustomSet(id: string): boolean {
  const sets = getCustomSets();
  const filtered = sets.filter(s => s.id !== id);

  if (filtered.length === sets.length) return false;

  localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(filtered));
  return true;
}

// ============ 统计 ============

export function getCustomQuestionsStats() {
  const questions = getCustomQuestions();

  return {
    total: questions.length,
    byType: {
      INTRO: questions.filter(q => q.type === 'INTRO').length,
      PROJECT: questions.filter(q => q.type === 'PROJECT').length,
      TECHNICAL: questions.filter(q => q.type === 'TECHNICAL').length,
      BEHAVIORAL: questions.filter(q => q.type === 'BEHAVIORAL').length,
      HR: questions.filter(q => q.type === 'HR').length,
    },
  };
}
