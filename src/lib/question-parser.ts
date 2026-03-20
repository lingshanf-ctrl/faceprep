// 智能题目解析器 - 从文本中提取面试题目

import { CustomQuestion } from './custom-questions-store';

export interface ParsedQuestion {
  title: string;
  type: 'INTRO' | 'PROJECT' | 'TECHNICAL' | 'BEHAVIORAL' | 'HR';
  category: 'FRONTEND' | 'BACKEND' | 'PRODUCT' | 'DESIGN' | 'OPERATION' | 'GENERAL';
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string;
  referenceAnswer?: string;
  selected?: boolean; // 用于前端选择是否添加
}

// 解析选项
export interface ParseOptions {
  minLength?: number;      // 最小题目长度
  maxLength?: number;      // 最大题目长度
  autoSelect?: boolean;    // 是否默认选中所有
  smartSplit?: boolean;    // 是否启用智能分段
}

// 题型关键词映射
const TYPE_KEYWORDS: Record<string, string[]> = {
  INTRO: ['自我介绍', '个人介绍', '介绍一下自己', '请介绍', '说说你自己'],
  PROJECT: ['项目', '介绍一个', '做过什么', '负责什么', '技术栈', '最有挑战', '印象最深'],
  TECHNICAL: ['原理', '机制', '底层', '源码', '算法', '性能优化', '设计模式', 'HTTP', 'TCP', '浏览器', 'React', 'Vue', 'JavaScript', 'TypeScript', 'CSS', 'HTML', '什么是', '如何实现', '解释', '区别', '比较'],
  BEHAVIORAL: ['冲突', '困难', '挑战', '团队', '沟通', '压力', '领导', '合作', '解决', '矛盾', '分歧', '协作'],
  HR: ['离职', '跳槽', '薪资', '期望', '职业规划', '优缺点', '加班', '为什么', '五年', '三年后'],
};

const TYPE_LABELS: Record<string, string> = {
  INTRO: '自我介绍',
  PROJECT: '项目经历',
  TECHNICAL: '技术问题',
  BEHAVIORAL: '行为面试',
  HR: 'HR面试',
};

// 难度关键词
const DIFFICULTY_KEYWORDS: Record<string, string[]> = {
  easy: ['基础', '简单', '概念', '什么是', '简述', '说说'],
  medium: ['原理', '机制', '区别', '比较', '如何', '怎么', '实现'],
  hard: ['深入', '源码', '底层', '架构', '设计', '优化', '难点', '挑战'],
};

/**
 * 智能检测题型
 */
function detectType(text: string): 'INTRO' | 'PROJECT' | 'TECHNICAL' | 'BEHAVIORAL' | 'HR' {
  const lowerText = text.toLowerCase();

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return type as ParsedQuestion['type'];
      }
    }
  }

  // 默认返回技术问题
  return 'TECHNICAL';
}

/**
 * 智能检测难度
 */
function detectDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const lowerText = text.toLowerCase();
  let score = 0;

  // 检查难度关键词
  for (const keyword of DIFFICULTY_KEYWORDS.hard) {
    if (lowerText.includes(keyword)) score += 3;
  }
  for (const keyword of DIFFICULTY_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) score += 2;
  }
  for (const keyword of DIFFICULTY_KEYWORDS.easy) {
    if (lowerText.includes(keyword)) score += 1;
  }

  // 根据文本长度和复杂度判断
  if (text.length > 50) score += 1;
  if (text.includes('？') || text.includes('?')) {
    const questionMarks = (text.match(/[？?]/g) || []).length;
    score += questionMarks;
  }

  if (score >= 5) return 'hard';
  if (score >= 3) return 'medium';
  return 'easy';
}

/**
 * 智能检测岗位分类
 */
