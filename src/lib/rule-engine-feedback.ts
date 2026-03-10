/**
 * 增强版规则引擎简化反馈
 * 为免费用户提供有价值的基于规则的分析
 */

export interface SimplifiedFeedback {
  basicScore: number; // 0-100 基础评分
  keyPointsCovered: string[]; // 覆盖的关键点（带图标）
  keyPointsMissed: string[]; // 缺失的关键点
  lengthAssessment: "too_short" | "good" | "too_long";
  lengthMessage: string;
  structureHints: string[]; // 结构建议
  generalTips: string[]; // 通用建议
  upgradePrompt: string; // 个性化升级提示
  // 新增字段
  strengthSummary?: string; // 优势总结
  improvementPriority?: string[]; // 优先改进点（高优先级）
  starCompleteness?: { // STAR法则完整性
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  hasMetrics?: boolean; // 是否包含量化数据
  professionalTerms?: number; // 专业术语数量
}

interface QuestionInfo {
  keyPoints?: string;
  framework?: string;
  referenceAnswer?: string;
  type?: string;
}

// ============== 同义词库 ==============
const SYNONYM_LIBRARY: Record<string, string[]> = {
  // 软技能
  "责任心": ["负责任", "尽职", "认真", "可靠", "靠谱", "担当"],
  "团队协作": ["团队合作", "协同", "配合", "沟通", "协作能力", "团队精神"],
  "沟通能力": ["表达能力", "交流", "沟通技巧", "协调", "汇报"],
  "学习能力": ["学习意愿", "快速学习", "自学", "上手", "接受新知识"],
  "问题解决": ["解决问题", "攻克", "处理", "应对", "克服困难"],
  "时间管理": ["时间规划", "效率", "任务管理", "优先级"],
  "领导力": ["带领", "管理", "领导能力", "组织", "协调团队"],

  // 技术相关
  "项目管理": ["项目负责", "项目推进", "项目交付", "项目协调", "PM"],
  "架构设计": ["系统设计", "技术方案", "架构", "设计模式", "技术选型"],
  "性能优化": ["优化", "提升性能", "加速", "改善效率", "性能提升"],
  "代码质量": ["代码规范", "可维护性", "重构", "代码优化", "质量把控"],
  "技术难点": ["难题", "挑战", "技术瓶颈", "复杂问题"],

  // 成果相关
  "用户增长": ["用户提升", "用户量增加", "DAU", "MAU", "增长"],
  "效率提升": ["提升效率", "加速", "节省时间", "优化流程"],
  "成本降低": ["节约成本", "降本", "减少开支", "成本优化"],
  "质量提升": ["提高质量", "改善质量", "质量改进", "bug率降低"],
};

// ============== 专业术语库 ==============
const PROFESSIONAL_TERMS = [
  // 技术通用
  "架构", "设计模式", "重构", "解耦", "高内聚低耦合",
  "可扩展性", "可维护性", "鲁棒性", "容错", "降级",

  // 前端
  "组件化", "模块化", "响应式", "兼容性", "性能优化",
  "虚拟DOM", "状态管理", "路由", "打包", "tree-shaking",

  // 后端
  "微服务", "分布式", "负载均衡", "缓存", "消息队列",
  "数据库优化", "索引", "事务", "并发", "异步",

  // 项目管理
  "敏捷开发", "迭代", "需求分析", "技术评审", "code review",
  "CI/CD", "测试覆盖率", "灰度发布", "AB测试",

  // 产品相关
  "用户体验", "转化率", "留存率", "用户画像", "MVP",
  "数据驱动", "闭环", "痛点", "场景", "需求优先级",
];

/**
 * 从关键点字符串中提取关键词列表
 */
function extractKeywords(keyPoints: string): string[] {
  const points = keyPoints.split(/[,，、；;]/);
  return points.map((p) => p.trim()).filter((p) => p.length > 0);
}

/**
 * 增强的关键词匹配（支持同义词）
 */
function containsKeyword(answer: string, keyword: string): boolean {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();

  // 1. 直接包含
  if (normalizedAnswer.includes(normalizedKeyword)) {
    return true;
  }

  // 2. 检查同义词
  const synonyms = SYNONYM_LIBRARY[keyword] || [];
  if (synonyms.some(syn => normalizedAnswer.includes(syn.toLowerCase()))) {
    return true;
  }

  // 3. 提取核心词（去除常见修饰词）
  const coreWords = normalizedKeyword
    .replace(
      /的|和|与|以及|能力|经验|技能|方面|相关|具备|掌握|熟悉|了解|理解/g,
      ""
    )
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  // 检查核心词是否出现
  return coreWords.some((word) => normalizedAnswer.includes(word));
}

/**
 * 检测量化数据
 */
function detectMetrics(answer: string): {
  hasMetrics: boolean;
  examples: string[];
} {
  const metricPatterns = [
    /\d+%/g,
    /\d+倍/g,
    /\d+[万亿]/g,
    /\d+[个|名|次|项]/g,
    /提升了?\d+/g,
    /降低了?\d+/g,
    /增长了?\d+/g,
    /从\d+.*?到\d+/g,
  ];

  const examples: string[] = [];
  for (const pattern of metricPatterns) {
    const matches = answer.match(pattern);
    if (matches) {
      examples.push(...matches.slice(0, 3)); // 最多取3个示例
    }
  }

  return {
    hasMetrics: examples.length > 0,
    examples: [...new Set(examples)], // 去重
  };
}

/**
 * 检测专业术语使用
 */
function detectProfessionalTerms(answer: string): number {
  let count = 0;
  const normalizedAnswer = answer.toLowerCase();

  for (const term of PROFESSIONAL_TERMS) {
    if (normalizedAnswer.includes(term.toLowerCase())) {
      count++;
    }
  }

  return count;
}

/**
 * 增强的STAR法则检测
 */
function detectSTAR(answer: string): {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  score: number;
} {
  const patterns = {
    situation: [
      /背景|情况|当时|项目中|在.*?(公司|团队|项目)/i,
      /面临|遇到|出现了/i,
    ],
    task: [
      /任务|目标|需要|要求|负责/i,
      /我的职责|我需要/i,
    ],
    action: [
      /我|采取|使用|实施|解决|做了|通过/i,
      /首先|然后|接着|最后/i,
      /设计|开发|实现|优化|改进/i,
    ],
    result: [
      /结果|成效|最终|达成|完成/i,
      /提升|降低|增长|改善|优化了/i,
      /成功|顺利|按时|如期/i,
    ],
  };

  const detection = {
    situation: patterns.situation.some(p => p.test(answer)),
    task: patterns.task.some(p => p.test(answer)),
    action: patterns.action.some(p => p.test(answer)),
    result: patterns.result.some(p => p.test(answer)),
    score: 0,
  };

  // 计算STAR完整度得分
  const completeness = [
    detection.situation,
    detection.task,
    detection.action,
    detection.result,
  ].filter(Boolean).length;

  detection.score = completeness * 5; // 每个维度5分，满分20

  return detection;
}

/**
 * 增强的结构检查
 */
function checkStructure(
  answer: string,
  framework?: string,
  type?: string
): {
  hints: string[];
  score: number;
  starCompleteness?: any;
  hasMetrics: boolean;
  professionalTerms: number;
} {
  const hints: string[] = [];
  let score = 0;

  // 1. 检查段落结构
  const paragraphs = answer.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 2) {
    score += 5;
  } else {
    hints.push("💡 建议分段组织回答，让逻辑更清晰");
  }

