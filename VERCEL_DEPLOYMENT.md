# 🚀 Vercel 部署完整指南

## ✅ 准备工作已完成

- [x] 代码已构建并优化
- [x] Git 仓库已初始化
- [x] 代码已提交到本地 Git
- [x] 部署文档已创建

---

## 📝 第一步：创建 GitHub 仓库并推送代码

### 1. 在 GitHub 创建新仓库

访问：https://github.com/new

**配置：**
- Repository name: `job-pilot` 或 `hr-interview-ai`
- Description: `HR AI 面试准备系统 - 智能面试问答平台`
- Visibility: Public 或 Private（都可以）
- ❌ **不要**勾选 "Add a README file"
- ❌ **不要**勾选 "Add .gitignore"
- ❌ **不要**选择 License

点击 **"Create repository"**

### 2. 连接并推送到 GitHub

创建仓库后，GitHub 会显示命令。复制并在项目目录执行：

```bash
# 进入项目目录
cd "C:\Users\zhous\aiProjects\hr-ai\job-pliot"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/job-pilot.git

# 或者使用 SSH（如果配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/job-pilot.git

# 推送代码
git branch -M main
git push -u origin main
```

**示例：**
```bash
# 假设你的用户名是 zhangsan
git remote add origin https://github.com/zhangsan/job-pilot.git
git branch -M main
git push -u origin main
```

输入 GitHub 用户名和密码（或 Personal Access Token）完成推送。

---

## 🚀 第二步：在 Vercel 部署

### 1. 访问 Vercel

打开：https://vercel.com/login

使用以下任一方式登录：
- GitHub 账号（推荐）
- GitLab
- Bitbucket
- Email

**推荐使用 GitHub 账号登录**，这样可以直接访问你的仓库。

### 2. 导入项目

登录后，点击 **"Add New..." → "Project"**

或直接访问：https://vercel.com/new

选择你刚才创建的仓库：`job-pilot`

### 3. 配置项目

**Framework Preset:** Next.js（自动检测）

**Root Directory:** ./（保持默认）

**Build and Output Settings:**
- Build Command: `npm run build`（默认）
- Output Directory: `.next`（默认）
- Install Command: `npm install`（默认）

### 4. 配置环境变量 ⚠️ **重要**

在 "Environment Variables" 部分，添加以下变量：

点击 "Add" 按钮，逐个添加：

#### 必需的环境变量：

```bash
# 1. NextAuth 配置（必需）
NEXTAUTH_URL
https://your-app-name.vercel.app
# 注意：部署后会自动分配域名，先填这个，稍后更新为 faceprep.top

AUTH_SECRET
VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u

NODE_ENV
production

# 2. 数据库（必需）
DATABASE_URL
postgresql://postgres:fLQMFCRnB0x1RGOj@db.uivwegdanioelomrdqqw.supabase.co:5432/postgres

# 3. AI Provider（必需）
AI_PROVIDER
qwen

QWEN_API_KEY
sk-dd250e3a7a024137bf36034a0f45efdd

# 4. 百度语音识别（可选）
BAIDU_API_KEY
xOdSqTSxLfpS6gsmus7lzjZh

BAIDU_SECRET_KEY
YP5ER9juzIxvpSLmcBgDyjwb1pWoxN8c
```

**添加方式：**
1. 在 "Key" 输入框输入变量名（如 `NEXTAUTH_URL`）
2. 在 "Value" 输入框输入变量值
3. 点击 "Add" 按钮
4. 重复以上步骤添加所有变量

### 5. 开始部署

点击 **"Deploy"** 按钮

等待部署完成（通常 2-3 分钟）

---

## 🎉 第三步：部署成功后配置

### 1. 查看部署的网站

部署成功后会显示：

```
🎉 Congratulations!
Your project has been successfully deployed.

Visit: https://job-pilot-xyz123.vercel.app
```

点击链接访问你的网站！

### 2. 绑定自定义域名 `faceprep.top`

#### A. 在 Vercel 添加域名

1. 进入项目 Dashboard
2. 点击 "Settings" → "Domains"
3. 输入 `faceprep.top`
4. 点击 "Add"

