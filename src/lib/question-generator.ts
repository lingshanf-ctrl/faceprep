// 面试题生成规则引擎
// 基于 JD 和简历内容，通过规则匹配生成针对性面试题

export interface GenerateOptions {
  jdText: string;
  resumeText?: string;
  questionCount?: number;
}

export interface GeneratedQuestion {
  id: string;
  title: string;
  type: 'INTRO' | 'PROJECT' | 'TECHNICAL' | 'BEHAVIORAL' | 'HR';
  keyPoints: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============ 关键词词典 ============
const SKILL_KEYWORDS: Record<string, string[]> = {
  // 前端
  frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'webpack', 'vite', 'nextjs', 'frontend', '前端', 'react native', 'flutter'],
  // 后端
  backend: ['java', 'python', 'go', 'nodejs', 'spring', 'django', 'mysql', 'redis', 'mongodb', 'postgresql', 'microservices', 'backend', '后端', 'distributed'],
  // 移动端
  mobile: ['ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'mobile', '移动端'],
  // AI/算法
  ai: ['machine learning', 'deep learning', 'nlp', 'computer vision', 'algorithm', 'tensorflow', 'pytorch', '模型', '算法'],
  // 产品
  product: ['prd', '原型', 'axure', 'figma', '需求分析', '用户研究', '数据分析', '竞品分析', '产品规划'],
  // 设计
  design: ['ui', 'ux', '视觉设计', '交互设计', 'figma', 'sketch', 'photoshop', '设计系统'],
  // 运维/云
  devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'aws', 'azure', '阿里云', '腾讯云', '云原生'],
  // 数据
  data: ['hadoop', 'spark', 'flink', 'data warehouse', 'etl', 'bi', '数据仓库', '大数据'],
};

const JOB_TITLES: Record<string, string[]> = {
  frontend: ['前端工程师', '前端开发', 'frontend', 'web开发', 'fe工程师', '前端架构师'],
  backend: ['后端工程师', '后端开发', 'backend', 'java开发', 'python开发', 'go开发', '服务端开发'],
  fullstack: ['全栈工程师', 'fullstack', '全栈开发'],
  mobile: ['移动端开发', 'ios开发', 'android开发', 'flutter开发', 'react native开发'],
  product: ['产品经理', 'pm', '产品专员', '产品负责人', 'product manager'],
  design: ['ui设计师', 'ux设计师', '视觉设计师', '交互设计师'],
  algorithm: ['算法工程师', '算法专家', '机器学习工程师', 'ai工程师'],
  data: ['数据工程师', '数据分析师', '数据开发'],
  qa: ['测试工程师', 'qa', '自动化测试', '测试开发'],
  devops: ['运维工程师', 'devops', 'sre', '云平台工程师'],
};