  // 2. 检查列表结构
  const hasNumberedList = /[1-9][.、)]/m.test(answer);
  const hasBulletPoints = /^[-•·]/m.test(answer);
  if (hasNumberedList || hasBulletPoints) {
    score += 5;
  } else if (type !== "INTRO") {
    hints.push("💡 使用数字列表或要点可以让回答更有条理");
  }

  // 3. 检测量化数据
  const metricsResult = detectMetrics(answer);
  if (metricsResult.hasMetrics) {
    score += 10;
  } else if (type === "PROJECT" || type === "BEHAVIORAL") {
    hints.push("⚠️ 缺少量化数据（如：提升X%、节省X小时），会降低说服力");
  }

  // 4. 检测专业术语
  const professionalTerms = detectProfessionalTerms(answer);
  if (professionalTerms >= 3) {
    score += 5;
  } else if (type === "TECHNICAL") {
    hints.push("💡 适当使用专业术语可以体现技术深度");
  }

  // 5. 检测逻辑连接词
  const hasLogicWords = /(首先|其次|然后|最后|因此|所以|综上)/.test(answer);
  if (hasLogicWords) {
    score += 5;
  }

  // 6. STAR法则检测
  let starCompleteness;
  if (framework?.toLowerCase().includes("star") || type === "PROJECT" || type === "BEHAVIORAL") {
    starCompleteness = detectSTAR(answer);
    score += starCompleteness.score;

    const missing = [];
    if (!starCompleteness.situation) missing.push("情境(Situation)");
    if (!starCompleteness.task) missing.push("任务(Task)");
    if (!starCompleteness.action) missing.push("行动(Action)");
    if (!starCompleteness.result) missing.push("结果(Result)");

    if (missing.length > 0) {
      hints.push(`⚠️ STAR结构不完整，缺少：${missing.join("、")}`);
    }
  }

  return {
    hints,
    score: Math.min(30, score),
    starCompleteness,
    hasMetrics: metricsResult.hasMetrics,
    professionalTerms,
  };
}

