/**
 * 增强版规则引擎反馈生成器
 * Phase-1 即时结果：专业、有内容、可操作的分析
 */

export interface SimplifiedFeedback {
  basicScore: number;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  lengthAssessment: "too_short" | "good" | "too_long";
  lengthMessage: string;
  structureHints: string[];
  generalTips: string[];
  upgradePrompt: string;
  strengthSummary?: string;
  improvementPriority?: string[];
  starCompleteness?: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  hasMetrics?: boolean;
  professionalTerms?: number;
  // Phase-1 rich output（用于 AI feedback JSON 格式）
  richGoodPoints: string[];
  richImprovePoints: string[];
  coachMessage: string;
  topSuggestion: string;
}

interface QuestionInfo {
  keyPoints?: string;
  framework?: string;
  referenceAnswer?: string;
  type?: string;
}

// ============== 同义词库 ==============
const SYNONYM_LIBRARY: Record<string, string[]> = {
  "责任心": ["负责任", "尽职", "认真", "可靠", "靠谱", "担当"],
  "团队协作": ["团队合作", "协同", "配合", "沟通", "协作能力", "团队精神"],
  "沟通能力": ["表达能力", "交流", "沟通技巧", "协调", "汇报"],
  "学习能力": ["学习意愿", "快速学习", "自学", "上手", "接受新知识"],
  "问题解决": ["解决问题", "攻克", "处理", "应对", "克服困难"],
  "时间管理": ["时间规划", "效率", "任务管理", "优先级"],
  "领导力": ["带领", "管理", "领导能力", "组织", "协调团队"],
  "项目管理": ["项目负责", "项目推进", "项目交付", "项目协调", "PM"],
  "架构设计": ["系统设计", "技术方案", "架构", "设计模式", "技术选型"],
  "性能优化": ["优化", "提升性能", "加速", "改善效率", "性能提升"],
  "代码质量": ["代码规范", "可维护性", "重构", "代码优化", "质量把控"],
  "技术难点": ["难题", "挑战", "技术瓶颈", "复杂问题"],
  "用户增长": ["用户提升", "用户量增加", "DAU", "MAU", "增长"],
  "效率提升": ["提升效率", "加速", "节省时间", "优化流程"],
  "成本降低": ["节约成本", "降本", "减少开支", "成本优化"],
};

// ============== 专业术语库 ==============
const PROFESSIONAL_TERMS = [
  "架构", "设计模式", "重构", "解耦", "高内聚低耦合",
  "可扩展性", "可维护性", "鲁棒性", "容错", "降级",
  "组件化", "模块化", "响应式", "兼容性", "性能优化",
  "虚拟DOM", "状态管理", "路由", "打包", "tree-shaking",
  "微服务", "分布式", "负载均衡", "缓存", "消息队列",
  "数据库优化", "索引", "事务", "并发", "异步",
  "敏捷开发", "迭代", "需求分析", "技术评审", "code review",
  "CI/CD", "测试覆盖率", "灰度发布", "AB测试",
  "用户体验", "转化率", "留存率", "用户画像", "MVP",
  "数据驱动", "闭环", "痛点", "场景", "需求优先级",
];