// ============ 题目模板库 ============
const QUESTION_TEMPLATES: Record<string, Array<{title: string; keyPoints: string; difficulty: 'easy' | 'medium' | 'hard'}>> = {
  // 项目经历类
  PROJECT: [
    {
      title: '请详细介绍你在{company}做的{projectName}项目',
      keyPoints: '项目背景、技术架构、你的职责、遇到的挑战、项目成果',
      difficulty: 'medium'
    },
    {
      title: '在{projectName}项目中，{techStack}技术选型的考虑是什么？',
      keyPoints: '技术选型依据、对比其他方案、最终效果',
      difficulty: 'medium'
    },
    {
      title: '{projectName}项目中遇到过最大的技术难点是什么？如何解决的？',
      keyPoints: '问题描述、解决思路、最终结果、经验总结',
      difficulty: 'hard'
    },
    {
      title: '如果重新做{projectName}项目，你觉得哪些地方可以优化？',
      keyPoints: '反思能力、技术视野、架构设计能力',
      difficulty: 'hard'
    },
  ],

  // 技术问题类
  TECHNICAL: [
    {
      title: '请深入讲解一下{skill}的核心原理',
      keyPoints: '原理理解、实际应用、源码级理解',
      difficulty: 'medium'
    },
    {
      title: '你在项目中是如何使用{skill}的？有什么最佳实践？',
      keyPoints: '使用场景、实践经验、踩坑总结',
      difficulty: 'medium'
    },
    {
      title: '{skill}和{alternativeSkill}的区别是什么？你如何选择？',
      keyPoints: '对比分析、适用场景、选型依据',
      difficulty: 'hard'
    },
    {
      title: '请手写/实现一个{skill}相关的{task}',
      keyPoints: '代码能力、API熟悉度、边界情况处理',
      difficulty: 'hard'
    },
  ],

  // 行为面试类
  BEHAVIORAL: [
    {
      title: '当你的技术方案和团队其他成员有分歧时，你是怎么处理的？',
      keyPoints: '沟通能力、团队协作、技术说服力',
      difficulty: 'medium'
    },
    {
      title: '说一个你在{company}推动的改变或创新',
      keyPoints: '主动性、影响力、变革能力',
      difficulty: 'medium'
    },
    {
      title: '如果项目临近上线发现严重bug，你会怎么处理？',
      keyPoints: '应急能力、风险评估、决策能力',
      difficulty: 'hard'
    },
    {
      title: '你如何保持技术能力的持续提升？',
      keyPoints: '学习能力、技术热情、自我驱动',
      difficulty: 'easy'
    },
  ],

  // HR类
  HR: [
    {
      title: '为什么想离开现在的公司加入{targetCompany}？',
      keyPoints: '职业规划、求职动机、价值观匹配',
      difficulty: 'easy'
    },
    {
      title: '你对{targetPosition}这个岗位的理解是什么？',
      keyPoints: '岗位认知、职业定位、期望匹配',
      difficulty: 'medium'
    },
    {
      title: '你的职业规划是什么？3-5年的目标是什么？',
      keyPoints: '职业规划、长期目标、稳定性',
      difficulty: 'medium'
    },
    {
      title: '期望薪资是多少？对股权/期权有什么看法？',
      keyPoints: '薪资期望、价值观、风险认知',
      difficulty: 'medium'
    },
  ],

  // 自我介绍类
  INTRO: [
    {
      title: '请做个自我介绍，重点突出你和{targetPosition}的匹配度',
      keyPoints: '核心优势、相关经验、与岗位匹配点',
      difficulty: 'easy'
    },
    {
      title: '请用3分钟介绍你最得意的项目经历',
      keyPoints: '表达能力、项目亮点、成就展示',
      difficulty: 'easy'
    },
  ],
};

// ============ 解析工具函数 ============

/**
 * 从文本中提取技能关键词
 */
function extractSkills(text: string): string[] {
  const textLower = text.toLowerCase();
  const foundSkills = new Set<string>();

  Object.entries(SKILL_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        foundSkills.add(keyword);
      }
    });
  });

  return Array.from(foundSkills);
}

/**
 * 识别岗位类型
 */
function detectJobType(jdText: string): string {
  const jdLower = jdText.toLowerCase();

  for (const [type, titles] of Object.entries(JOB_TITLES)) {
    for (const title of titles) {
      if (jdLower.includes(title.toLowerCase())) {
        return type;
      }
    }
  }

  // 根据技能推测
  const skills = extractSkills(jdText);
  if (skills.some(s => SKILL_KEYWORDS.frontend.includes(s))) return 'frontend';
  if (skills.some(s => SKILL_KEYWORDS.backend.includes(s))) return 'backend';
  if (skills.some(s => SKILL_KEYWORDS.product.includes(s))) return 'product';
  if (skills.some(s => SKILL_KEYWORDS.design.includes(s))) return 'design';

  return 'general';
}

/**
 * 从简历中提取项目经历
 */