/**
 * 题目类型专项规则
 */
const TYPE_SPECIFIC_RULES: Record<string, {
  required: string[];
  bonus: string[];
  minLength: number;
  maxLength: number;
  tips: string[];
}> = {
  INTRO: {
    required: ["教育背景", "工作经验", "核心优势"],
    bonus: ["职业目标", "个人特点", "岗位匹配"],
    minLength: 150,
    maxLength: 500,
    tips: [
      "开头简洁有力，30秒内抓住面试官注意力",
      "重点突出与目标岗位最相关的经验",
      "结尾呼应岗位需求，展现求职动机",
    ],
  },
  PROJECT: {
    required: ["项目背景", "个人职责", "具体成果"],
    bonus: ["技术难点", "解决方案", "团队协作", "量化数据"],
    minLength: 200,
    maxLength: 800,
    tips: [
      "使用STAR法则完整描述项目经历",
      "突出个人贡献，避免用'我们'代替'我'",
      "用数据说话：性能提升X%、用户增长X倍",
    ],
  },
  TECHNICAL: {
    required: ["概念理解", "实际应用"],
    bonus: ["原理深度", "对比分析", "最佳实践", "使用场景"],
    minLength: 100,
    maxLength: 600,
    tips: [
      "先给出核心答案，再展开解释（金字塔原理）",
      "结合具体场景或项目经验说明",
      "体现技术深度，避免停留在表面概念",
    ],
  },
  BEHAVIORAL: {
    required: ["具体事例", "处理方式", "结果反思"],
    bonus: ["量化成果", "经验总结", "成长体现"],
    minLength: 150,
    maxLength: 700,
    tips: [
      "用STAR法则讲述真实经历，避免泛泛而谈",
      "展现问题解决能力和应变能力",
      "体现成长和反思，说明从中学到了什么",
    ],
  },
  HR: {
    required: ["真诚态度", "职业规划"],
    bonus: ["自我认知", "求职动机", "稳定性"],
    minLength: 100,
    maxLength: 400,
    tips: [
      "回答要真诚但有技巧，展现积极态度",
      "职业规划要合理，与岗位发展路径契合",
      "薪资期望要有依据，体现自我价值认知",
    ],
  },
};