// ============== 覆盖要点的正向反馈模板 ==============
const COVERED_POINT_TEMPLATES: Record<string, string> = {
  "教育背景": "清晰介绍了教育背景，为面试官建立了基本认知框架",
  "工作经验": "系统梳理了工作经历，展示了清晰的职业发展脉络",
  "核心优势": "有效突出了个人核心竞争力，让面试官快速了解您的价值主张",
  "职业目标": "明确表达了职业规划方向，体现了较强的目标感与求职动机",
  "个人特点": "展现了独特的个人特质，有助于在众多候选人中形成差异化印象",
  "岗位匹配": "清晰阐述了个人背景与岗位的匹配点，逻辑说服力较强",
  "项目背景": "清晰交代了项目背景与规模，帮助面试官快速建立情境认知",
  "个人职责": "明确说明了个人职责范围，展现了主动担当与参与深度",
  "具体成果": "有效呈现了项目可交付成果，体现了实际贡献价值",
  "技术难点": "主动提及了技术挑战，展示了解决复杂问题的能力与经历",
  "解决方案": "详述了技术解决方案，体现了系统化的工程思维与执行力",
  "团队协作": "体现了良好的跨团队协作意识与沟通协调能力",
  "量化数据": "使用了量化指标来呈现成果，以数据说话，增强了可信度",
  "概念理解": "对核心概念有准确清晰的理解，基础认知扎实",
  "实际应用": "结合了实际项目场景来说明，体现了知识的落地应用能力",
  "原理深度": "深入分析了底层原理，展现出超出表面认知的技术深度",
  "对比分析": "进行了合理的技术方案对比，体现了综合判断与选型能力",
  "最佳实践": "提及了行业最佳实践规范，展示了良好的工程化思维",
  "使用场景": "清晰说明了技术的适用场景，体现了对技术边界的理解",
  "具体事例": "以真实工作案例支撑回答，内容具体可信，说服力强",
  "处理方式": "详述了处理问题的具体步骤，展示了结构化的问题解决能力",
  "结果反思": "主动进行经验反思与总结，体现了成长型思维",
  "经验总结": "有效总结了经验教训，展示了从实践中持续学习和迭代的能力",
  "成长体现": "清晰展现了从经历中的成长与蜕变，体现了职业成熟度",
  "真诚态度": "回答态度真诚自然，给人留下真实可信的良好印象",
  "职业规划": "职业规划清晰合理，与目标岗位发展方向有较好契合",
  "自我认知": "展现了清晰的自我认知，对自身优势与不足有准确把握",
  "求职动机": "充分表达了求职动机，让面试官感受到您的主动意愿",
  "稳定性": "有效传递了稳定性与长期发展意愿，增强了面试官的信心",
  "责任心": "体现了较强的责任感与认真负责的工作态度",
  "团队合作": "强调了团队合作精神，展示了良好的协作与配合能力",
  "沟通能力": "展现了清晰流畅的表达与沟通能力",
  "学习能力": "体现了积极的学习意愿与快速吸收新知识的能力",
  "问题解决": "展示了系统性的问题分析与解决能力",
  "时间管理": "体现了良好的时间规划与任务优先级判断能力",
  "领导力": "展现了带团队和组织协调的领导力经验",
  "项目管理": "体现了对项目全流程的规划与把控能力",
  "架构设计": "展示了系统架构设计与技术选型的实践经验",
  "性能优化": "体现了性能分析诊断与优化的实际工程经验",
  "代码质量": "重视代码质量与工程规范，体现了较高的专业素养",
};

// ============== 缺失要点的改进建议模板 ==============
const MISSED_POINT_TEMPLATES: Record<string, string> = {
  "教育背景": "建议简要说明学历背景（院校/专业），2-3句即可，为面试官建立基本认知",
  "工作经验": "建议按相关性而非时间顺序梳理工作经历，重点突出与应聘岗位匹配度最高的经验",
  "核心优势": "建议提炼2-3个与岗位直接相关的核心能力亮点（如「精通X」「有Y年Z经验」），避免泛泛而谈",
  "职业目标": "建议在结尾补充求职动机和发展方向（如「希望在贵司X业务方向继续深耕」），体现规划感",
  "个人特点": "建议用一个具体小案例展示您区别于其他候选人的独特工作风格或思维特质",
  "岗位匹配": "建议明确点出您的背景与此岗位的契合点，回答「为什么应该选我」这个核心问题",
  "项目背景": "建议先交代项目背景（所在团队、规模、核心目标），帮助面试官快速进入情境",
  "个人职责": "建议明确您在项目中的具体职责，用「我负责…」代替「我们做了…」，突出个人贡献",
  "具体成果": "建议补充项目最终成果，即便没有数据，也需说明「解决了什么问题」「达成了什么目标」",
  "技术难点": "建议主动提及您在项目中克服的技术挑战，这是体现技术深度的重要机会",
  "解决方案": "建议详述解决方案的决策过程（为何选此方案、排除了哪些选项），展示技术判断力",
  "团队协作": "建议补充跨团队协作或沟通协调的具体经历，如何推动多方达成共识",
  "量化数据": "建议用数字量化成果（如「性能提升30%」「DAU增长2万」），用数据代替模糊的「大幅提升」",
  "概念理解": "建议先给出一句简洁准确的核心定义，再逐步展开，让回答层次分明",
  "实际应用": "建议结合您在项目中实际使用该技术的场景说明，「用过」与「知道」在面试官眼中差异很大",
  "原理深度": "建议适当延伸至底层原理（如数据结构、算法复杂度、框架源码机制等），体现技术深度",
  "对比分析": "建议与同类方案进行对比（如A vs B的优缺点、适用场景差异），体现综合判断能力",
  "最佳实践": "建议补充该技术的工程化最佳实践或常见踩坑，展示实际落地经验",
  "使用场景": "建议明确在什么条件下选用此技术、有哪些限制，体现对技术边界的清晰认知",
  "具体事例": "建议从真实工作经历中选取一个具体事件，避免泛泛描述，用「有一次…」引入",
  "处理方式": "建议细化处理过程：具体采取了哪些步骤、遇到阻力如何克服、关键决策点如何判断",
  "结果反思": "建议补充对该经历的反思：学到了什么、如何在后续工作中应用了这些经验",
  "经验总结": "建议总结经验教训及后续改进措施，体现从实践中主动迭代的成长型思维",
  "成长体现": "建议说明这段经历如何具体改变了您的工作方式或思维模式，展现真实成长",
  "真诚态度": "建议保持回答的真实感，结合个人经历支撑观点，避免过于套路化或夸大",
  "职业规划": "建议给出清晰的1-3年规划，结合此岗位的晋升路径，体现目标感与方向感",
  "自我认知": "建议坦诚说明自身优势与待提升方向，清晰的自我认知是成熟职业素养的体现",
  "求职动机": "建议说明为何选择这家公司和这个岗位，结合公司具体特点体现针对性",
  "稳定性": "建议通过长期目标和发展规划传递稳定性信号，让面试官对您的留任意愿有信心",
  "责任心": "建议用一个具体案例体现责任感，如主动承担困难任务或在出现问题时如何负责任地应对",
  "团队合作": "建议补充与他人协作的具体经历，说明您在团队中扮演的角色及贡献",
  "沟通能力": "建议加入与跨部门沟通或向上汇报的具体经历，体现协调推进的沟通能力",
  "学习能力": "建议举例说明快速掌握新技能的经历，如「两周内自学X并成功应用于项目」",
  "问题解决": "建议描述一个具体问题及您的分析与解决过程，体现结构化思维",
  "时间管理": "建议补充多任务并行或高优先级冲突的处理案例，体现时间规划和取舍能力",
  "领导力": "建议提及带领团队或主导项目的经历，说明如何推动决策和激励成员",
  "项目管理": "建议补充项目管理实践，如如何把控进度、协调资源、识别和处理风险",
  "架构设计": "建议补充参与架构设计或技术选型的经历，包括决策依据和架构演进过程",
  "性能优化": "建议补充性能优化的具体案例，包括问题发现路径、优化手段及可量化的效果",
  "代码质量": "建议提及代码规范、Code Review或系统性重构的实践，体现工程化意识",
};

