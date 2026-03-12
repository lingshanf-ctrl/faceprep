# FacePrep - AI 面试准备平台

<p align="center">
  <b>AI 驱动的面试准备平台</b><br/>
  面向中国求职者的智能面试练习与反馈系统
</p>

<p align="center">
  <a href="https://faceprep.top">在线演示</a> •
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a>
</p>

---

## 功能特性

### 核心功能
- **68 道精选面试题** - 涵盖前端、后端、产品、设计、运营等岗位
- **AI 智能评估** - 多维度评分（内容覆盖、结构逻辑、表达专业、综合亮点）
- **语音输入支持** - 支持语音识别输入答案（Web Speech API + 百度 ASR 降级）
- **模拟面试** - 基于简历和 JD 生成个性化面试题
- **进度追踪** - 练习历史、能力分析、薄弱点识别

### 会员体系
- **免费版** - 基础分析、关键词覆盖检查
- **次卡** - 按需付费，灵活使用
- **月卡** - 无限次数，畅享完整 AI 评估

### 管理后台
- 用户管理
- 会员管理（次卡/月卡发放）
- 数据分析（转化率、使用统计）
- 会员状态修复工具

---

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16.1.6 (App Router + Turbopack) |
| **语言** | TypeScript 5.9.3 |
| **样式** | Tailwind CSS 3.4.19 |
| **UI 组件** | shadcn/ui |
| **数据库** | PostgreSQL + Prisma ORM 5.22.0 |
| **认证** | JWT + jose |
| **AI 提供商** | DeepSeek / OpenAI / Qwen |
| **部署** | Vercel |

---

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/lingshanf-ctrl/faceprep.git
cd faceprep
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```env
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobpilot"

# JWT 密钥（至少 32 位）
JWT_SECRET="your-super-secret-key-min-32-chars"

# AI 提供商（三选一）
AI_PROVIDER="qwen"  # 或 "deepseek" / "openai"
QWEN_API_KEY="your-qwen-api-key"
# DEEPSEEK_API_KEY="your-deepseek-api-key"
# OPENAI_API_KEY="your-openai-api-key"

# 可选 - 语音识别
BAIDU_API_KEY=""
BAIDU_SECRET_KEY=""
```

4. **启动数据库**
```bash
docker-compose up -d
```

5. **初始化数据库**
```bash
npx prisma migrate dev
npx prisma db seed
```

6. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000

---

## 项目结构

```
faceprep/
├── prisma/                 # 数据库 Schema 和种子数据
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # 登录、注册页面
│   │   ├── (main)/        # 主应用页面（dashboard、练习等）
│   │   ├── api/           # API 路由
│   │   └── admin/         # 管理后台
│   ├── components/        # React 组件
│   │   ├── feedback/      # 反馈相关组件
│   │   └── ui/            # UI 组件
│   ├── lib/               # 工具库
│   │   ├── ai/            # AI 提供商集成
│   │   ├── db.ts          # Prisma 客户端
│   │   └── session.ts     # JWT 会话管理
│   └── data/              # 静态数据（68道题目）
├── public/                # 静态资源
└── docker-compose.yml     # 开发环境配置
```

---

## 关键功能实现

### AI 反馈系统
- 多提供商支持（DeepSeek/OpenAI/Qwen）
- 结构化 JSON 输出（评分、优点、改进点、建议）
- 异步评估（避免阻塞页面）
- 流式响应支持

### 认证流程
- JWT 无状态认证
- HTTP-only Cookie
- 30 天会话过期
- 速率限制（5 分钟 5 次失败锁定 15 分钟）

### 数据库设计
- **User** - 用户账户、套餐等级
- **Question** - 68 道预设面试题
- **Practice** - 练习记录、AI 反馈
- **InterviewSession** - 模拟面试会话
- **MembershipOrder** - 会员订单管理

---

## 部署

### Vercel 部署

1. **Fork 仓库** 或推送到你的 GitHub

2. **导入 Vercel**
   - 访问 https://vercel.com/new
   - 导入 GitHub 仓库

3. **配置环境变量**
   - 在 Vercel Dashboard → Settings → Environment Variables 中添加所需变量

4. **配置数据库**
   - 使用 Vercel Postgres 或 Neon 等 PostgreSQL 服务
   - 更新 `DATABASE_URL`

5. **部署**
   - 自动部署触发

---

## 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m "feat: xxx"`
4. 推送到分支：`git push origin feature/xxx`
5. 创建 Pull Request

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues: https://github.com/lingshanf-ctrl/faceprep/issues

---

<p align="center">
  Made with ❤️ for job seekers
</p>