function extractProjects(resumeText: string): Array<{name: string; company: string; techStack: string[]}> {
  const projects: Array<{name: string; company: string; techStack: string[]}> = [];

  // 匹配 "项目"、"负责"、"开发" 等关键词附近的内容
  const projectPatterns = [
    /(?:项目|负责|参与)[：:]\s*([^\n，。]+)/g,
    /(?:项目名称)[：:]\s*([^\n]+)/g,
  ];

  // 简单提取公司名（通常是简历开头的公司）
  const companyMatch = resumeText.match(/(?:公司|单位)[：:]?\s*([^\n，。]+)/);
  const company = companyMatch ? companyMatch[1].trim() : '上一家公司';

  // 提取技术栈（通常跟在 "技术栈"、"使用" 后面）
  const techStackMatch = resumeText.match(/(?:技术栈|使用|涉及)[：:]?\s*([^\n，。]+)/g);

  // 简化的项目提取逻辑
  const lines = resumeText.split('\n');
  lines.forEach(line => {
    if (line.includes('项目') && (line.includes('负责') || line.includes('开发'))) {
      const projectName = line.replace(/.*[：:]/, '').trim().slice(0, 20);
      if (projectName && projectName.length > 2) {
        projects.push({
          name: projectName,
          company,
          techStack: extractSkills(line)
        });
      }
    }
  });

  // 如果没有提取到项目，返回默认项目
  if (projects.length === 0) {
    projects.push({
      name: '核心项目',
      company,
      techStack: extractSkills(resumeText).slice(0, 5)
    });
  }

  return projects;
}

/**
 * 提取公司名称
 */
function extractCompany(jdText: string): string {
  // 尝试从 JD 中提取公司名
  const patterns = [
    /(?:关于我们|公司介绍)[：:]\s*([^\n]+)/,
    /([^\n]{2,20})(?:招聘|诚聘|急聘)/,
    /([^\n]{2,20})\s*简介/,
  ];

  for (const pattern of patterns) {
    const match = jdText.match(pattern);
    if (match) {
      return match[1].trim().slice(0, 15);
    }
  }

  return '我们公司';
}

/**
 * 提取岗位名称
 */
function extractPosition(jdText: string): string {
  const patterns = [
    /(?:职位|岗位)[：:]\s*([^\n]+)/,
    /招聘\s*([^\n]{2,20})(?:\d|名|人)/,
    /([^\n]{2,20})\s*(?:工程师|开发|经理|专员|设计师)/,
  ];

  for (const pattern of patterns) {
    const match = jdText.match(pattern);
    if (match) {
      return match[1].trim().slice(0, 20);
    }
  }

  // 根据技能推测
  const jobType = detectJobType(jdText);
  const typeMap: Record<string, string> = {
    frontend: '前端工程师',
    backend: '后端工程师',
    fullstack: '全栈工程师',
    mobile: '移动端开发',
    product: '产品经理',
    design: 'UI设计师',
    algorithm: '算法工程师',
    data: '数据工程师',
    qa: '测试工程师',
    devops: '运维工程师',
    general: '研发工程师',
  };

  return typeMap[jobType] || '研发工程师';
}

/**
 * 计算技能匹配度
 */
function calculateSkillMatch(jdSkills: string[], resumeSkills: string[]): {
  matched: string[];
  missing: string[];
  extra: string[];
} {
  const jdSet = new Set(jdSkills.map(s => s.toLowerCase()));
  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase()));

  const matched = jdSkills.filter(s => resumeSet.has(s.toLowerCase()));
  const missing = jdSkills.filter(s => !resumeSet.has(s.toLowerCase()));
  const extra = resumeSkills.filter(s => !jdSet.has(s.toLowerCase()));

  return { matched, missing, extra };
}

/**
 * 根据经验年限判断难度
 */
function detectExperienceLevel(resumeText: string): 'junior' | 'mid' | 'senior' {
  // 查找工作年限
  const patterns = [
    /(\d+)\s*年(?:以上)?.*?(?:经验|工作)/,
    /工作\s*(\d+)\s*年/,
    /(\d+)\+?\s*years?\s*(?:of)?\s*experience/i,
  ];

  for (const pattern of patterns) {
    const match = resumeText.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (years >= 5) return 'senior';
      if (years >= 3) return 'mid';
      return 'junior';
    }
  }

  // 根据关键词推测
  if (resumeText.includes('资深') || resumeText.includes('专家') || resumeText.includes('架构师')) {
    return 'senior';
  }
  if (resumeText.includes('高级')) {
    return 'mid';
  }

  return 'junior';
}

// ============ 题目生成策略 ============