// ============== 类型专项规则 ==============
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
      "突出个人贡献，避免用「我们」代替「我」",
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

function extractKeywords(keyPoints: string): string[] {
  const points = keyPoints.split(/[,，、；;]/);
  return points.map((p) => p.trim()).filter((p) => p.length > 0);
}

function containsKeyword(answer: string, keyword: string): boolean {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();

  if (normalizedAnswer.includes(normalizedKeyword)) return true;

  const synonyms = SYNONYM_LIBRARY[keyword] || [];
  if (synonyms.some((syn) => normalizedAnswer.includes(syn.toLowerCase()))) return true;

  const coreWords = normalizedKeyword
    .replace(/的|和|与|以及|能力|经验|技能|方面|相关|具备|掌握|熟悉|了解|理解/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  return coreWords.some((word) => normalizedAnswer.includes(word));
}

function detectMetrics(answer: string): { hasMetrics: boolean; examples: string[] } {
  const metricPatterns = [
    /\d+%/g,
    /\d+倍/g,
    /\d+[万亿]/g,
    /\d+[个名次项]/g,
    /提升了?\d+/g,
    /降低了?\d+/g,
    /增长了?\d+/g,
    /从\d+.*?到\d+/g,
  ];

  const examples: string[] = [];
  for (const pattern of metricPatterns) {
    const matches = answer.match(pattern);
    if (matches) examples.push(...matches.slice(0, 2));
  }

  return { hasMetrics: examples.length > 0, examples: [...new Set(examples)] };
}

function detectProfessionalTerms(answer: string): number {
  let count = 0;
  const normalizedAnswer = answer.toLowerCase();
  for (const term of PROFESSIONAL_TERMS) {
    if (normalizedAnswer.includes(term.toLowerCase())) count++;
  }
  return count;
}

function detectSTAR(answer: string): {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  score: number;
} {
  const patterns = {
    situation: [/背景|情况|当时|项目中|在.*?(公司|团队|项目)/i, /面临|遇到|出现了/i],
    task: [/任务|目标|需要|要求|负责/i, /我的职责|我需要/i],
    action: [/我|采取|使用|实施|解决|做了|通过/i, /首先|然后|接着|最后/i, /设计|开发|实现|优化|改进/i],
    result: [/结果|成效|最终|达成|完成/i, /提升|降低|增长|改善|优化了/i, /成功|顺利|按时|如期/i],
  };

  const detection = {
    situation: patterns.situation.some((p) => p.test(answer)),
    task: patterns.task.some((p) => p.test(answer)),
    action: patterns.action.some((p) => p.test(answer)),
    result: patterns.result.some((p) => p.test(answer)),
    score: 0,
  };

  const completeness = [detection.situation, detection.task, detection.action, detection.result].filter(Boolean).length;
  detection.score = completeness * 5;

  return detection;
}

function checkStructure(answer: string, framework?: string, type?: string) {
  const hints: string[] = [];
  let score = 0;

  const paragraphs = answer.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 2) score += 5;
  else hints.push("建议分段组织回答，使逻辑层次更清晰");

  const hasNumberedList = /[1-9][.、)]/m.test(answer);
  const hasBulletPoints = /^[-•·]/m.test(answer);
  if (hasNumberedList || hasBulletPoints) score += 5;
  else if (type !== "INTRO") hints.push("使用数字列表或分点叙述，可以让回答条理更清晰");

  const metricsResult = detectMetrics(answer);
  if (metricsResult.hasMetrics) score += 10;
  else if (type === "PROJECT" || type === "BEHAVIORAL")
    hints.push("缺少量化数据（如：提升X%、节省X小时），量化成果能大幅增强说服力");

  const professionalTerms = detectProfessionalTerms(answer);
  if (professionalTerms >= 3) score += 5;
  else if (type === "TECHNICAL") hints.push("适当引入专业术语，可以更好地体现技术深度");

  const hasLogicWords = /(首先|其次|然后|最后|因此|所以|综上)/.test(answer);
  if (hasLogicWords) score += 5;

  let starCompleteness: ReturnType<typeof detectSTAR> | undefined;
  if (framework?.toLowerCase().includes("star") || type === "PROJECT" || type === "BEHAVIORAL") {
    starCompleteness = detectSTAR(answer);
    score += starCompleteness.score;

    const missing = [];
    if (!starCompleteness.situation) missing.push("情境(S)");
    if (!starCompleteness.task) missing.push("任务(T)");
    if (!starCompleteness.action) missing.push("行动(A)");
    if (!starCompleteness.result) missing.push("结果(R)");

    if (missing.length > 0)
      hints.push("STAR结构不完整，缺少：" + missing.join("、"));
  }

  return {
    hints,
    score: Math.min(30, score),
    starCompleteness,
    hasMetrics: metricsResult.hasMetrics,
    metricsExamples: metricsResult.examples,
    professionalTerms,
  };
}

