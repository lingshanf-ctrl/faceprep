# 🚀 Job Pilot 生产环境部署指南

## 📦 构建成功！

生产版本已构建完成，构建输出位于 `.next` 目录。

---

## ✅ 本次发布的优化内容

### 1. 🎙️ 语音输入优化
- ✅ 添加逐字动画效果（打字机模式）
- ✅ 优化视觉反馈和状态指示
- ✅ 改进按钮样式和交互体验
- ✅ 去除不必要的 G/B 切换按钮

### 2. 🔐 认证系统修复
- ✅ 添加 `NEXTAUTH_URL` 配置
- ✅ 修复 "configuration" 错误
- ✅ 更新 `AUTH_SECRET` 为更安全的值
- ✅ 优化 Cookie 安全配置

### 3. 🎨 样式优化
- ✅ 改进音频波形动画
- ✅ 优化状态指示器样式
- ✅ 增强按钮视觉效果

---

## 🌐 部署到生产环境

### 方式一：部署到现有服务器

#### 1. 上传代码到服务器

```bash
# 本地打包
tar -czf job-pilot-build.tar.gz .next public package.json package-lock.json prisma

# 上传到服务器
scp job-pilot-build.tar.gz user@faceprep.top:/path/to/app/

# 或使用 Git
git add .
git commit -m "Release: 优化语音输入和修复认证问题"
git push origin main
```

#### 2. 在服务器上解压和安装

```bash
ssh user@faceprep.top
cd /path/to/app/

# 如果是 tar 包
tar -xzf job-pilot-build.tar.gz

# 如果是 Git
git pull origin main

# 安装依赖（仅生产依赖）
npm install --production

# 生成 Prisma Client
npx prisma generate
```

#### 3. 配置环境变量

在服务器上创建或更新 `.env` 文件：

```bash
nano .env
```

**必需的环境变量：**
```bash
# ⚠️ 生产环境必需
NEXTAUTH_URL="https://faceprep.top"
AUTH_SECRET="VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u"
NODE_ENV="production"

# 数据库
DATABASE_URL="postgresql://postgres:fLQMFCRnB0x1RGOj@db.uivwegdanioelomrdqqw.supabase.co:5432/postgres"

# AI Provider
AI_PROVIDER="qwen"
QWEN_API_KEY="sk-dd250e3a7a024137bf36034a0f45efdd"

# 百度语音识别（可选）
BAIDU_API_KEY="xOdSqTSxLfpS6gsmus7lzjZh"
BAIDU_SECRET_KEY="YP5ER9juzIxvpSLmcBgDyjwb1pWoxN8c"
```

#### 4. 启动应用

**使用 PM2（推荐）：**
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "job-pilot" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs job-pilot

# 重启应用
pm2 restart job-pilot
```

**使用 Systemd：**
```bash
# 创建服务文件
sudo nano /etc/systemd/system/job-pilot.service

# 内容：
[Unit]
Description=Job Pilot HR Interview App
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable job-pilot
sudo systemctl start job-pilot
sudo systemctl status job-pilot
```

**直接运行：**
```bash
# 前台运行
npm start

# 后台运行
nohup npm start > app.log 2>&1 &
```

---

### 方式二：部署到 Vercel（最简单）

#### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Release: 生产版本"
git push origin main
```

#### 2. 导入到 Vercel