function detectCategory(text: string): ParsedQuestion['category'] {
  const lowerText = text.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    FRONTEND: ['前端', 'react', 'vue', 'angular', 'css', 'html', 'javascript', 'typescript', 'webpack', 'vite'],
    BACKEND: ['后端', 'java', 'python', 'go', 'node', 'spring', 'django', 'mysql', 'redis', '数据库'],
    PRODUCT: ['产品', '需求', '用户', 'prd', '原型', '竞品', '数据分析'],
    DESIGN: ['设计', 'ui', 'ux', 'figma', 'sketch', '视觉', '交互'],
    OPERATION: ['运营', '活动', '增长', '内容', '社区'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category as ParsedQuestion['category'];
      }
    }
  }

  return 'GENERAL';
}

/**
 * 提取考察点
 */
function extractKeyPoints(text: string, type: string): string {
  const keyPoints: Record<string, string[]> = {
    INTRO: ['表达能力', '逻辑清晰', '与岗位匹配'],
    PROJECT: ['项目理解', '技术深度', '个人贡献'],
    TECHNICAL: ['技术基础', '原理理解', '实践经验'],
    BEHAVIORAL: ['沟通能力', '团队协作', '问题解决'],
    HR: ['职业规划', '价值观', '稳定性'],
  };

  return keyPoints[type]?.join('、') || '综合考察';
}

/**
 * 智能清理文本
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')           // 统一换行符
    .replace(/\t/g, ' ')               // 制表符转空格
    .replace(/[ ]{2,}/g, ' ')          // 多个空格合并
    .replace(/\n{3,}/g, '\n\n')        // 多个空行合并
    .trim();
}

/**
 * 智能分割题目 - 增强版
 * 支持更多不规范格式
 */
function splitQuestions(text: string): string[] {
  const cleaned = cleanText(text);

  // 如果文本很短，直接返回（单个问题也保留）
  if (cleaned.length < 4) return [];

  // 智能检测最佳分隔符并分割
  const delimiters = [
    // 数字序号: 1. 1、 (1) 1）第1题
    { pattern: /\n\s*(?:\d+[.．、\)）]|\(\d+\)|【\d+】|\[\d+\]|第\d+题[：:]?)\s*/, weight: 10 },
    // 字母序号: A. A、 (A)
    { pattern: /\n\s*(?:[A-E][.．、\)）]|\([A-E]\))\s*/, weight: 5 },
    // 符号列表
    { pattern: /\n\s*[\-\*•·]\s*/, weight: 8 },
    // 中文数字
    { pattern: /\n\s*(?:第[一二三四五六七八九十]+题[：:]?|[一二三四五六七八九十]+[、．.])\s*/, weight: 10 },
    // 问答标记
    { pattern: /\n\s*(?:问[：:]?|Q[:：]\s*|Question\s*\d*[:：]?)\s*/i, weight: 7 },
  ];

  // 检测使用哪个分隔符效果最好
  let bestDelimiter: RegExp | null = null;
  let maxMatches = 0;

  for (const { pattern } of delimiters) {
    const matches = (cleaned.match(pattern) || []).length;
    if (matches > maxMatches && matches >= 2) {
      maxMatches = matches;
      bestDelimiter = pattern;
    }
  }

  let parts: string[];

  if (bestDelimiter) {
    // 使用最佳分隔符分割
    parts = cleaned.split(bestDelimiter).filter(p => p.trim().length >= 5);
  } else {
    // 回退：尝试智能分段
    parts = smartParagraphSplit(cleaned);
  }

  // 进一步处理每个部分：如果里面还有明显的题目标记，继续分割
  const result: string[] = [];
  for (const part of parts) {
    const subParts = trySplitSubQuestions(part);
    result.push(...subParts);
  }

  // 过滤和清理
  return result
    .map(p => p.trim())
    .filter(p => {
      if (p.length < 4) return false; // 太短
      if (p.length > 500 && !p.includes('？') && !p.includes('?')) return false; // 太长且无问号，可能是答案
      return true;
    });
}

/**
 * 智能段落分割 - 当没有明显分隔符时使用
 */