/**
 * 生成正面反馈条目（实质性观察）
 */
function buildRichGoodPoints(
  covered: string[],
  hasMetrics: boolean,
  metricsExamples: string[],
  professionalTerms: number,
  starCompleteness: ReturnType<typeof detectSTAR> | undefined,
  lengthAssessment: string,
  wordCount: number,
  type: string | undefined
): string[] {
  const points: string[] = [];

  for (const raw of covered) {
    const keyword = raw.replace(/^✓\s*/, "").trim();
    const template = COVERED_POINT_TEMPLATES[keyword];
    points.push(template || ("有效覆盖了「" + keyword + "」要点，展现了相关能力与经验"));
    if (points.length >= 3) break;
  }

  if (hasMetrics) {
    const example = metricsExamples[0] ? ("（如：" + metricsExamples[0] + "）") : "";
    points.push("使用了量化数据" + example + "支撑论点，以具体数字呈现成果，增强了可信度");
  }

  if (
    starCompleteness &&
    starCompleteness.situation &&
    starCompleteness.task &&
    starCompleteness.action &&
    starCompleteness.result
  ) {
    points.push("回答结构遵循STAR原则（情境→任务→行动→结果），逻辑层次清晰完整");
  }

  if (professionalTerms >= 4) {
    points.push("专业术语使用得当，展现了扎实的领域知识背景与行业认知");
  } else if (professionalTerms >= 2) {
    points.push("回答中体现了一定的专业性，使用了相关领域的专业表达");
  }

  if (lengthAssessment === "good") {
    points.push("回答长度适中（" + wordCount + "字），内容充实而不冗余，详略安排得当");
  }

  if (points.length === 0) {
    points.push("回答已覆盖基本要点，展现了对问题的基本理解与思考");
  }

  return points.slice(0, 4);
}

/**
 * 生成改进建议条目（具体可操作）
 */