#### B. 配置 DNS

Vercel 会显示需要配置的 DNS 记录：

**类型 A 记录：**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**类型 CNAME 记录（www 子域名）：**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**去你的域名服务商（如阿里云、腾讯云、GoDaddy）配置这些 DNS 记录。**

#### C. 等待 DNS 生效

DNS 配置后通常需要等待几分钟到几小时生效。

Vercel 会自动检测，生效后会显示绿色勾号 ✅

#### D. 更新 NEXTAUTH_URL

DNS 生效后，需要更新环境变量：

1. 在 Vercel Dashboard → Settings → Environment Variables
2. 找到 `NEXTAUTH_URL`
3. 点击 "Edit"
4. 将值改为：`https://faceprep.top`
5. 点击 "Save"
6. 重新部署（Deployments → 最新部署 → "..." → "Redeploy"）

---

## ✅ 第四步：验证部署

### 1. 访问网站

```
https://faceprep.top
```

### 2. 测试认证

- 访问 https://faceprep.top/register
- 注册一个测试账号
- 登录测试

### 3. 测试语音输入 ⭐

- 登录后进入任意题目
- 点击"语音输入"
- 说话并停止
- **验证逐字动画效果**

### 4. 检查其他功能

- 浏览题库
- 答题并获取反馈
- 查看历史记录
- 收藏题目

---

## 🔧 常见问题

### Q1: 部署失败怎么办？

**检查：**
1. 环境变量是否都已添加
2. 构建日志中的错误信息
3. 数据库连接是否正常

**查看日志：**
Deployments → 失败的部署 → "View Build Logs"

### Q2: 页面显示 500 错误

**原因：**
- 环境变量配置错误
- 数据库连接失败

**修复：**
1. 检查 Vercel 环境变量
2. 检查 DATABASE_URL 是否正确
3. 重新部署

### Q3: 登录显示 "configuration" 错误

**原因：**
- `NEXTAUTH_URL` 未设置或错误
- `AUTH_SECRET` 未设置

**修复：**
1. 确认环境变量已设置
2. 确认 NEXTAUTH_URL 使用 HTTPS
3. 重新部署

### Q4: 语音输入不工作

**原因：**
- 需要 HTTPS（Vercel 自动提供）
- 浏览器不支持

**修复：**
1. 确认使用 Chrome/Edge 浏览器
2. 确认网站使用 HTTPS
3. 允许浏览器麦克风权限

### Q5: 如何查看实时日志？

**方法：**
1. Vercel Dashboard → 项目
2. 点击 "Deployments"
3. 点击最新的部署
4. 点击 "Functions" 查看函数日志
5. 点击 "Runtime Logs" 查看实时日志

---

## 🔄 后续更新流程

当你修改代码后：

```bash
# 1. 提交更改
git add .
git commit -m "Update: 你的更新说明"

# 2. 推送到 GitHub
git push origin main

# 3. Vercel 自动部署！
```

Vercel 会自动检测 GitHub 的推送并触发新的部署，无需手动操作！

---

## 📊 监控和分析

### Vercel Analytics（免费）

1. 在项目 Settings → Analytics
2. 点击 "Enable Analytics"
3. 查看：
   - 页面访问量
   - 性能指标
   - 用户地理分布

### Vercel Speed Insights

1. Settings → Speed Insights
2. 启用后可查看：
   - Core Web Vitals
   - 页面加载时间
   - 性能优化建议

---

## 🎯 优化建议

### 1. 配置 Caching

Vercel 自动处理，无需配置。

### 2. 配置 Redirects（可选）

在项目根目录创建 `vercel.json`：

```json
{
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### 3. 配置 Edge Functions（可选）

某些 API 可以部署到边缘节点以降低延迟。

---

## 📞 支持

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **部署问题**: 查看 Vercel Dashboard 的日志

---

## 🎉 恭喜！

你的 HR AI 面试系统已成功部署到 Vercel！

**网站地址**: https://faceprep.top

享受全新的语音输入体验吧！✨