/**
 * 生成个性化升级提示
 */
function generateUpgradePrompt(
  score: number,
  missed: string[],
  structureHints: string[],
  hasMetrics: boolean,
  type?: string
): string {
  const basePrompts = {
    high: "您的回答已经很不错！",
    medium: "您的回答有一定基础，",
    low: "您的回答还有较大提升空间。",
  };

  const level = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  const base = basePrompts[level];

  const benefits = [];

  // 根据缺失内容推荐AI功能
  if (missed.length > 0) {
    benefits.push("✨ 针对缺失关键点的具体补充建议");
  }

  if (structureHints.length > 0) {
    benefits.push("✨ 结构优化方案和改写示例");
  }

  if (!hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL")) {
    benefits.push("✨ 如何用数据量化成果的指导");
  }

  if (score < 80) {
    benefits.push("✨ 参考同类优秀回答，学习表达技巧");
    benefits.push("✨ 四维能力评估，定位具体薄弱点");
  }

  benefits.push("✨ AI教练逐句点评，个性化改进方案");

  return `${base}\n\n解锁 AI 深度分析，您将获得：\n${benefits.join("\n")}`;
}

/**
 * 生成优势总结
 */
function generateStrengthSummary(
  covered: string[],
  hasMetrics: boolean,
  professionalTerms: number,
  starCompleteness?: any
): string {
  const strengths = [];

  if (covered.length >= 3) {
    strengths.push("关键点覆盖较为全面");
  }

  if (hasMetrics) {
    strengths.push("使用了量化数据，增强了说服力");
  }

  if (professionalTerms >= 3) {
    strengths.push("体现了一定的专业性");
  }

  if (starCompleteness &&
      starCompleteness.situation &&
      starCompleteness.task &&
      starCompleteness.action &&
      starCompleteness.result) {
    strengths.push("STAR结构完整");
  }

  return strengths.length > 0
    ? strengths.join("；")
    : "回答展现了基本素养";
}

/**
 * 生成优先改进点
 */
function generateImprovementPriority(
  missed: string[],
  structureHints: string[],
  hasMetrics: boolean,
  starCompleteness?: any,
  type?: string
): string[] {
  const priorities = [];

  // 高优先级：缺失核心关键点
  if (missed.length > 0) {
    const top3 = missed.slice(0, 3);
    priorities.push(`补充关键内容：${top3.join("、")}`);
  }

  // 高优先级：STAR不完整（针对项目/行为题）
  if (starCompleteness && (type === "PROJECT" || type === "BEHAVIORAL")) {
    const missing = [];
    if (!starCompleteness.result) missing.push("量化结果");
    if (!starCompleteness.action) missing.push("具体行动");
    if (missing.length > 0) {
      priorities.push(`完善STAR结构：重点补充${missing.join("和")}`);
    }
  }

  // 中优先级：缺少量化数据
  if (!hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL")) {
    priorities.push("添加量化数据（如：性能提升X%，用户增长X倍）");
  }

  // 中优先级：结构问题
  if (structureHints.length > 0) {
    priorities.push(structureHints[0]); // 取第一个建议
  }

  return priorities.slice(0, 3); // 最多3个优先改进点
}

/**
 * 生成增强版规则引擎简化反馈
 */