function buildRichImprovePoints(
  missed: string[],
  hasMetrics: boolean,
  starCompleteness: ReturnType<typeof detectSTAR> | undefined,
  structureHints: string[],
  lengthAssessment: string,
  wordCount: number,
  type: string | undefined,
  minLength: number
): string[] {
  const points: string[] = [];

  for (const keyword of missed.slice(0, 3)) {
    const template = MISSED_POINT_TEMPLATES[keyword];
    points.push(template || ("建议补充「" + keyword + "」相关内容，这是面试官评估此类问题的重要维度"));
  }

  if (!hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL") && points.length < 3) {
    points.push(
      "缺少量化数据支撑，建议将成果数字化——例如将「大幅提升效率」改为「将接口响应时间从800ms降至200ms」"
    );
  }

  if (starCompleteness && (type === "PROJECT" || type === "BEHAVIORAL") && points.length < 3) {
    if (!starCompleteness.result) {
      points.push("结果（R）部分表述不足，建议明确说明最终成效或量化收益，这是STAR结构中最具说服力的部分");
    } else if (!starCompleteness.action) {
      points.push("行动（A）描述过于笼统，建议细化您具体采取了哪些步骤、如何克服阻力");
    } else if (!starCompleteness.situation) {
      points.push("情境（S）交代不清，建议先说明当时的背景和所面临的挑战，帮助面试官建立情境认知");
    }
  }

  if (lengthAssessment === "too_short" && points.length < 3) {
    points.push(
      "回答偏短（" + wordCount + "字），建议扩展至" + minLength + "字左右，加入更多具体案例和细节"
    );
  } else if (lengthAssessment === "too_long" && points.length < 3) {
    points.push("回答略显冗长，建议精简次要细节，突出最核心的2-3个关键点，控制在2分钟内表达完毕");
  }

  if (structureHints.length > 0 && points.length < 3) {
    points.push(structureHints[0]);
  }

  if (points.length === 0) {
    const fallbacks: Record<string, string> = {
      PROJECT: "建议进一步突出个人贡献（用「我负责」代替「我们完成」），并用数据量化项目成果",
      TECHNICAL: "建议在概念解释后，补充一个实际使用场景或项目案例，体现知识的真实应用能力",
      BEHAVIORAL: "建议选取更具代表性的具体事件，完整讲述来龙去脉，避免概括性描述",
      INTRO: "建议在结尾加一句明确的定位语，点明您最突出的能力与求职意愿",
      HR: "建议补充具体的职业规划细节，结合此岗位的发展路径来说明方向",
    };
    points.push(
      (type && fallbacks[type]) ||
        "建议在回答中加入1-2个具体案例或数据，使论点更加有力，给面试官留下深刻印象"
    );
  }

  return points.slice(0, 3);
}

/**
 * 生成教练点评（专业、有温度、可操作）
 */