/**
 * 生成项目类问题
 */
function generateProjectQuestions(
  projects: Array<{name: string; company: string; techStack: string[]}>,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const templates = QUESTION_TEMPLATES.PROJECT;

  projects.slice(0, 2).forEach((project, idx) => {
    const template = templates[idx % templates.length];
    questions.push({
      id: `proj-${idx}`,
      title: template.title
        .replace('{projectName}', project.name)
        .replace('{company}', project.company),
      type: 'PROJECT',
      keyPoints: template.keyPoints,
      category: 'PROJECT',
      difficulty: template.difficulty
    });

    // 如果有技术栈，生成一个技术深挖题
    if (project.techStack.length > 0) {
      const mainTech = project.techStack[0];
      questions.push({
        id: `proj-tech-${idx}`,
        title: `在${project.name}中，${mainTech}的使用有哪些最佳实践？遇到过什么坑？`,
        type: 'TECHNICAL',
        keyPoints: '实际应用经验、问题解决能力、最佳实践',
        category: 'TECHNICAL',
        difficulty: 'hard'
      });
    }
  });

  return questions.slice(0, count);
}

/**
 * 生成技术类问题
 */
function generateTechnicalQuestions(
  jdSkills: string[],
  resumeSkills: string[],
  jobType: string,
  level: 'junior' | 'mid' | 'senior',
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const { matched, missing } = calculateSkillMatch(jdSkills, resumeSkills);

  // 核心技能深挖（匹配的技能）
  matched.slice(0, 2).forEach((skill, idx) => {
    const templates = QUESTION_TEMPLATES.TECHNICAL;
    const template = templates[idx % templates.length];

    questions.push({
      id: `tech-match-${idx}`,
      title: template.title.replace('{skill}', skill),
      type: 'TECHNICAL',
      keyPoints: template.keyPoints,
      category: 'TECHNICAL',
      difficulty: level === 'senior' ? 'hard' : 'medium'
    });
  });

  // JD要求但简历缺少的技能（考察学习能力）
  missing.slice(0, 1).forEach((skill, idx) => {
    questions.push({
      id: `tech-missing-${idx}`,
      title: `JD中提到了${skill}，你对此有多少了解？如果入职后需要使用，你打算如何快速上手？`,
      type: 'TECHNICAL',
      keyPoints: '学习能力、技术基础、适应能力',
      category: 'TECHNICAL',
      difficulty: 'medium'
    });
  });

  // 岗位特定问题
  const specificQuestions = getJobSpecificQuestions(jobType, level);
  questions.push(...specificQuestions);

  return questions.slice(0, count);
}

/**
 * 获取岗位特定问题
 */
function getJobSpecificQuestions(jobType: string, level: 'junior' | 'mid' | 'senior'): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  const specificQuestions: Record<string, Array<{title: string; keyPoints: string; difficulty: 'easy' | 'medium' | 'hard'}>> = {
    frontend: [
      { title: '请详细描述从输入URL到页面渲染完成的完整过程', keyPoints: '网络、浏览器原理、渲染机制', difficulty: 'medium' },
      { title: 'React/Vue 的虚拟 DOM 原理是什么？diff 算法如何工作？', keyPoints: '虚拟DOM、diff算法、性能优化', difficulty: 'hard' },
      { title: '如何做前端性能优化？有哪些指标和工具？', keyPoints: '性能指标、优化策略、监控方案', difficulty: 'medium' },
    ],
    backend: [
      { title: '如何设计一个高并发、高可用的系统架构？', keyPoints: '分布式、微服务、缓存、消息队列', difficulty: 'hard' },
      { title: '数据库索引原理是什么？如何优化慢查询？', keyPoints: 'B+树、执行计划、索引优化', difficulty: 'medium' },
      { title: '分布式事务有哪些解决方案？各有什么优缺点？', keyPoints: '2PC、TCC、最终一致性、Saga', difficulty: 'hard' },
    ],
    product: [
      { title: '如何从0到1设计一个产品功能？讲一下完整流程', keyPoints: '需求分析、方案设计、开发跟进、效果评估', difficulty: 'medium' },
      { title: '如何评估一个产品功能的成功与否？有哪些指标？', keyPoints: '指标体系、数据分析、AB测试', difficulty: 'medium' },
      { title: '当开发和你说做不了时，你会怎么处理？', keyPoints: '沟通能力、优先级管理、方案调整', difficulty: 'hard' },
    ],
    algorithm: [
      { title: '请手写一个快速排序/归并排序，并分析时间复杂度', keyPoints: '算法实现、复杂度分析、稳定性', difficulty: 'medium' },
      { title: '在实际业务中，你是如何应用机器学习算法的？', keyPoints: '业务理解、特征工程、模型优化', difficulty: 'hard' },
    ],
  };

  const jobQuestions = specificQuestions[jobType];
  if (jobQuestions) {
    const difficultyFilter = level === 'junior' ? 1 : level === 'mid' ? 2 : 3;
    jobQuestions.slice(0, difficultyFilter).forEach((q, idx) => {
      questions.push({
        id: `specific-${jobType}-${idx}`,
        title: q.title,
        type: 'TECHNICAL',
        keyPoints: q.keyPoints,
        category: 'TECHNICAL',
        difficulty: q.difficulty
      });
    });
  }

  return questions;
}