function smartParagraphSplit(text: string): string[] {
  const lines = text.split('\n').filter(l => l.trim());
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // 如果行以问号结尾，可能是一个完整的题目
    if (trimmed.match(/[?？]\s*$/)) {
      if (currentParagraph) {
        currentParagraph += ' ' + trimmed;
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      } else {
        paragraphs.push(trimmed);
      }
    }
    // 如果当前段落已经很长且包含问号，开始新段落
    else if (currentParagraph.length > 100 && currentParagraph.includes('？')) {
      paragraphs.push(currentParagraph);
      currentParagraph = trimmed;
    }
    // 否则继续累积
    else {
      currentParagraph = currentParagraph ? currentParagraph + ' ' + trimmed : trimmed;
    }
  }

  // 处理最后一段
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  // 如果没有成功分段，按句子分割
  if (paragraphs.length <= 1 && text.length > 100) {
    return text
      .replace(/([。;；!！])([^\n])/g, '$1\n$2')  // 在标点后面加换行
      .split('\n')
      .filter(p => p.trim().length >= 10);
  }

  return paragraphs.length > 0 ? paragraphs : [text];
}

/**
 * 尝试分割子题目
 */
function trySplitSubQuestions(text: string): string[] {
  // 检测文本内部是否有题目编号模式
  const internalPattern = /(?:^|\s)(?:\d+[.．、]|\(\d+\)|[一二三四五六七八九十]+[、．])(?![\d])/;
  const matches = text.split(internalPattern).filter(p => p.trim().length >= 8);

  if (matches.length > 1) {
    return matches;
  }

  return [text];
}

/**
 * 解析单道题目 - 增强版
 */
function parseSingleQuestion(text: string, options: ParseOptions = {}): ParsedQuestion | null {
  const { minLength = 3, maxLength = 300 } = options;
  const cleaned = text.trim();

  if (cleaned.length < minLength) return null;
  if (cleaned.length > 500 && !cleaned.match(/[?？]/)) return null; // 太长且无问题标记

  // 提取题目（移除各种序号前缀）
  let title = cleaned
    // 数字序号: 1. 1、 (1) [1] 【1】 1)
    .replace(/^\s*(?:\d+[.．、\)）]|\(\d+\)|\[\d+\]|【\d+】)\s*/, '')
    // 符号列表
    .replace(/^\s*[\-\*•·]\s*/, '')
    // 中文数字: 第一题： 一、
    .replace(/^\s*第[一二三四五六七八九十]+题[：:]?\s*/, '')
    .replace(/^\s*[一二三四五六七八九十]+[、．.]\s*/, '')
    // 字母序号: A. (A)
    .replace(/^\s*(?:[A-E][.．、\)）]|\([A-E]\))\s*/, '')
    // Q标记
    .replace(/^\s*Q[:：]?\s*/i, '')
    .replace(/^\s*Question\s*\d*[:：]?\s*/i, '')
    .trim();

  // 移除末尾的答案部分（如果有明显标记）
  title = title
    .replace(/(?:答案|答)[:：][\s\S]*$/, '')
    .replace(/(?:参考答案|解析)[:：][\s\S]*$/, '')
    .trim();

  if (!title || title.length < minLength) return null;
  if (title.length > maxLength) {
    // 截断但尽量保留完整句子
    const truncateMatch = title.substring(0, maxLength).match(/.*[。？!！;；]/);
    title = truncateMatch ? truncateMatch[0] : title.substring(0, maxLength) + '...';
  }

  const type = detectType(title);
  const difficulty = detectDifficulty(title);
  const category = detectCategory(title);
  const keyPoints = extractKeyPoints(title, type);

  return {
    title,
    type,
    category,
    difficulty,
    keyPoints,
    selected: options.autoSelect !== false,
  };
}

/**
 * 主解析函数 - 增强版
 */
export function parseQuestionsFromText(text: string, options: ParseOptions = {}): ParsedQuestion[] {
  if (!text?.trim()) return [];

  let rawQuestions = splitQuestions(text);

  // 如果分割结果为空，但文本有内容，把整段文本当作一道题处理
  if (rawQuestions.length === 0 && text.trim().length >= 3) {
    rawQuestions = [text.trim()];
  }

  const parsed: ParsedQuestion[] = [];

  for (const raw of rawQuestions) {
    const question = parseSingleQuestion(raw, options);
    if (question) {
      // 检查是否重复
      const isDuplicate = parsed.some(p =>
        p.title === question.title ||
        (p.title.length > 20 && question.title.includes(p.title.substring(0, 20))) ||
        (question.title.length > 20 && p.title.includes(question.title.substring(0, 20)))
      );
      if (!isDuplicate) {
        parsed.push(question);
      }
    }
  }

  return parsed;
}