function buildCoachMessage(
  score: number,
  covered: string[],
  missed: string[],
  hasMetrics: boolean,
  professionalTerms: number,
  starCompleteness: ReturnType<typeof detectSTAR> | undefined,
  type: string | undefined,
  wordCount: number,
  lengthAssessment: string
): string {
  const scoreLevel = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  const topMissed = missed.slice(0, 2).join("、");

  const typeContext: Record<string, string> = {
    INTRO: "自我介绍是面试的开场白",
    PROJECT: "项目经历是展现实际能力的核心环节",
    TECHNICAL: "技术问题考察的是知识深度与实际运用",
    BEHAVIORAL: "行为题考察您在真实情境中的判断与行动",
    HR: "综合素质问题考察自我认知与职业规划",
  };
  const context = (type && typeContext[type]) || "面试回答";

  const strengthParts: string[] = [];
  if (covered.length >= 3) strengthParts.push("覆盖了" + covered.length + "个核心要点");
  else if (covered.length >= 1) strengthParts.push("提到了" + covered.length + "个关键要素");
  if (hasMetrics) strengthParts.push("以数据量化了成果");
  if (professionalTerms >= 3) strengthParts.push("专业表达得当");

  let starDesc = "";
  if (starCompleteness && (type === "PROJECT" || type === "BEHAVIORAL")) {
    const starCount = [
      starCompleteness.situation,
      starCompleteness.task,
      starCompleteness.action,
      starCompleteness.result,
    ].filter(Boolean).length;
    if (starCount >= 3) starDesc = "STAR结构基本完整";
  }

  let coreImprovement = "";
  if (topMissed) {
    coreImprovement = "主要提升方向是补充" + topMissed + "等关键内容。";
  } else if (!hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL")) {
    coreImprovement = "主要提升方向是为成果添加量化数据支撑。";
  } else if (lengthAssessment === "too_short") {
    coreImprovement = "主要提升方向是丰富回答内容，补充更多具体细节。";
  }

  // Type-specific actionable tips
  const highTips: Record<string, string> = {
    INTRO: "在结尾加一句有力的定位语，让面试官在30秒内记住您最突出的价值。",
    PROJECT: "可以进一步区分团队贡献与您的个人贡献，突出您的不可替代性。",
    TECHNICAL: "可以补充该技术在实际项目中的使用场景及遇到的问题，知识应用能力会更突出。",
    BEHAVIORAL: "在结尾加一句对经历的升华总结，说明这段经历如何影响了您后续的工作思维。",
    HR: "如果能加入一个具体细节或例子来支撑您的观点，回答会更有说服力和真实感。",
  };
  const mediumTips: Record<string, string> = {
    INTRO: "建议按「经历→能力亮点→求职动机」的顺序重新组织，结尾呼应岗位需求。",
    PROJECT: "建议用STAR框架梳理：情境(1句)→任务(1句)→行动(3-4句核心)→结果(含数据)。",
    TECHNICAL: "建议遵循「是什么→为什么→怎么用」的结构，先给准确定义，再分析原理，最后结合项目举例。",
    BEHAVIORAL: "建议选取一个最有代表性的具体事件，完整讲述经过，而非概括几次类似经历。",
    HR: "把职业规划说得更具体，与此岗位的晋升路径挂钩，体现出您思考过自己的成长方向。",
  };
  const lowTips: Record<string, string> = {
    INTRO: "从最相关的一段工作/项目经历切入，直接体现与岗位的匹配度，避免流水账式陈述。",
    PROJECT: "先明确说「这个项目我的核心职责是X」，再按做了什么、遇到什么挑战、最终结果的顺序展开。",
    TECHNICAL: "先给出最核心的一句话定义，再从实际使用场景切入解释，比直接背书效果好得多。",
    BEHAVIORAL: "从「有一次在X情况下，我遇到了Y问题」开始，具体叙述当时的情境，避免只说「我通常会…」。",
    HR: "先诚恳地说明您的优势和目标，再自然引导到为什么适合这个岗位，真诚比技巧更重要。",
  };

  const tipMap = { high: highTips, medium: mediumTips, low: lowTips };
  const tips = tipMap[scoreLevel];
  const actionTip = (type && tips[type]) ||
    (scoreLevel === "high"
      ? "整体回答质量较高，关注细节打磨——精准的词汇选择和流畅的过渡，能让表达更上一层楼。"
      : scoreLevel === "medium"
      ? "聚焦最重要的1-2个改进点，把它们说透，比面面俱到更有效。"
      : "先从最核心的一个要点出发，把它说清楚说具体，建立扎实的基础再逐步丰富。");

  const strengths = [...strengthParts, starDesc].filter(Boolean).join("，");

  if (scoreLevel === "high") {
    return context + "，您的表现已展现出扎实的基础" +
      (strengths ? "——" + strengths : "") +
      "，整体较为出色。" + coreImprovement + actionTip;
  } else if (scoreLevel === "medium") {
    return context + "。" +
      (strengths ? "您" + strengths + "，具备一定基础。" : "") +
      coreImprovement + actionTip;
  } else {
    return context + "，当前回答还有较大提升空间。" + coreImprovement + actionTip;
  }
}

/**
 * 生成最重要的单条改进建议
 */
function buildTopSuggestion(
  missed: string[],
  hasMetrics: boolean,
  starCompleteness: ReturnType<typeof detectSTAR> | undefined,
  structureHints: string[],
  lengthAssessment: string,
  type: string | undefined,
  minLength: number,
  wordCount: number,
): string {
  if (missed.length > 0) {
    const topKeyword = missed[0];
    const template = MISSED_POINT_TEMPLATES[topKeyword];
    if (template) return template;
    return "重点补充「" + topKeyword + "」相关内容，这是面试官在此类问题中最关注的核心维度";
  }

  if (!hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL")) {
    return "将成果量化是最高效的提升方式——把「大幅提升」改为具体的百分比或绝对数值，说服力立刻大幅提升";
  }

  if (starCompleteness && (type === "PROJECT" || type === "BEHAVIORAL")) {
    if (!starCompleteness.result)
      return "补充结果（R）是STAR结构中最关键的一步——明确说明最终成效，是让面试官判断您是否「能交付结果」的核心依据";
    if (!starCompleteness.action)
      return "行动（A）部分需要更细化——具体描述您采取了哪些步骤、如何克服阻力，这是体现实际执行力的关键";
  }

  if (lengthAssessment === "too_short") {
    return "扩展回答内容，目标" + minLength + "字——加入一个具体的案例或数据，让回答从「说了」升级到「说服了」";
  }

  if (structureHints.length > 0) {
    return structureHints[0];
  }

  const genericTips: Record<string, string> = {
    INTRO: "在结尾加一句定位语，明确说明您最突出的能力及对此岗位的价值，让面试官清楚记住您",
    PROJECT: "将「我们」替换为「我」，明确说明您的个人贡献边界，面试官真正想了解的是您做了什么",
    TECHNICAL: "在解释概念后，加一个您实际用过该技术的真实场景，从「了解」到「用过」是质的飞跃",
    BEHAVIORAL: "选取一个最有代表性的具体事件完整讲述，比列举几个类似经历更有说服力",
    HR: "把职业规划落地到具体的岗位方向和能力发展目标，让面试官看到您有清晰的成长路径",
  };

  return (
    (type && genericTips[type]) ||
    "在回答中加入一个具体案例或数据点，将抽象的能力描述转化为可验证的实际经历"
  );
}