/**
 * 生成行为/HR类问题
 */
function generateBehavioralQuestions(
  company: string,
  position: string,
  level: 'junior' | 'mid' | 'senior',
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const templates = QUESTION_TEMPLATES.BEHAVIORAL;
  const hrTemplates = QUESTION_TEMPLATES.HR;

  // 行为问题
  templates.slice(0, 2).forEach((template, idx) => {
    questions.push({
      id: `bhv-${idx}`,
      title: template.title.replace('{company}', company),
      type: 'BEHAVIORAL',
      keyPoints: template.keyPoints,
      category: 'BEHAVIORAL',
      difficulty: template.difficulty
    });
  });

  // HR问题
  hrTemplates.slice(0, 2).forEach((template, idx) => {
    questions.push({
      id: `hr-${idx}`,
      title: template.title
        .replace('{targetCompany}', company)
        .replace('{targetPosition}', position),
      type: 'HR',
      keyPoints: template.keyPoints,
      category: 'HR',
      difficulty: template.difficulty
    });
  });

  // 级别特定问题
  if (level === 'senior') {
    questions.push({
      id: 'bhv-senior-1',
      title: '作为资深人员，你如何带领或影响团队？举例说明',
      type: 'BEHAVIORAL',
      keyPoints: '领导力、影响力、团队协作',
      category: 'BEHAVIORAL',
      difficulty: 'hard'
    });
  }

  return questions.slice(0, count);
}

// ============ 模拟面试组卷配置 ============

export interface MockInterviewConfig {
  questionCount?: number;
  difficulty?: 'all' | 'easy' | 'medium' | 'hard' | 'mixed';
  category?: string | null;
  typeDistribution?: {
    INTRO: number;
    PROJECT: number;
    TECHNICAL: number;
    BEHAVIORAL: number;
    HR: number;
  };
}

// 默认模拟面试配置
const DEFAULT_MOCK_CONFIG: Required<MockInterviewConfig> = {
  questionCount: 8,
  difficulty: 'mixed',
  category: null,
  typeDistribution: {
    INTRO: 1,
    PROJECT: 2,
    TECHNICAL: 3,
    BEHAVIORAL: 1,
    HR: 1,
  },
};