export function generateRuleBasedFeedback(
  answer: string,
  question: QuestionInfo
): SimplifiedFeedback {
  const type = question.type;
  const typeRules = type ? TYPE_SPECIFIC_RULES[type] : null;

  // 1. 关键点覆盖分析（增强版）
  const keyPointsList = question.keyPoints
    ? extractKeywords(question.keyPoints)
    : (typeRules?.required || []);

  const covered: string[] = [];
  const missed: string[] = [];

  for (const point of keyPointsList) {
    if (containsKeyword(answer, point)) {
      covered.push(`✓ ${point}`); // 添加勾选图标
    } else {
      missed.push(point);
    }
  }

  // 2. 长度评估（根据题型调整标准）
  const wordCount = answer.length;
  const minLength = typeRules?.minLength || 100;
  const maxLength = typeRules?.maxLength || 1000;

  let lengthAssessment: "too_short" | "good" | "too_long";
  let lengthMessage: string;

  if (wordCount < minLength * 0.5) {
    lengthAssessment = "too_short";
    lengthMessage = `回答过于简短（${wordCount}字），建议至少${minLength}字以充分展开`;
  } else if (wordCount < minLength) {
    lengthAssessment = "too_short";
    lengthMessage = `回答偏短（${wordCount}字），建议补充到${minLength}字左右`;
  } else if (wordCount > maxLength * 1.5) {
    lengthAssessment = "too_long";
    lengthMessage = `回答较长（${wordCount}字），建议精简到${maxLength}字内，突出重点`;
  } else if (wordCount > maxLength) {
    lengthAssessment = "too_long";
    lengthMessage = `回答稍长（${wordCount}字），注意控制时间，避免冗余`;
  } else {
    lengthAssessment = "good";
    lengthMessage = `回答长度适中（${wordCount}字）`;
  }

  // 3. 增强的结构检查
  const structureResult = checkStructure(answer, question.framework, type);

  // 4. 计算基础分数（优化后的算法）
  // 关键点覆盖率 50%
  const coverageRate = keyPointsList.length > 0
    ? covered.length / keyPointsList.length
    : 0.6;
  let coverageScore = Math.round(coverageRate * 50);

  // 如果包含bonus关键点，额外加分
  if (typeRules?.bonus) {
    const bonusPoints = typeRules.bonus.filter(b =>
      containsKeyword(answer, b)
    ).length;
    coverageScore += Math.min(10, bonusPoints * 3);
  }

  // 长度分数 20%
  const lengthScore = lengthAssessment === "good" ? 20 : 10;

  // 结构分数 30%
  const structureScore = structureResult.score;

  const basicScore = Math.min(
    100,
    Math.max(0, coverageScore + lengthScore + structureScore)
  );

  // 5. 生成优势总结
  const strengthSummary = generateStrengthSummary(
    covered,
    structureResult.hasMetrics,
    structureResult.professionalTerms,
    structureResult.starCompleteness
  );

  // 6. 生成优先改进点
  const improvementPriority = generateImprovementPriority(
    missed,
    structureResult.hints,
    structureResult.hasMetrics,
    structureResult.starCompleteness,
    type
  );

  // 7. 通用建议（根据题型）
  const generalTips = typeRules?.tips || [
    "回答要有条理，逻辑清晰",
    "结合自身经历和具体案例",
  ];

  // 8. 个性化升级提示
  const upgradePrompt = generateUpgradePrompt(
    basicScore,
    missed,
    structureResult.hints,
    structureResult.hasMetrics,
    type
  );

  return {
    basicScore,
    keyPointsCovered: covered,
    keyPointsMissed: missed,
    lengthAssessment,
    lengthMessage,
    structureHints: structureResult.hints,
    generalTips,
    upgradePrompt,
    strengthSummary,
    improvementPriority,
    starCompleteness: structureResult.starCompleteness,
    hasMetrics: structureResult.hasMetrics,
    professionalTerms: structureResult.professionalTerms,
  };
}

/**
 * 为面试会话生成简化的整体反馈
 */