/**
 * 生成规则引擎反馈（主入口）
 */
export function generateRuleBasedFeedback(answer: string, question: QuestionInfo): SimplifiedFeedback {
  const type = question.type;
  const typeRules = type ? TYPE_SPECIFIC_RULES[type] : null;

  // 1. 关键点覆盖分析
  const keyPointsList = question.keyPoints
    ? extractKeywords(question.keyPoints)
    : typeRules?.required || [];

  const covered: string[] = [];
  const missed: string[] = [];

  for (const point of keyPointsList) {
    if (containsKeyword(answer, point)) {
      covered.push("✓ " + point);
    } else {
      missed.push(point);
    }
  }

  // 2. 长度评估
  const wordCount = answer.length;
  const minLength = typeRules?.minLength || 100;
  const maxLength = typeRules?.maxLength || 1000;

  let lengthAssessment: "too_short" | "good" | "too_long";
  let lengthMessage: string;

  if (wordCount < minLength * 0.5) {
    lengthAssessment = "too_short";
    lengthMessage = "回答过于简短（" + wordCount + "字），建议至少" + minLength + "字以充分展开";
  } else if (wordCount < minLength) {
    lengthAssessment = "too_short";
    lengthMessage = "回答偏短（" + wordCount + "字），建议补充到" + minLength + "字左右";
  } else if (wordCount > maxLength * 1.5) {
    lengthAssessment = "too_long";
    lengthMessage = "回答较长（" + wordCount + "字），建议精简到" + maxLength + "字内，突出重点";
  } else if (wordCount > maxLength) {
    lengthAssessment = "too_long";
    lengthMessage = "回答稍长（" + wordCount + "字），注意控制时间，避免冗余";
  } else {
    lengthAssessment = "good";
    lengthMessage = "回答长度适中（" + wordCount + "字）";
  }

  // 3. 结构分析
  const structureResult = checkStructure(answer, question.framework, type);

  // 4. 计算基础分数
  const coverageRate = keyPointsList.length > 0 ? covered.length / keyPointsList.length : 0.6;
  let coverageScore = Math.round(coverageRate * 50);

  if (typeRules?.bonus) {
    const bonusPoints = typeRules.bonus.filter((b) => containsKeyword(answer, b)).length;
    coverageScore += Math.min(10, bonusPoints * 3);
  }

  const lengthScore = lengthAssessment === "good" ? 20 : 10;
  const structureScore = structureResult.score;
  const basicScore = Math.min(100, Math.max(0, coverageScore + lengthScore + structureScore));

  // 5. 生成富文本反馈
  const richGoodPoints = buildRichGoodPoints(
    covered,
    structureResult.hasMetrics,
    structureResult.metricsExamples,
    structureResult.professionalTerms,
    structureResult.starCompleteness,
    lengthAssessment,
    wordCount,
    type
  );

  const richImprovePoints = buildRichImprovePoints(
    missed,
    structureResult.hasMetrics,
    structureResult.starCompleteness,
    structureResult.hints,
    lengthAssessment,
    wordCount,
    type,
    minLength
  );

  const coachMessage = buildCoachMessage(
    basicScore,
    covered,
    missed,
    structureResult.hasMetrics,
    structureResult.professionalTerms,
    structureResult.starCompleteness,
    type,
    wordCount,
    lengthAssessment
  );

  const topSuggestion = buildTopSuggestion(
    missed,
    structureResult.hasMetrics,
    structureResult.starCompleteness,
    structureResult.hints,
    lengthAssessment,
    type,
    minLength,
    wordCount,
  );

  // 6. 兼容旧接口字段
  const strengthParts: string[] = [];
  if (covered.length >= 3) strengthParts.push("关键点覆盖较为全面");
  if (structureResult.hasMetrics) strengthParts.push("使用了量化数据，增强了说服力");
  if (structureResult.professionalTerms >= 3) strengthParts.push("体现了一定的专业性");
  if (
    structureResult.starCompleteness?.situation &&
    structureResult.starCompleteness?.task &&
    structureResult.starCompleteness?.action &&
    structureResult.starCompleteness?.result
  ) {
    strengthParts.push("STAR结构完整");
  }
  const strengthSummary = strengthParts.length > 0 ? strengthParts.join("；") : "回答展现了基本素养";

  const improvementPriority: string[] = [];
  if (missed.length > 0) improvementPriority.push("补充关键内容：" + missed.slice(0, 3).join("、"));
  if (!structureResult.hasMetrics && (type === "PROJECT" || type === "BEHAVIORAL"))
    improvementPriority.push("添加量化数据（如：性能提升X%，用户增长X倍）");
  if (structureResult.hints.length > 0) improvementPriority.push(structureResult.hints[0]);

  const generalTips = typeRules?.tips || ["回答要有条理，逻辑清晰", "结合自身经历和具体案例"];

  return {
    basicScore,
    keyPointsCovered: covered,
    keyPointsMissed: missed,
    lengthAssessment,
    lengthMessage,
    structureHints: structureResult.hints,
    generalTips,
    upgradePrompt: topSuggestion,
    strengthSummary,
    improvementPriority: improvementPriority.slice(0, 3),
    starCompleteness: structureResult.starCompleteness,
    hasMetrics: structureResult.hasMetrics,
    professionalTerms: structureResult.professionalTerms,
    richGoodPoints,
    richImprovePoints,
    coachMessage,
    topSuggestion,
  };
}

