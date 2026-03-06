# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供操作本代码仓库的指导。

## 项目概述

FacePrep (Job Pilot) 是一个面向中国求职者的 AI 驱动面试准备平台，提供练习题、AI 反馈、语音输入支持和进度追踪功能。

## 技术栈

- **框架**: Next.js 16.1.6，使用 App Router 和 Turbopack
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 3.4.19，使用自定义 "Klein Blue" (#0025E0) 主题色
- **UI 组件**: shadcn/ui (New York 风格)
- **数据库**: PostgreSQL + Prisma ORM 5.22.0
- **认证**: 基于 JWT 的自定义会话管理，使用 `jose` 库
- **AI 集成**: 多提供商支持 (DeepSeek, OpenAI, Qwen)

## 常用命令

```bash
# 开发
docker-compose up -d          # 启动 PostgreSQL 容器
npm run dev                   # 使用 Turbopack 启动开发服务器

# 数据库
npx prisma generate           # 在 schema 变更后生成 Prisma 客户端
npx prisma migrate dev        # 创建并应用数据库迁移
npx prisma db seed            # 使用初始 68 道题目填充数据库
npx prisma studio             # 打开 Prisma Studio GUI

# 构建与部署
npm run build                 # 生产构建
npm run lint                  # ESLint 检查
```

## 架构

### 认证流程

在 `src/lib/session.ts` 中实现的自定义 JWT:
- 30 天会话过期，使用 HTTP-only cookies
- 使用 `jose` 库进行 JWT 签名/验证
- 速率限制: 5 分钟窗口内最多 5 次尝试，失败锁定 15 分钟
- 使用 bcrypt 进行密码哈希

会话 cookie 名称: `session-token`

### AI 提供商系统

位于 `src/lib/ai/`:
- `index.ts` - 提供商工厂和反馈生成
- `deepseek.ts` - DeepSeek 提供商
- `openai-compatible.ts` - 通用 OpenAI 兼容提供商 (用于 OpenAI 和 Qwen)
- `streaming.ts` - 流式响应工具
- `types.ts` - 共享接口

环境变量 `AI_PROVIDER` 控制使用哪个提供商 (`deepseek`, `openai`, `qwen`)。

AI 反馈返回结构化 JSON，包含: `score` (0-100), `good` (数组), `improve` (数组), `suggestion` (字符串), `starAnswer` (可选)。

### 数据库 Schema

`prisma/schema.prisma` 中的关键模型:
- **User** - 用户账户，包含套餐等级 (FREE/PRO)
- **Question** - 68 道精选面试题，包含元数据 (category, type, difficulty, keyPoints, framework, referenceAnswer)
- **Practice** - 用户练习记录，包含 AI 反馈和评分
- **Favorite** - 用户收藏的题目
- **CustomQuestion** - 用户自定义题目
- **InterviewSession** - 模拟面试会话，包含多个答案
- **BugReport** - 用户反馈 (代号 "啄木鸟")

分类: FRONTEND, BACKEND, PRODUCT, DESIGN, OPERATION, GENERAL
题目类型: INTRO, PROJECT, TECHNICAL, BEHAVIORAL, HR

### 路由分组

- `(auth)/` - 登录和注册页面
- `(main)/` - 仪表盘、练习、题目、历史、收藏、成就、面试
- `api/` - 后端 API 路由

### 语音输入

`src/components/voice-input.tsx` 提供语音识别:
- 主要: Web Speech API
- 降级: 百度 ASR (需要 BAIDU_API_KEY 和 BAIDU_SECRET_KEY)

### 练习数据流

1. 用户从题库选择题目 (`src/data/questions.ts` 中的 68 道预设题目)
2. 用户提交答案 (文字或语音)
3. AI 通过 `src/lib/ai/index.ts` 中的 `generateFeedback()` 生成反馈
4. 保存练习记录，包含评分、反馈和用时
5. 统计数据汇总到仪表盘展示

## 环境变量

```bash
# 必需
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobpilot"
JWT_SECRET="min-32-characters-secret-key"

# AI 提供商 (选择一个)
AI_PROVIDER="qwen"  # 或 "deepseek" 或 "openai"
QWEN_API_KEY="..."
DEEPSEEK_API_KEY="..."
OPENAI_API_KEY="..."

# 可选 - 语音识别
BAIDU_API_KEY="..."
BAIDU_SECRET_KEY="..."
```

## 关键文件

- `src/lib/session.ts` - JWT 会话管理
- `src/lib/ai/index.ts` - AI 反馈生成
- `src/data/questions.ts` - 68 道预设面试题
- `prisma/seed.ts` - 数据库种子脚本
- `tailwind.config.ts` - 使用 Klein Blue 主题的自定义设计系统