export function generateSimplifiedOverallFeedback(
  answers: Array<{
    questionTitle: string;
    questionType?: string;
    answer: string;
    keyPoints?: string;
  }>
): {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  upgradePrompt: string;
} {
  if (answers.length === 0) {
    return {
      overallScore: 0,
      summary: "暂无作答记录",
      strengths: [],
      improvements: [],
      upgradePrompt: "开通会员，获取 AI 深度分析",
    };
  }

  // 计算每道题的简化反馈
  const feedbacks = answers.map((a) =>
    generateRuleBasedFeedback(a.answer || "", {
      keyPoints: a.keyPoints,
      type: a.questionType,
    })
  );

  // 计算平均分
  const overallScore = Math.round(
    feedbacks.reduce((sum, f) => sum + f.basicScore, 0) / feedbacks.length
  );

  // 汇总优点和不足
  const strengths: string[] = [];
  const improvements: string[] = [];

  // 1. 关键点覆盖分析
  const allCovered = feedbacks.flatMap((f) => f.keyPointsCovered);
  const allMissed = feedbacks.flatMap((f) => f.keyPointsMissed);
  const totalKeyPoints = allCovered.length + allMissed.length;
  const coverageRate = totalKeyPoints > 0 ? allCovered.length / totalKeyPoints : 0;

  if (coverageRate >= 0.7) {
    strengths.push("关键点覆盖全面，准备充分");
  } else if (coverageRate >= 0.5) {
    improvements.push(`关键点覆盖率${Math.round(coverageRate * 100)}%，建议针对性补强`);
  } else {
    improvements.push("关键点覆盖不足，建议系统复习题目要点");
  }

  // 2. 量化数据使用
  const metricsCount = feedbacks.filter(f => f.hasMetrics).length;
  const metricsRate = metricsCount / feedbacks.length;

  if (metricsRate >= 0.6) {
    strengths.push("善于使用数据量化成果");
  } else if (metricsRate < 0.3) {
    improvements.push("缺少量化数据，建议补充具体数字和成果");
  }

  // 3. 结构完整性
  const wellStructuredCount = feedbacks.filter(
    f => f.structureHints.length === 0
  ).length;

  if (wellStructuredCount >= feedbacks.length * 0.7) {
    strengths.push("回答结构清晰，条理分明");
  } else if (wellStructuredCount < feedbacks.length * 0.3) {
    improvements.push("注意组织回答结构，建议使用STAR法则或分点叙述");
  }

  // 4. 专业性
  const avgProfessionalTerms = feedbacks.reduce(
    (sum, f) => sum + (f.professionalTerms || 0),
    0
  ) / feedbacks.length;

  if (avgProfessionalTerms >= 3) {
    strengths.push("体现了良好的专业素养");
  }

  // 5. 回答长度
  const avgLength = answers.reduce(
    (sum, a) => sum + (a.answer?.length || 0),
    0
  ) / answers.length;

  if (avgLength >= 200 && avgLength <= 600) {
    strengths.push("回答详略得当，内容充实");
  } else if (avgLength < 100) {
    improvements.push("回答普遍偏短，建议增加具体案例和细节");
  }

  // 生成总结
  let summary: string;
  if (overallScore >= 80) {
    summary = `整体表现优秀（${overallScore}分）！准备充分，表达清晰，具备较强的面试竞争力。`;
  } else if (overallScore >= 65) {
    summary = `整体表现良好（${overallScore}分），基础扎实，仍有${100-overallScore}分的提升空间。`;
  } else if (overallScore >= 50) {
    summary = `整体表现中等（${overallScore}分），建议针对薄弱点专项练习。`;
  } else {
    summary = `整体表现有待提高（${overallScore}分），建议系统复习并多加练习。`;
  }

  // 个性化升级提示
  const upgradePrompt = overallScore >= 75
    ? `您的面试准备已经很不错！解锁 AI 深度分析，让优秀更进一步：\n✨ 岗位匹配度专业评估\n✨ 个性化提升建议和话术优化\n✨ 模拟真实面试场景的追问训练`
    : `想知道如何从${overallScore}分提升到90+分？AI 深度分析为您提供：\n✨ 逐题详细点评和改进方案\n✨ 四维能力评估，定位具体短板\n✨ 参考优秀回答，学习表达技巧`;

  return {
    overallScore,
    summary,
    strengths,
    improvements,
    upgradePrompt,
  };
}