/**
 * 预览解析结果 - 增强版
 */
export function previewParsedQuestions(text: string, options: ParseOptions = {}): {
  questions: ParsedQuestion[];
  total: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  rawCount: number; // 原始分割出的片段数
} {
  const questions = parseQuestionsFromText(text, options);

  const byType: Record<string, number> = {
    INTRO: 0,
    PROJECT: 0,
    TECHNICAL: 0,
    BEHAVIORAL: 0,
    HR: 0,
  };

  const byDifficulty: Record<string, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  const byCategory: Record<string, number> = {
    FRONTEND: 0,
    BACKEND: 0,
    PRODUCT: 0,
    DESIGN: 0,
    OPERATION: 0,
    GENERAL: 0,
  };

  for (const q of questions) {
    byType[q.type]++;
    byDifficulty[q.difficulty]++;
    byCategory[q.category]++;
  }

  // 统计原始片段数
  const rawCount = text?.trim() ? splitQuestions(text).length : 0;

  return {
    questions,
    total: questions.length,
    byType,
    byDifficulty,
    byCategory,
    rawCount,
  };
}

/**
 * 格式化解析后的题目为 CustomQuestion
 * 只返回选中的题目
 */
export function formatToCustomQuestions(
  parsed: ParsedQuestion[],
  onlySelected: boolean = false
): Omit<CustomQuestion, 'id' | 'createdAt'>[] {
  const filtered = onlySelected
    ? parsed.filter(p => p.selected !== false)
    : parsed;

  return filtered.map(p => ({
    title: p.title,
    type: p.type,
    category: p.category,
    difficulty: p.difficulty,
    keyPoints: p.keyPoints,
    referenceAnswer: p.referenceAnswer,
  }));
}

/**
 * 智能规范化题目文本
 * 修复常见的格式问题
 */
export function normalizeQuestionText(text: string): string {
  return text
    // 统一标点符号
    .replace(/,/g, '，')
    .replace(/\./g, '。')
    .replace(/\?/g, '？')
    .replace(/!/g, '！')
    .replace(/:/g, '：')
    .replace(/;/g, '；')
    // 移除多余空格
    .replace(/[ ]+/g, ' ')
    // 移除行首行尾空格
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * 快速检测文本是否包含可解析的题目
 */
export function detectQuestions(text: string): {
  hasQuestions: boolean;
  estimatedCount: number;
  confidence: 'high' | 'medium' | 'low';
} {
  if (!text?.trim()) {
    return { hasQuestions: false, estimatedCount: 0, confidence: 'low' };
  }

  const indicators = [
    // 数字序号
    { pattern: /(?:^|\n)\s*\d+[.．、\)）]/g, weight: 3 },
    // 问号
    { pattern: /[?？]/g, weight: 2 },
    // 符号列表
    { pattern: /(?:^|\n)\s*[\-\*•·]/g, weight: 2 },
    // 中文数字
    { pattern: /(?:第[一二三四五六七八九十]+题|[一二三四五六七八九十]+[、．])/g, weight: 3 },
    // 常见疑问词
    { pattern: /(?:什么是|怎么|如何|为什么|请介绍|请说明)/g, weight: 1 },
  ];

  let score = 0;
  let matchedPatterns = 0;

  for (const { pattern, weight } of indicators) {
    const matches = (text.match(pattern) || []).length;
    if (matches > 0) {
      score += Math.min(matches, 10) * weight;
      matchedPatterns++;
    }
  }

  const estimatedCount = splitQuestions(text).length;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (score >= 15 && matchedPatterns >= 3) confidence = 'high';
  else if (score >= 8 && matchedPatterns >= 2) confidence = 'medium';

  return {
    hasQuestions: score >= 5 || estimatedCount >= 1,
    estimatedCount,
    confidence,
  };
}
