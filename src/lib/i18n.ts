// i18n configuration - Default: Chinese
export type Locale = 'zh' | 'en';

export const defaultLocale: Locale = 'zh';

export const translations = {
  zh: {
    // Common
    appName: 'FacePrep',
    appShortName: 'FP',
    tagline: 'AI 驱动的面试练习平台',

    // Nav
    nav: {
      home: '首页',
      questions: '题库',
      practice: '练习',
      history: '历史',
      favorites: '收藏',
      login: '登录',
      getStarted: '开始使用',
      logout: '退出',
    },

    // Landing Page
    landing: {
      badge: 'AI 驱动的面试练习',
      heroTitle: '掌控你的',
      heroHighlight: '面试',
      subtitle: '为求职者打造的智能面试准备平台。练习、获取反馈、拿下理想工作。',
      startPracticing: '开始练习',
      browseQuestions: '浏览题库',
      stats: {
        questions: '题目数量',
        powered: 'AI 驱动',
        available: '全天候',
        free: '免费开始',
      },
      features: {
        curated: {
          title: '精选题库',
          desc: '100+ 道精选面试题，覆盖所有主要类别',
        },
        aiFeedback: {
          title: 'AI 反馈',
          desc: '即时获得详细分析和可操作的改进建议',
        },
        progress: {
          title: '进度追踪',
          desc: '可视化你的成长，识别需要提升的领域',
        },
      },
      howItWorks: {
        title: '如何使用',
        subtitle: '三步走向成功',
        step1: {
          title: '选择题库',
          desc: '浏览精选题库或获取随机题目，模拟真实面试场景',
        },
        step2: {
          title: '练习回答',
          desc: '思考并组织你的回答，就像在真实面试中一样',
        },
        step3: {
          title: '获取 AI 反馈',
          desc: '接收详细分析，包括分数、优点和具体改进建议',
        },
      },
      cta: {
        title: '准备好拿下',
        subtitle: '下一场面试了吗？',
        desc: '加入数千名通过 FacePrep 提升面试技能的求职者',
        button: '免费开始',
      },
      footer: {
        copyright: '版权所有',
      },
    },

    // Dashboard
    dashboard: {
      greeting: {
        morning: '早上好',
        afternoon: '下午好',
        evening: '晚上好',
        night: '晚上好',
      },
      ready: '准备好练习下一场面试了吗？',
      startPractice: '开始练习',
      continuePractice: '继续练习',
      stats: {
        practices: '练习次数',
        average: '平均分',
        best: '最高分',
      },
      dailyGoal: {
        title: '每日目标',
        completed: '目标达成！做得好！',
        remaining: '还需 {count} 次达到目标',
      },
      categories: {
        title: '按类别练习',
      },
      recent: {
        title: '最近练习',
        viewAll: '查看全部',
      },
      empty: {
        title: '还没有练习记录',
        desc: '开始你的第一次面试练习，让 AI 帮助你提升',
        button: '开始第一次练习',
      },
      streak: '连续 {count} 天',
    },

    // Questions
    questions: {
      title: '题库',
      count: '{count} 道题目',
      search: '搜索题目...',
      clearSearch: '清除搜索',
      viewAll: '查看全部',
      noResults: '未找到题目',
      noResultsDesc: '尝试其他关键词',
      noCategory: '该类别暂无题目',
      frequency: ['低', '中', '高'],
      practiced: '已练习',
      progress: '进度',
      myCustom: '我的专属',
      addCustom: '添加题目',
      noCustomQuestions: '还没有专属题目',
      addCustomDesc: '粘贴文本快速添加你的面试题',
      selectQuestions: '选择题目标',
      startCustomInterview: '开始面试',
      deselect: '取消选择',
      parseQuestions: '智能解析',
      parsing: '解析中...',
      questionsFound: '识别到 {count} 道题目',
      reEdit: '重新编辑',
      saveQuestions: '保存 {count} 道题目',
      pasteQuestions: '粘贴包含面试题目的文本，系统会自动识别并解析。支持多种格式：',
      format1: '1. 题目内容',
      format2: '- 题目内容',
      format3: '第一题：题目内容',
      pastePlaceholder: '在此粘贴你的面试题目...\n\n例如：\n1. 请介绍一下你自己\n2. React 的虚拟 DOM 原理是什么？\n3. 说一下你最有成就感的一个项目',
    },

    // Question Detail
    question: {
      back: '返回',
      keyPoints: '考察点',
      yourAnswer: '你的回答',
      chars: '{count} 字',
      listening: '（识别中...）',
      placeholder: '在此输入你的回答，尽可能完整地表达你的想法...',
      tips: '提示',
      framework: '框架',
      getFeedback: '获取反馈',
      analyzing: 'AI 分析中...',
      score: '分',
      yourAnswerTitle: '我的回答',
      strengths: '优点',
      improvements: '待改进',
      suggestions: '建议',
      starExample: 'STAR 示例',
      referenceAnswer: '参考答案',
      commonMistakes: '常见错误',
      retry: '重新作答',
      nextQuestion: '下一题',
      backToQuestions: '返回题库',
      save: '收藏',
      saved: '已收藏',
      removeSave: '取消收藏',
    },

    // Practice
    practice: {
      title: '开始练习',
      subtitle: '{count} 道题目可选，选择适合你的练习方式',
      random: {
        title: '快速练习',
        desc: '利用碎片时间随机练一题，保持答题手感',
        button: '开始练习',
        recommended: '推荐',
      },
      byType: {
        title: '按题型练习',
        desc: '针对性练习，专项突破薄弱环节',
      },
      byRole: {
        title: '按岗位练习',
        desc: '选择目标岗位，练习相关高频题目',
      },
      saved: {
        title: '收藏复习',
        desc: '复习你收藏的重点题目',
      },
      aiGenerate: {
        title: '智能生成面试题',
        subtitle: '根据职位描述和你的简历，AI 为你量身定制面试题目',
        badge: 'AI 驱动',
        getStarted: '开始生成',
        jdLabel: '职位描述 (JD)',
        jdPlaceholder: '粘贴职位描述内容...',
        resumeLabel: '你的简历',
        resumePlaceholder: '粘贴简历内容，让 AI 生成更匹配的题目...',
        optional: '可选',
        required: '必填',
        generating: 'AI 生成中...',
        generateButton: '生成面试题',
        generatedTitle: '为你生成的题目',
        regenerate: '重新生成',
        clickToPractice: '点击题目开始练习',
        analyzeDesc: 'AI 将分析 JD 和简历，生成针对性题目',
      },
      mockInterview: {
        title: '模拟面试',
        subtitle: '一键开始完整面试流程，智能组卷8道题，覆盖各类题型',
        badge: '热门',
        startNow: '立即开始',
        targetRole: '目标岗位（可选）',
        allRoles: '全部',
        questionCount: '题目数量',
        difficulty: '难度设置',
        mixed: '混合难度（推荐）',
        easy: '简单',
        medium: '中等',
        hard: '困难',
        preparing: '组卷中...',
        startMock: '开始模拟面试',
        generated: '已生成 {count} 道题目',
        regenerate: '重新组卷',
        startInterview: '进入面试',
      },
      browse: {
        title: '浏览题库',
        count: '{count} 道题目',
      },
      history: {
        title: '练习历史',
        desc: '查看成长记录',
      },
    },

    // History
    history: {
      title: '你的成长',
      subtitle: '每一次练习都让你更接近成功',
      empty: {
        title: '开始记录你的成长',
        desc: '完成练习后，这里会展示你的成长曲线和能力分析',
        button: '开始练习',
      },
      stats: {
        practices: '练习次数',
        average: '平均分',
        best: '最高分',
        streak: '连续天数',
      },
      growthCurve: '成长曲线',
      skillAnalysis: '能力分析',
      practiceRecords: '练习记录',
      today: '今天',
      yesterday: '昨天',
      unlockAnalysis: '完成 3 次练习后解锁能力分析',
    },

    // Favorites
    favorites: {
      title: '我的收藏',
      loading: '加载中...',
      empty: {
        title: '还没有收藏的题目',
        desc: '在练习时点击收藏按钮，将重点题目添加到这里',
        button: '去题库看看',
      },
      review: {
        title: '复习收藏',
        desc: '从收藏中随机抽取一题开始练习',
      },
      count: '{count} 道题目',
      practiced: '已练习 {count} 次',
    },

    // Auth
    auth: {
      login: {
        title: '欢迎回来',
        subtitle: '登录账号继续你的面试准备',
        email: '邮箱地址',
        password: '密码',
        signIn: '登录',
        signingIn: '登录中...',
        noAccount: '还没有账号？',
        signUp: '立即注册',
      },
      register: {
        title: '创建账号',
        subtitle: '开启你的面试准备之旅',
        name: '姓名',
        email: '邮箱地址',
        password: '密码',
        confirmPassword: '确认密码',
        createAccount: '创建账号',
        creating: '创建中...',
        hasAccount: '已有账号？',
        signIn: '立即登录',
      },
      errors: {
        loginFailed: '登录失败，请重试',
        registerFailed: '注册失败，请重试',
        passwordMismatch: '两次输入的密码不一致',
        passwordTooShort: '密码至少需要 6 个字符',
      },
      quote: {
        login: '今天最好的准备是为明天做最好的自己。',
        register: '成功源于准备与机遇的相遇。',
      },
    },
  },

  en: {
    // Common
    appName: 'FacePrep',
    appShortName: 'FP',
    tagline: 'AI-powered interview practice platform',

    // Nav
    nav: {
      home: 'Home',
      questions: 'Questions',
      practice: 'Practice',
      history: 'History',
      favorites: 'Favorites',
      login: 'Login',
      getStarted: 'Get Started',
      logout: 'Logout',
    },

    // Landing Page
    landing: {
      badge: 'AI-Powered Interview Practice',
      heroTitle: 'Master Your',
      heroHighlight: 'Interview',
      subtitle: 'Intelligent interview preparation for job seekers. Practice, get feedback, and land your dream job.',
      startPracticing: 'Start Practicing',
      browseQuestions: 'Browse Questions',
      stats: {
        questions: 'Questions',
        powered: 'AI Powered',
        available: '24/7 Available',
        free: 'Free to Start',
      },
      features: {
        curated: {
          title: 'Curated Questions',
          desc: '100+ carefully selected interview questions covering all major categories',
        },
        aiFeedback: {
          title: 'AI Feedback',
          desc: 'Get instant, detailed analysis and actionable suggestions for improvement',
        },
        progress: {
          title: 'Track Progress',
          desc: 'Visualize your growth over time and identify areas for improvement',
        },
      },
      howItWorks: {
        title: 'How it Works',
        subtitle: 'Three simple steps to interview success',
        step1: {
          title: 'Choose a Question',
          desc: 'Browse our curated collection or get a random question to simulate real interview conditions',
        },
        step2: {
          title: 'Practice Your Answer',
          desc: 'Think through your response and write it out, just like you would in a real interview',
        },
        step3: {
          title: 'Get AI Feedback',
          desc: 'Receive detailed analysis with scores, strengths, and specific improvement suggestions',
        },
      },
      cta: {
        title: 'Ready to ace your',
        subtitle: 'next interview?',
        desc: 'Join thousands of job seekers who have improved their interview skills with FacePrep',
        button: 'Get Started Free',
      },
      footer: {
        copyright: 'All rights reserved',
      },
    },

    // Dashboard
    dashboard: {
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        night: 'Good night',
      },
      ready: 'Ready to practice for your next interview?',
      startPractice: 'Start Practice',
      continuePractice: 'Continue Practice',
      stats: {
        practices: 'Practices',
        average: 'Average',
        best: 'Best',
      },
      dailyGoal: {
        title: 'Daily Goal',
        completed: 'Goal completed! Great job!',
        remaining: '{count} more to reach your goal',
      },
      categories: {
        title: 'Practice by Category',
      },
      recent: {
        title: 'Recent Practice',
        viewAll: 'View all',
      },
      empty: {
        title: 'No practice yet',
        desc: 'Start your first interview practice and let AI help you improve',
        button: 'Start First Practice',
      },
      streak: '{count} day streak',
    },

    // Questions
    questions: {
      title: 'Question Bank',
      count: '{count} questions',
      search: 'Search questions...',
      clearSearch: 'Clear search',
      viewAll: 'View all',
      noResults: 'No questions found',
      noResultsDesc: 'Try different keywords',
      noCategory: 'No questions in this category',
      frequency: ['Low', 'Medium', 'High'],
      practiced: 'Practiced',
      progress: 'Progress',
      myCustom: 'My Custom',
      addCustom: 'Add Questions',
      noCustomQuestions: 'No custom questions yet',
      addCustomDesc: 'Paste text to add your interview questions',
      selectQuestions: 'Select questions',
      startCustomInterview: 'Start Interview',
      deselect: 'Deselect',
      parseQuestions: 'Smart Parse',
      parsing: 'Parsing...',
      questionsFound: '{count} questions found',
      reEdit: 'Re-edit',
      saveQuestions: 'Save {count} Questions',
      pasteQuestions: 'Paste text containing interview questions. Supports multiple formats:',
      format1: '1. Question content',
      format2: '- Question content',
      format3: 'Question 1: content',
      pastePlaceholder: 'Paste your interview questions here...',
    },

    // Question Detail
    question: {
      back: 'Back',
      keyPoints: 'Key Points',
      yourAnswer: 'Your Answer',
      chars: '{count} chars',
      listening: '(listening...)',
      placeholder: 'Type your answer here, express your thoughts as completely as possible...',
      tips: 'Tips',
      framework: 'Framework',
      getFeedback: 'Get Feedback',
      analyzing: 'AI Analyzing...',
      score: '',
      yourAnswerTitle: 'Your Answer',
      strengths: 'Strengths',
      improvements: 'Areas to Improve',
      suggestions: 'Suggestions',
      starExample: 'STAR Example',
      referenceAnswer: 'Reference Answer',
      commonMistakes: 'Common Mistakes',
      retry: 'Retry',
      nextQuestion: 'Next Question',
      backToQuestions: 'Back to Questions',
      save: 'Save',
      saved: 'Saved',
      removeSave: 'Remove',
    },

    // Practice
    practice: {
      title: 'Start Practice',
      subtitle: '{count} questions available, choose your practice style',
      random: {
        title: 'Quick Practice',
        desc: 'Practice a random question in your spare time to stay sharp',
        button: 'Start Practice',
        recommended: 'Recommended',
      },
      byType: {
        title: 'By Type',
        desc: 'Targeted practice to improve weak areas',
      },
      byRole: {
        title: 'By Role',
        desc: 'Select your target role to practice relevant questions',
      },
      saved: {
        title: 'Saved Questions',
        desc: 'Review your bookmarked questions',
      },
      aiGenerate: {
        title: 'AI Generate Interview Questions',
        subtitle: 'Get personalized interview questions based on JD and your resume',
        badge: 'AI Powered',
        getStarted: 'Get Started',
        jdLabel: 'Job Description (JD)',
        jdPlaceholder: 'Paste job description here...',
        resumeLabel: 'Your Resume',
        resumePlaceholder: 'Paste resume for more tailored questions...',
        optional: 'Optional',
        required: 'Required',
        generating: 'AI Generating...',
        generateButton: 'Generate Questions',
        generatedTitle: 'Generated for You',
        regenerate: 'Regenerate',
        clickToPractice: 'Click a question to start practicing',
        analyzeDesc: 'AI will analyze JD and resume to generate tailored questions',
      },
      mockInterview: {
        title: 'Mock Interview',
        subtitle: 'Start a full interview with 8 smart-selected questions covering all types',
        badge: 'Popular',
        startNow: 'Start Now',
        targetRole: 'Target Role (Optional)',
        allRoles: 'All',
        questionCount: 'Question Count',
        difficulty: 'Difficulty',
        mixed: 'Mixed (Recommended)',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        preparing: 'Preparing...',
        startMock: 'Start Mock Interview',
        generated: '{count} Questions Generated',
        regenerate: 'Regenerate',
        startInterview: 'Start Interview',
      },
      browse: {
        title: 'Browse Questions',
        count: '{count} questions',
      },
      history: {
        title: 'Practice History',
        desc: 'View your progress',
      },
    },

    // History
    history: {
      title: 'Your Journey',
      subtitle: 'Every practice brings you closer to success',
      empty: {
        title: 'Start Your Journey',
        desc: 'Complete your first practice to see your growth curve and ability analysis',
        button: 'Start Practice',
      },
      stats: {
        practices: 'Practices',
        average: 'Average',
        best: 'Best',
        streak: 'Streak',
      },
      growthCurve: 'Growth Curve',
      skillAnalysis: 'Skill Analysis',
      practiceRecords: 'Practice Records',
      today: 'Today',
      yesterday: 'Yesterday',
      unlockAnalysis: 'Complete 3 practices to unlock skill analysis',
    },

    // Favorites
    favorites: {
      title: 'Saved Questions',
      loading: 'Loading...',
      empty: {
        title: 'No Saved Questions',
        desc: 'Click the save button while practicing to add questions here',
        button: 'Browse Questions',
      },
      review: {
        title: 'Review Saved',
        desc: 'Practice a random saved question',
      },
      count: '{count} questions',
      practiced: 'Practiced {count}',
    },

    // Auth
    auth: {
      login: {
        title: 'Welcome Back',
        subtitle: 'Sign in to continue your interview preparation',
        email: 'Email Address',
        password: 'Password',
        signIn: 'Sign In',
        signingIn: 'Signing in...',
        noAccount: "Don't have an account?",
        signUp: 'Sign up',
      },
      register: {
        title: 'Create Account',
        subtitle: 'Start your interview preparation journey',
        name: 'Full Name',
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        createAccount: 'Create Account',
        creating: 'Creating...',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in',
      },
      errors: {
        loginFailed: 'Login failed, please try again',
        registerFailed: 'Registration failed, please try again',
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 6 characters',
      },
      quote: {
        login: 'The best preparation for tomorrow is doing your best today.',
        register: 'Success is where preparation and opportunity meet.',
      },
    },
  },
};

export type Translations = typeof translations.zh;

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale];
}