1. 访问 [https://vercel.com/new](https://vercel.com/new)
2. 选择你的 GitHub 仓库
3. 点击 "Import"
4. 配置环境变量（见下方）
5. 点击 "Deploy"

#### 3. 配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

```
NEXTAUTH_URL = https://your-domain.vercel.app
AUTH_SECRET = VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u
NODE_ENV = production
DATABASE_URL = postgresql://...
AI_PROVIDER = qwen
QWEN_API_KEY = sk-...
BAIDU_API_KEY = ...
BAIDU_SECRET_KEY = ...
```

#### 4. 绑定自定义域名

1. 在 Vercel Dashboard → Settings → Domains
2. 添加 `faceprep.top`
3. 按照提示配置 DNS：
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

### 方式三：部署到 Docker

#### 1. 创建 Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建应用
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build

# 运行应用
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_URL=https://faceprep.top
      - AUTH_SECRET=VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - AI_PROVIDER=qwen
      - QWEN_API_KEY=sk-...
      - BAIDU_API_KEY=...
      - BAIDU_SECRET_KEY=...
    restart: unless-stopped
```

#### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 🔧 Nginx 反向代理配置

如果使用自己的服务器，需要配置 Nginx：

```nginx
server {
    listen 80;
    server_name faceprep.top www.faceprep.top;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name faceprep.top www.faceprep.top;

    # SSL 证书
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 代理到 Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL 证书配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d faceprep.top -d www.faceprep.top

# 自动续期
sudo certbot renew --dry-run
```

---

## ✅ 部署后验证清单

### 1. 测试认证系统
- [ ] 访问 `https://faceprep.top/register`
- [ ] 注册新用户
- [ ] 登录测试
- [ ] 退出登录测试

### 2. 测试语音输入
- [ ] 访问任意题目页面
- [ ] 点击"语音输入"按钮
- [ ] 说话并停止
- [ ] 验证逐字动画效果 ✨

### 3. 测试核心功能
- [ ] 浏览题库
- [ ] 答题和获取反馈
- [ ] 查看历史记录
- [ ] 收藏题目
- [ ] AI生成题目

### 4. 检查性能
- [ ] 首页加载时间 < 2秒
- [ ] 语音识别延迟 < 1秒
- [ ] 页面切换流畅

### 5. 检查安全性
- [ ] HTTPS 正常工作
- [ ] Cookie 设置为 Secure
- [ ] 没有暴露敏感信息

---

## 📊 监控和日志

### 查看应用日志

**PM2：**
```bash
pm2 logs job-pilot
pm2 logs job-pilot --lines 100
```

**Docker：**
```bash
docker-compose logs -f
docker-compose logs --tail=100
```

**Systemd：**
```bash
sudo journalctl -u job-pilot -f
sudo journalctl -u job-pilot -n 100
```

### 性能监控

**PM2 监控：**
```bash
pm2 monit
```

**Vercel Analytics：**
- 在 Vercel Dashboard 自动启用

---

## 🐛 常见问题排查

### 问题1：页面显示 "configuration" 错误

**检查：**
```bash
# 确认环境变量
echo $NEXTAUTH_URL
echo $AUTH_SECRET

# 应该输出：
# https://faceprep.top
# VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u
```

**修复：**
```bash
# 设置环境变量
export NEXTAUTH_URL="https://faceprep.top"
export AUTH_SECRET="VGhpc0lzQVNlY3VyZVJhbmRvbUtleUZvckF1dGhlbnRpY2F0aW9u"

# 重启应用
pm2 restart job-pilot
```

### 问题2：数据库连接失败

**检查：**
```bash
# 测试数据库连接
npx prisma db pull
```

**修复：**
- 确认 DATABASE_URL 正确
- 检查数据库服务器是否运行
- 验证网络连接

### 问题3：语音输入不工作

**原因：**
- 需要 HTTPS 环境
- 麦克风权限被拒绝

**修复：**
- 确保使用 HTTPS
- 在浏览器中允许麦克风权限
- 检查域名是否在 HTTPS 下

### 问题4：页面加载慢

**优化：**
```bash
# 检查构建是否优化
npm run build

# 查看构建报告
```

---

## 📦 版本信息

```
版本: 1.0.0
构建时间: 2026-03-04
Node.js: 20.x
Next.js: 16.1.6
```

---

## 🔄 更新部署

当有新版本时：

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 重启
pm2 restart job-pilot
```

---

## 🎉 部署完成！

访问你的网站：**https://faceprep.top**

享受全新的语音输入体验！✨