/**
 * 为面试会话生成简化整体反馈
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

  const feedbacks = answers.map((a) =>
    generateRuleBasedFeedback(a.answer || "", {
      keyPoints: a.keyPoints,
      type: a.questionType,
    })
  );

  const overallScore = Math.round(
    feedbacks.reduce((sum, f) => sum + f.basicScore, 0) / feedbacks.length
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  const allCovered = feedbacks.flatMap((f) => f.keyPointsCovered);
  const allMissed = feedbacks.flatMap((f) => f.keyPointsMissed);
  const totalKeyPoints = allCovered.length + allMissed.length;
  const coverageRate = totalKeyPoints > 0 ? allCovered.length / totalKeyPoints : 0;

  if (coverageRate >= 0.7) {
    strengths.push("关键点覆盖全面，整体准备较为充分");
  } else if (coverageRate >= 0.5) {
    improvements.push("关键点覆盖率" + Math.round(coverageRate * 100) + "%，建议针对性补强薄弱要点");
  } else {
    improvements.push("关键点覆盖不足，建议系统梳理各题目的核心要点后重新练习");
  }

  const metricsCount = feedbacks.filter((f) => f.hasMetrics).length;
  const metricsRate = metricsCount / feedbacks.length;

  if (metricsRate >= 0.6) {
    strengths.push("善于用量化数据呈现成果，回答具有较强说服力");
  } else if (metricsRate < 0.3) {
    improvements.push("整体缺少量化数据支撑，建议将关键成果数字化（如：提升X%、节省X小时）");
  }

  const wellStructuredCount = feedbacks.filter((f) => f.structureHints.length === 0).length;

  if (wellStructuredCount >= feedbacks.length * 0.7) {
    strengths.push("回答结构清晰，条理分明，逻辑层次较好");
  } else if (wellStructuredCount < feedbacks.length * 0.3) {
    improvements.push("多道题目的回答结构有待改善，建议使用STAR法则或分点叙述来组织内容");
  }

  const avgProfessionalTerms =
    feedbacks.reduce((sum, f) => sum + (f.professionalTerms || 0), 0) / feedbacks.length;

  if (avgProfessionalTerms >= 3) {
    strengths.push("专业术语运用得当，体现了良好的领域知识积累");
  }

  const avgLength = answers.reduce((sum, a) => sum + (a.answer?.length || 0), 0) / answers.length;

  if (avgLength >= 200 && avgLength <= 600) {
    strengths.push("回答详略得当，篇幅控制合理，内容充实");
  } else if (avgLength < 100) {
    improvements.push("回答普遍偏短，建议增加具体案例和细节，让面试官有更充分的信息评估");
  }

  let summary: string;
  if (overallScore >= 80) {
    summary = "整体表现优秀（" + overallScore + "分），准备充分，表达清晰，具备较强的面试竞争力。";
  } else if (overallScore >= 65) {
    summary = "整体表现良好（" + overallScore + "分），基础扎实，针对薄弱点优化后竞争力将显著提升。";
  } else if (overallScore >= 50) {
    summary = "整体表现中等（" + overallScore + "分），建议重点关注内容深度与量化表达，专项练习提分空间较大。";
  } else {
    summary = "整体表现有待提高（" + overallScore + "分），建议系统复习核心要点，多练习具体案例的表达方式。";
  }

  const upgradePrompt =
    overallScore >= 75
      ? "面试准备较为充分，建议针对每道题做精细化打磨——优化措辞、补充数据、提炼核心观点，让好的回答变成优秀的回答"
      : "当前综合得分" + overallScore + "分，建议优先突破两个方向：1）补充缺失的关键要点内容；2）为成果添加量化数据支撑，这两点通常能带来最显著的提分效果";

  return { overallScore, summary, strengths, improvements, upgradePrompt };
}
