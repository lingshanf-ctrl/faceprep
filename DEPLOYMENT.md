# FacePrep 部署文档

## 生产环境信息

### 域名与访问
- **主域名**: https://faceprep.top
- **Vercel 项目**: faceprep (lingshanf-7595s-projects)
- **部署区域**: Singapore (与数据库同区域)

### 数据库配置

#### 当前使用: Vercel Postgres
- **类型**: Vercel Postgres (Neon)
- **区域**: Singapore (ap-southeast-1)
- **连接方式**: `POSTGRES_PRISMA_URL` (由 Vercel 自动管理)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}
```

### 必需环境变量

#### 认证
- `JWT_SECRET` - JWT 签名密钥

#### AI 服务
- `AI_PROVIDER` - AI 提供商 (qwen/deepseek/openai)
- `QWEN_API_KEY` - 通义千问 API Key
- `KIMI_API_KEY` - Kimi API Key

#### 语音识别 (可选)
- `BAIDU_API_KEY` - 百度语音识别
- `BAIDU_SECRET_KEY` - 百度语音识别 Secret

### 部署命令
```bash
npx vercel --prod
```

### 历史问题

#### 2024-03-11 数据库连接问题
**问题**: 生产环境登录/注册失败
**原因**: Supabase 网络限制 + 缺少 JWT_SECRET
**解决**: 改用 Vercel Postgres + 添加 JWT_SECRET