// 从题库中按规则抽取题目
export function generateMockInterviewQuestions(
  config: MockInterviewConfig = {}
): GeneratedQuestion[] {
  const finalConfig = { ...DEFAULT_MOCK_CONFIG, ...config };
  const { questionCount, difficulty, category, typeDistribution } = finalConfig;

  // 引入题库
  const { questions } = require('@/data/questions');

  // 过滤符合条件的题目
  let filteredQuestions = questions;

  // 按岗位分类过滤
  if (category) {
    filteredQuestions = filteredQuestions.filter(
      (q: any) => q.category === category || q.category === 'GENERAL'
    );
  }

  // 按难度过滤（题库中难度是数字：1=easy, 2=medium, 3=hard）
  if (difficulty !== 'all' && difficulty !== 'mixed') {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3,
    };
    const targetDifficulty = difficultyMap[difficulty];
    filteredQuestions = filteredQuestions.filter(
      (q: any) => q.difficulty === targetDifficulty
    );
  }

  // 按题型分组
  const questionsByType: Record<string, any[]> = {
    INTRO: [],
    PROJECT: [],
    TECHNICAL: [],
    BEHAVIORAL: [],
    HR: [],
  };

  filteredQuestions.forEach((q: any) => {
    if (questionsByType[q.type]) {
      questionsByType[q.type].push(q);
    }
  });

  // 打乱数组的辅助函数
  const shuffle = <T,>(arr: T[]): T[] => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // 按题型分布抽取题目
  const selectedQuestions: GeneratedQuestion[] = [];

  // 1. 自我介绍（必考，放在第一位）
  const introQuestions = shuffle(questionsByType.INTRO);
  if (introQuestions.length > 0) {
    const q = introQuestions[0];
    selectedQuestions.push({
      id: q.id,
      title: q.title,
      type: 'INTRO',
      keyPoints: q.keyPoints || '自我介绍、与岗位匹配度',
      category: q.category,
      difficulty: q.difficulty,
    });
  }

  // 2. 项目经历（2题）
  const projectQuestions = shuffle(questionsByType.PROJECT);
  for (let i = 0; i < Math.min(typeDistribution.PROJECT, projectQuestions.length); i++) {
    const q = projectQuestions[i];
    selectedQuestions.push({
      id: q.id,
      title: q.title,
      type: 'PROJECT',
      keyPoints: q.keyPoints || '项目背景、技术栈、个人贡献',
      category: q.category,
      difficulty: q.difficulty,
    });
  }

  // 3. 技术问题（3题，按难度混合）
  let technicalQuestions = shuffle(questionsByType.TECHNICAL);

  // 如果是mixed难度，确保有简单和困难题混合（题库中难度是数字：1=easy, 2=medium, 3=hard）
  if (difficulty === 'mixed') {
    const easyTech = technicalQuestions.filter((q: any) => q.difficulty === 1);
    const mediumTech = technicalQuestions.filter((q: any) => q.difficulty === 2);
    const hardTech = technicalQuestions.filter((q: any) => q.difficulty === 3);

    // 混合策略：1简单 + 1中等 + 1困难
    const mixedTech: any[] = [];
    if (easyTech.length > 0) mixedTech.push(easyTech[0]);
    if (mediumTech.length > 0) mixedTech.push(mediumTech[0]);
    if (hardTech.length > 0) mixedTech.push(hardTech[0]);

    // 如果某种难度不够，用其他难度补充
    while (mixedTech.length < typeDistribution.TECHNICAL && technicalQuestions.length > mixedTech.length) {
      const remaining = technicalQuestions.find(q => !mixedTech.includes(q));
      if (remaining) mixedTech.push(remaining);
    }

    technicalQuestions = mixedTech;
  }

  for (let i = 0; i < Math.min(typeDistribution.TECHNICAL, technicalQuestions.length); i++) {
    const q = technicalQuestions[i];
    selectedQuestions.push({
      id: q.id,
      title: q.title,
      type: 'TECHNICAL',
      keyPoints: q.keyPoints || '技术原理、实际应用',
      category: q.category,
      difficulty: q.difficulty,
    });
  }

  // 4. 行为面试（1题）
  const behavioralQuestions = shuffle(questionsByType.BEHAVIORAL);
  for (let i = 0; i < Math.min(typeDistribution.BEHAVIORAL, behavioralQuestions.length); i++) {
    const q = behavioralQuestions[i];
    selectedQuestions.push({
      id: q.id,
      title: q.title,
      type: 'BEHAVIORAL',
      keyPoints: q.keyPoints || '团队协作、问题解决',
      category: q.category,
      difficulty: q.difficulty,
    });
  }

  // 5. HR面试（1题，放在最后）
  const hrQuestions = shuffle(questionsByType.HR);
  for (let i = 0; i < Math.min(typeDistribution.HR, hrQuestions.length); i++) {
    const q = hrQuestions[i];
    selectedQuestions.push({
      id: q.id,
      title: q.title,
      type: 'HR',
      keyPoints: q.keyPoints || '职业规划、求职动机',
      category: q.category,
      difficulty: q.difficulty,
    });
  }

  // 如果题目数量不够，从题库中随机补充
  if (selectedQuestions.length < questionCount) {
    const remainingNeeded = questionCount - selectedQuestions.length;
    const usedIds = new Set(selectedQuestions.map(q => q.id));
    const remainingQuestions: any[] = shuffle(filteredQuestions.filter((q: any) => !usedIds.has(q.id)));

    for (let i = 0; i < Math.min(remainingNeeded, remainingQuestions.length); i++) {
      const q = remainingQuestions[i];
      selectedQuestions.push({
        id: q.id,
        title: q.title,
        type: q.type,
        keyPoints: q.keyPoints || '面试准备',
        category: q.category,
        difficulty: q.difficulty,
      });
    }
  }

  // 限制数量并重新编号
  return selectedQuestions.slice(0, questionCount).map((q, idx) => ({
    ...q,
    id: `mock-${idx + 1}`,
  }));
}

