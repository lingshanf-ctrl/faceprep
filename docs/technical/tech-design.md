# FacePrep 技术设计文档

> 版本: 1.1 | 更新日期: 2026-03-22

## 目录

1. [技术栈](#技术栈)
2. [系统架构](#系统架构)
3. [目录结构](#目录结构)
4. [数据库设计](#数据库设计)
5. [API 设计](#api-设计)
6. [AI 系统设计](#ai-系统设计)
7. [认证与授权](#认证与授权)
8. [会员与计费系统](#会员与计费系统)
9. [语音输入系统](#语音输入系统)
10. [前端架构](#前端架构)
11. [错误处理策略](#错误处理策略)
12. [部署架构](#部署架构)
13. [环境变量](#环境变量)
14. [关键设计决策](#关键设计决策)

---

## 技术栈

| 层次 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Next.js | 16.1.6 | App Router + Turbopack |
| 语言 | TypeScript | 5.9.3 | 全量类型安全 |
| 样式 | Tailwind CSS | 3.4.19 | Stitch "The Articulated Mentor" 设计系统 |
| 字体 | Plus Jakarta Sans + Inter | - | 标题 + 正文双字体体系 |
| UI 组件 | shadcn/ui | New York | Radix 基础组件 |
| 数据库 | PostgreSQL | - | Supabase 托管 |
| ORM | Prisma | 5.22.0 | 类型安全数据访问 |
| 认证 | jose | 6.1.3 | JWT 签名/验证 |
| 密码 | bcryptjs | 3.0.3 | 哈希加盐 |
| 动画 | framer-motion | 12.34.5 | 页面/组件动效 |
| 图表 | recharts | 3.7.0 | 数据可视化 |
| AI | DeepSeek/Qwen/Kimi | - | 多提供商支持 |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器客户端                         │
│   Next.js App Router  ─── framer-motion + Tailwind CSS  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / Server Actions
┌────────────────────▼────────────────────────────────────┐
│                    Next.js API Routes                    │
│  /api/auth  /api/practices  /api/interview  /api/ai-*   │
│  边缘运行时 (Vercel Edge) 用于反馈接口                     │
└────────┬───────────────────────────────┬────────────────┘
         │ Prisma ORM                    │ AI SDK
┌────────▼──────────┐         ┌──────────▼──────────────┐
│   PostgreSQL DB   │         │    AI 提供商             │
│   (Supabase)      │         │  ├── DeepSeek (付费用户)  │
│                   │         │  ├── Kimi    (付费备用)   │
│  - User           │         │  ├── Qwen   (免费用户)   │
│  - Question       │         │  └── Rule Engine (兜底) │
│  - Practice       │         └────────────────────────┘
│  - InterviewSession│
│  - MembershipOrder │         ┌────────────────────────┐
│  - UsageRecord    │         │    语音识别              │
│  - ...            │         │  ├── Web Speech API     │
└───────────────────┘         │  └── 百度 ASR (降级)    │
                              └────────────────────────┘
```

### 请求生命周期

1. 用户操作触发页面级组件状态更新
2. 组件调用 `/api/*` 接口（Fetch 或 Server Actions）
3. API 路由从 cookie 中验证 JWT session
4. 业务逻辑调用 `src/lib/` 中的服务函数
5. 服务函数通过 Prisma 操作数据库
6. AI 反馈经由 `src/lib/ai/index.ts` 路由至对应提供商
7. 响应序列化后返回客户端

---

## 目录结构

```
faceprep/
├── src/
│   ├── app/
│   │   ├── (auth)/          # 登录/注册页面
│   │   ├── (main)/          # 主应用页面
│   │   │   ├── dashboard/
│   │   │   ├── practice/
│   │   │   │   ├── [id]/        # 单题练习
│   │   │   │   ├── ai/[id]/     # AI 生成题练习
│   │   │   │   ├── ai-custom/   # 自定义 AI 题目
│   │   │   │   └── review/[id]/ # 练习回顾
│   │   │   ├── questions/       # 题库浏览
│   │   │   ├── interview/       # 模拟面试
│   │   │   ├── history/
│   │   │   ├── favorites/
│   │   │   └── achievements/
│   │   ├── api/             # API 路由
│   │   │   ├── auth/
│   │   │   ├── practices/
│   │   │   ├── interview/
│   │   │   ├── questions/
│   │   │   ├── ai-questions/
│   │   │   ├── membership/
│   │   │   ├── feedback/
│   │   │   ├── favorites/
│   │   │   ├── stats/
│   │   │   └── admin/
│   │   └── admin/           # 管理后台页面
│   ├── components/          # 共享组件
│   │   ├── ui/              # shadcn 基础组件
│   │   ├── charts/          # 数据可视化
│   │   └── *.tsx            # 业务组件
│   ├── lib/                 # 核心业务逻辑
│   │   ├── ai/              # AI 集成
│   │   ├── session.ts       # JWT 会话管理
│   │   ├── db.ts            # Prisma 单例
│   │   ├── membership-service.ts
│   │   ├── rate-limit.ts
│   │   ├── rule-engine-feedback.ts
│   │   └── constants.ts
│   ├── hooks/               # 自定义 React Hooks
│   └── data/                # 静态数据（题库/成就）
├── prisma/
│   ├── schema.prisma        # 数据模型
│   ├── seed.ts              # 初始数据
│   └── migrations/         # 数据库迁移历史
└── docs/                    # 项目文档
```

---

## 数据库设计

### 模型关系图

```
User
 ├──< Practice (用户-题目-答案记录)
 ├──< Favorite (收藏)
 ├──< CustomQuestion (自定义题)
 ├──< InterviewSession (模拟面试)
 │        └──< InterviewAnswer
 ├──< MembershipOrder (会员订单)
 ├──< UsageRecord (用量记录)
 ├──< AIGeneratedQuestion (AI 生成题)
 └──< TrialClaim (试用领取)

Question
 ├──< Practice
 └──< Favorite
```

### 核心模型详解

**User**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  avatar    String?
  plan      Plan     @default(FREE)
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Practice** — 练习记录，支持异步评估
```prisma
model Practice {
  evaluationStatus   EvaluationStatus @default(PENDING)
  evaluationModel    String?          // 记录使用的 AI 模型
  evaluationRetries  Int              @default(0)
  // 快照字段：记录练习时题目状态
  questionTitle      String?
  questionCategory   Category?
  questionType       QuestionType?
  questionDifficulty Int?
}
```

**MembershipOrder** + **UsageRecord** — 防重复扣费
```prisma
model UsageRecord {
  sourceType UsageSourceType
  sourceId   String
  @@unique([sourceType, sourceId])  // 幂等键
}
```

### 枚举类型

| 枚举 | 值 |
|------|-----|
| Plan | FREE, PRO |
| Category | FRONTEND, BACKEND, PRODUCT, DESIGN, OPERATION, GENERAL, DATA, AI, MARKETING, MANAGEMENT |
| QuestionType | INTRO, PROJECT, TECHNICAL, BEHAVIORAL, HR |
| EvaluationStatus | PENDING, PROCESSING, COMPLETED, FAILED |
| MembershipType | CREDIT, MONTHLY |
| OrderStatus | ACTIVE, EXPIRED, CONSUMED, CANCELLED |

---

## API 设计

### 响应格式规范

所有 API 使用统一的 JSON 响应格式：

```typescript
// 成功响应
{ data: T, count?: number }

// 错误响应
{ error: string }
// HTTP 状态码: 400 参数错误, 401 未授权, 403 无权限, 404 不存在, 500 内部错误
```

### 主要接口列表

#### 认证 (`/api/auth`)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/login` | 邮箱密码登录 |
| POST | `/register` | 注册（自动迁移匿名数据）|
| POST | `/logout` | 登出（清除 cookie）|
| GET  | `/me` | 获取当前用户信息 |

#### 练习 (`/api/practices`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/` | 分页获取练习记录 |
| POST | `/` | 创建练习（触发 AI 评估）|
| GET  | `/[id]` | 获取单条练习（含反馈）|
| POST | `/evaluate` | 批量评估待处理记录 |

#### 面试 (`/api/interview`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/sessions` | 面试会话列表/创建 |
| GET/POST | `/sessions/[id]` | 获取/更新会话 |
| POST | `/generate-questions` | 根据 JD/简历生成题目 |
| POST | `/overall-evaluate` | 生成面试总体报告 |

#### 反馈 (`/api/feedback`)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 同步生成 AI 反馈 |
| POST | `/stream` | 流式生成（SSE）|

#### 会员 (`/api/membership`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/status` | 查询会员状态 |
| POST | `/consume` | 扣除一次用量 |

---

## AI 系统设计

### 双模型架构

```
用户请求
    │
    ├── 付费用户 ──→ DeepSeek (deepseek-chat, 30s)
    │                   └── 失败 → Kimi (kimi-k2.5, 45s)
    │                               └── 失败 → 规则引擎
    │
    └── 免费用户 ──→ Qwen (qwen-turbo, 15s)
                        └── 失败 → 规则引擎
```

### 评估深度

| 深度 | 提供商 | MaxTokens | Timeout | 适用场景 |
|------|--------|-----------|---------|---------|
| basic | Qwen | 1500 | 15s | 免费用户、快速反馈 |
| advanced | DeepSeek | 3000 | 30s | 付费用户、深度分析 |

### 反馈数据结构

```typescript
interface InterviewFeedback {
  totalScore: number;           // 0-100 综合分
  dimensions: {
    content: DimensionScore;    // 内容准确性
    structure: DimensionScore;  // 表达结构
    expression: DimensionScore; // 语言表达
    highlights: DimensionScore; // 亮点挖掘
  };
  gapAnalysis: string[];        // 差距分析
  improvements: Improvement[];  // 改进建议
  optimizedAnswer: string;      // 优化答案示例
  coachMessage: string;         // 教练寄语
}
```

### 规则引擎兜底

当所有 AI 提供商失败时，`src/lib/rule-engine-feedback.ts` 基于以下规则生成反馈：

- 专业术语关键词匹配（含同义词库）
- 答案长度评分（50-500字范围）
- 关键考察点覆盖率评分
- 结构完整性（总分/分点/总结）

---

## 认证与授权

### JWT 会话设计

```typescript
// JWT Payload
interface SessionPayload {
  id: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;  // 30天后
}
```

**Cookie 配置:**
- 名称: `session-token`
- HttpOnly: true（防 XSS）
- Secure: true（仅 HTTPS）
- SameSite: lax
- Path: /

### 速率限制

```
登录/注册:
  - 5次尝试 / 5分钟窗口
  - 超限后锁定15分钟
  - 基于 IP 地址计数
  - 内存存储，每60秒清理过期条目
```

### 匿名用户支持

- 未登录用户数据存储于 `localStorage`
- 注册/登录时自动将匿名练习记录迁移至账户
- 匿名用户有20次免费练习上限

---

## 会员与计费系统

### 会员等级

| 等级 | 说明 | AI 模型 |
|------|------|---------|
| FREE | 每题3次，总计20次（匿名）| Qwen |
| CREDIT | 次卡，按次扣费 | DeepSeek |
| MONTHLY | 月卡，当月无限 | DeepSeek |

### 防重复扣费

```sql
-- UsageRecord 表的唯一约束
UNIQUE(sourceType, sourceId)
-- sourceType: PRACTICE | INTERVIEW_SESSION
-- sourceId: 对应记录的 ID
```

即使用户快速多次提交，数据库约束保证每条练习/面试只消费一次。

### 试用机制

- 每个用户可领取一次 3 积分试用
- 通过 `TrialClaim` 表去重（userId 唯一）
- 记录领取 IP 和 UA 用于风控

---

## 语音输入系统

### 双轨架构

```
用户点击语音
    │
    ├──→ Web Speech API（优先）
    │      - 浏览器原生，零成本
    │      - 支持 Chrome/Edge/Safari
    │      - 实时流式转写
    │
    └──→ 百度 ASR（降级）
           - 需要 BAIDU_API_KEY
           - 支持更多浏览器
           - 通过 /api/baidu-token 获取临时 token
```

**相关组件:**
- `voice-input.tsx` — 底层语音识别逻辑
- `voice-textarea.tsx` — 带语音按钮的文本域
- `voice-textarea-realtime.tsx` — 实时转写模式

---

## 前端架构

### 设计系统 — Stitch "The Articulated Mentor"

> 2026-03-22 全站 UI 重构为 Stitch 设计系统，替换原 Klein Blue (#0025E0) 方案。

**调色板:**

| Token | 值 | 用途 |
|-------|----|------|
| background | `#fcf9f8` | 暖奶油页面背景 |
| surface | `#f6f3f2` | 页内容器背景 |
| surface-elevated | `#ffffff` | 卡片/浮层背景 |
| surface-high | `#eae7e7` | 次级/下沉区域 |
| accent | `#004ac6` | 主色调（Deep Blue） |
| accent-light | `#2563eb` | 渐变终点色 |
| foreground | `#1c1b1b` | 主文字（非纯黑） |
| foreground-muted | `#434655` | 次级文字 |
| foreground-subtle | `#737686` | 占位符/禁用文字 |

**字体体系:**
- 标题: `Plus Jakarta Sans`（-0.02em tracking）
- 正文/数据: `Inter`
- 字阶: display-xl(3.5rem) → display → heading-xl → body-lg → small → xs

**阴影体系（Ambient Shadow）:**
```css
subtle:  0 20px 40px rgba(28,27,27,0.04)
soft:    0 20px 40px rgba(28,27,27,0.06)
soft-md: 0 20px 40px rgba(28,27,27,0.08)
```

**设计规范:**
- 无硬边框（No-Line rule），用色调分层代替 border
- 圆角: 默认 0.25rem，卡片 0.75rem(lg)，大组件 1rem(xl)
- 主渐变: `linear-gradient(135deg, #004ac6 0%, #2563eb 100%)`
- utility 类: `.card-base`, `.card-surface`, `.glass`, `.input-stitch`, `.hover-lift`

**配置文件:**
- `tailwind.config.ts` — 完整 design token 定义
- `src/app/globals.css` — CSS 变量、utility 类、动画

### 页面动画

使用 framer-motion 实现统一的页面过渡：

```tsx
// 标准页面入场动画
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
```

### 答题页面布局规范

所有答题页面（题目练习、AI 题目练习、模拟面试）采用统一布局：

```
[← 返回]                    [计时器]
[题目类型标签] [难度点]
[题目标题 H1]
[展开考察点]
─────────────────────
[白色答题卡片]
  [VoiceTextarea]
─────────────────────
[提示文字]        [提交按钮→]
```

### 国际化

自定义 i18n 实现，通过 `LanguageProvider` 注入，支持中英文切换：

```tsx
const { locale } = useLanguage();
// 使用三元运算符切换文案
{locale === "zh" ? "返回" : "Back"}
```

---

## 错误处理策略

### 三层错误处理

```
1. 网络层 (fetch/axios)
   - 超时处理 (15s/30s/45s)
   - 重试逻辑 (最多2次)

2. API 层 (Next.js Route Handlers)
   - try-catch 包裹所有处理器
   - 结构化日志: console.error("[Context Error]", error)
   - 统一 error 字段返回

3. 组件层 (React)
   - error-banner 组件展示友好错误
   - 不向用户暴露技术细节
```

### AI 评估失败处理

```
AI 调用失败
    │
    ├── 记录 evaluationStatus = FAILED
    ├── 不扣除用户积分
    ├── 启动规则引擎生成基础反馈
    └── 提供重试入口
```

---

## 部署架构

### 生产环境

- **平台**: Vercel
- **数据库**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network（全球加速）
- **AI API**: 直连各提供商（无中间层）

### 性能优化

- Turbopack 用于开发时快速构建
- Next.js App Router 自动代码分割
- 边缘运行时用于反馈 API（减少亚洲用户延迟）
- `@tanstack/react-virtual` 用于长列表虚拟化

### 数据库注意事项

- 生产环境使用 `POSTGRES_PRISMA_URL`（Supabase 连接池）
- Schema 变更使用 `prisma db push`（Supabase 不支持 shadow database）
- 本地开发使用 Docker PostgreSQL + `prisma migrate dev`

---

## 环境变量

### 必填

```bash
DATABASE_URL="postgresql://..."         # 本地开发
POSTGRES_PRISMA_URL="postgresql://..."  # Vercel/Supabase 生产
JWT_SECRET="至少32位随机字符串"
```

### AI 提供商（选择一个或多个）

```bash
AI_PROVIDER="qwen"                      # deepseek | openai | qwen | kimi
QWEN_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
OPENAI_API_KEY="sk-..."
KIMI_API_KEY="sk-..."
```

### 可选

```bash
BAIDU_API_KEY="..."                     # 百度 ASR 语音识别
BAIDU_SECRET_KEY="..."
ADMIN_TOKEN="..."                       # 管理后台访问令牌
```

---

## 关键设计决策

### 1. 异步评估模式

**问题**: AI 评估耗时可能超过用户等待阈值（10s+）

**方案**: Practice 记录创建时 `evaluationStatus = PENDING`，后台任务轮询评估。前端通过 `/api/practices/evaluation-status` 长轮询等待结果。

**权衡**: 增加了系统复杂性，但显著改善用户体验。

### 2. 题目快照

**问题**: 题库题目可能被更新或删除，历史记录需要保持完整性

**方案**: `Practice` 表冗余存储练习时的题目标题、分类、类型、难度等字段（questionTitle, questionCategory 等）

### 3. 匿名用户支持

**问题**: 未注册用户也应能体验核心功能

**方案**: 匿名练习数据存 localStorage，注册后一键迁移。设置20次上限控制成本。

### 4. 多 AI 提供商热切换

**问题**: 单一 AI 服务可能不稳定、费用高

**方案**: 抽象 `AIProvider` 接口，`AI_PROVIDER` 环境变量控制路由。付费/免费用户使用不同提供商实现成本优化。

### 5. 幂等扣费

**问题**: 网络重试或用户重复提交可能导致重复扣费

**方案**: `UsageRecord.@@unique([sourceType, sourceId])` 数据库级别去重，保证每个练习/面试最多消费一次。