// ============ 主生成函数 ============

/**
 * 生成面试题
 */
export function generateInterviewQuestions(options: GenerateOptions): GeneratedQuestion[] {
  const { jdText, resumeText = '', questionCount = 5 } = options;

  // 1. 解析基础信息
  const jobType = detectJobType(jdText);
  const company = extractCompany(jdText);
  const position = extractPosition(jdText);
  const level = detectExperienceLevel(resumeText || jdText);

  // 2. 提取技能
  const jdSkills = extractSkills(jdText);
  const resumeSkills = extractSkills(resumeText);

  // 3. 提取项目经历
  const projects = resumeText ? extractProjects(resumeText) : [];

  // 4. 按策略生成题目
  const questions: GeneratedQuestion[] = [];

  // 策略1: 自我介绍（必考）
  questions.push({
    id: 'intro-1',
    title: `请做个自我介绍，重点突出你和${position}岗位的匹配度`,
    type: 'INTRO',
    keyPoints: '核心优势、相关经验、与岗位匹配点',
    category: 'INTRO',
    difficulty: 'easy'
  });

  // 策略2: 项目深挖（如果有简历）
  if (projects.length > 0) {
    questions.push(...generateProjectQuestions(projects, 2));
  }

  // 策略3: 技术问题
  questions.push(...generateTechnicalQuestions(jdSkills, resumeSkills, jobType, level, 3));

  // 策略4: 行为和HR问题
  questions.push(...generateBehavioralQuestions(company, position, level, 2));

  // 5. 去重并排序
  const uniqueQuestions = Array.from(
    new Map(questions.map(q => [q.title, q])).values()
  );

  // 按难度排序：easy -> medium -> hard
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  uniqueQuestions.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

  // 6. 限制数量
  return uniqueQuestions.slice(0, questionCount).map((q, idx) => ({
    ...q,
    id: `ai-${idx + 1}`
  }));
}

/**
 * 获取生成建议
 */
export function getGenerationTips(jdText: string, resumeText?: string): string[] {
  const tips: string[] = [];

  const jdSkills = extractSkills(jdText);
  const resumeSkills = resumeText ? extractSkills(resumeText) : [];
  const { matched, missing } = calculateSkillMatch(jdSkills, resumeSkills);

  if (missing.length > 0) {
    tips.push(`JD要求的 ${missing.slice(0, 3).join('、')} 技能在你简历中体现较少，建议提前准备`);
  }

  if (matched.length > 0) {
    tips.push(`你的核心技能 ${matched.slice(0, 3).join('、')} 与岗位匹配度较高，可以重点准备`);
  }

  const level = detectExperienceLevel(resumeText || jdText);
  if (level === 'senior') {
    tips.push('作为资深候选人，面试会更关注架构设计、技术选型和团队影响力');
  } else if (level === 'junior') {
    tips.push('作为初级候选人，面试会更关注基础知识、学习能力和项目经历');
  }

  return tips;
}
