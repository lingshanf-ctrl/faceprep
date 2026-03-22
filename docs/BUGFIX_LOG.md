# Bug Fix 记录

记录项目中发现的 Bug、根本原因及修复方式。按时间倒序排列。

---

## 2026-03-22

### [CRITICAL] Baidu ASR Token 接口泄露 API Key

**文件**: `src/app/api/baidu-token/route.ts`

**现象**: `POST /api/baidu-token` 的响应体中包含 `appKey` 字段，值为服务端环境变量 `BAIDU_API_KEY` 的原始内容。任何已登录用户均可获取此 Key 并直接调用百度 API，消耗服务器配额。

**根本原因**: 开发时为方便前端调用百度 SDK 而将 Key 一并返回，未意识到 Key 应只用于服务端 OAuth 换取 `access_token`，前端只需临时令牌。

**修复**: 移除响应中的 `appKey` 字段，客户端只接收短期有效的 `accessToken`。

---

### [CRITICAL] Admin 鉴权中间件被注释，API 无保护

**文件**: `src/middleware.ts`

**现象**: `/api/admin/*` 路由（包括给用户充值的 `grant` 接口）的中间件鉴权逻辑被 `// TODO: 暂时关闭鉴权` 注释掉，实际上任何人均可调用。

**根本原因**: 开发联调阶段关闭鉴权便于测试，忘记恢复。

**修复**: 恢复中间件鉴权，要求请求头携带 `x-admin-token`；同时移除 `|| "hellodata"` 弱密码兜底，ADMIN_TOKEN 未配置时返回 503。

---

### [CRITICAL] claim-trial 接口无认证，可替任意用户领取积分

**文件**: `src/app/api/claim-trial/route.ts`

**现象**: `POST /api/claim-trial` 只需提供邮箱即可为该邮箱账户发放 3 次付费积分，无需登录验证。攻击者知道邮箱后可为其领取并"消耗"掉唯一的试用机会。

**根本原因**: 接口设计为"匿名领取"流程，通过邮箱识别用户，未考虑需要确认操作者身份。

**修复**: POST/GET 均加 `getSession()` 验证，并校验 `session.email === 请求邮箱`，确保用户只能为自己领取。

---

### [HIGH] ai/[id]/page.tsx 使用本地假评分，未调用真实 AI

**文件**: `src/app/(main)/practice/ai/[id]/page.tsx`

**现象**: AI 生成题目的答题页提交后，分数由本地关键词匹配（检测"首先"、"比如"等词）和 `setTimeout(1500ms)` 模拟延迟计算，结果写入数据库。用户看到的是伪造分数，但以为是 AI 评估结果。

**根本原因**: 功能开发初期使用 mock 数据占位，后续接入真实评估流程时遗漏了此页面。

**修复**: 替换为与 `questions/[id]/page.tsx` 相同的 `savePracticeRecord({ asyncEvaluate: true })` 流程，提交后跳转 `/practice/review/[id]` 由 review 页展示真实 AI 反馈。删除约 100 行死代码（本地评分逻辑 + feedback 展示 UI）。

---

### [HIGH] Bug 反馈 GET 接口无权限验证，任何人可读取所有用户反馈

**文件**: `src/app/api/feedback/bug/route.ts`

**现象**: `GET /api/feedback/bug` 返回全量用户 bug 反馈数据，无需登录。

**根本原因**: POST 接口（提交反馈）设计为匿名可用，GET 接口添加时沿用了同样的无鉴权结构，未区分读写权限。

**修复**: GET 接口加入 `verifyAdmin()` 检查，非管理员返回 401。

---

### [HIGH] Baidu Token 接口无任何访问控制

**文件**: `src/app/api/baidu-token/route.ts`

**现象**: `POST /api/baidu-token` 无需登录即可调用，可被滥用消耗百度 API 配额。

**根本原因**: 接口创建时仅考虑了语音功能的可用性，未添加访问控制。

**修复**: 加入 `getSession()` 验证，未登录用户返回 401。

---

### [HIGH] Bug 反馈 POST 接口无速率限制，可被刷库攻击

**文件**: `src/app/api/feedback/bug/route.ts`

**现象**: `POST /api/feedback/bug` 无频率限制，攻击者可无限提交垃圾反馈写满 `BugReport` 表。

**根本原因**: 反馈提交功能实现时未引入速率限制。

**修复**: 加入基于 IP 的 `checkRateLimit("bug-report:{ip}")` 限制。

---

### [HIGH] 试用领取非原子操作，创建成功但发券可能失败

**文件**: `src/app/api/claim-trial/route.ts`

**现象**: `trialClaim.create` 和 `membershipOrder.create` 是两步独立操作。若第一步成功第二步失败，用户看到"领取成功"但实际没有积分；且该用户的唯一领取机会已被消耗，无法再次领取。

**根本原因**: 两个写操作未包裹在数据库事务中。

**修复**: 改用 `db.$transaction([...])` 确保两步同时成功或同时回滚。

---

### [MEDIUM] 评估任务可能永久卡在 PROCESSING 状态

**文件**: `src/app/api/practices/evaluate/route.ts`

**现象**: 当 Phase 1（规则引擎）和 Phase 2（AI）均失败时，`evaluationStatus` 永久停留在 `PROCESSING`，用户看到无限"评估中"状态。

**根本原因**: Phase 2 耗尽重试后的清理逻辑仅处理了"有 Phase 1 结果"的情况（清除 `aiUpgrading` 标记），未覆盖"Phase 1 也失败导致无任何反馈"的边界情况。

**修复**: Phase 2 最终失败时，检查是否存在 feedback 字段。若无（Phase 1 也失败），将状态强制设为 `FAILED`，避免永久卡死。

---

### [MEDIUM] 用户枚举漏洞：claim-trial 接口暴露邮箱是否注册

**文件**: `src/app/api/claim-trial/route.ts`

**现象**: 未注册邮箱返回 `"该邮箱未注册，请先注册账户"`（HTTP 404），攻击者可批量探测哪些邮箱已注册，用于定向钓鱼。

**根本原因**: 为提升用户体验而给出了明确的错误原因，忽略了信息泄露风险。

**修复**: 统一改为 `"邮箱或账户信息有误，请确认后重试"`（HTTP 400），不区分"不存在"与"其他错误"。同时 GET 接口移除 `reason: "user_not_found"` 字段。

---

### [MEDIUM] 生产日志打印用户邮箱和 IP（PII 数据）

**文件**: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`

**现象**: 登录/注册成功日志包含用户邮箱和客户端 IP，如 `[Login Success] user@example.com from 1.2.3.4`。开发调试日志中还包含匿名 ID 等内部标识符。

**根本原因**: 开发阶段添加的调试日志未在上线前清理，且未意识到邮箱属于个人信息（PII）。

**修复**: 成功日志改为只记录内部 user ID（`user=xxx`），移除所有含邮箱、IP 的 debug 级日志。

---

### [MEDIUM] 对象 mutation：直接修改数据库返回对象的属性

**文件**: `src/app/(main)/interview/[id]/page.tsx`, `src/app/api/practices/evaluate/route.ts`

**现象 1**: `loadedSession.status = "in_progress"` 直接修改了从 store 返回的对象，导致 store 中的数据被悄然篡改。

**现象 2**: `parsed.aiUpgrading = false` 直接修改了 `JSON.parse` 结果对象。

**根本原因**: 未遵循不可变数据原则，直接在原对象上修改属性。

**修复**: 两处均改为扩展运算符创建新对象：`{ ...loadedSession, status: "in_progress" }`，`{ ...parsed, aiUpgrading: false, aiUpgradeFailed: true }`。

---

### [MEDIUM] ai-questions POST 无数组长度限制和字段校验

**文件**: `src/app/api/ai-questions/route.ts`

**现象**: 认证用户可提交包含任意数量题目的数组，触发大批量 `db.$transaction`；各字段无长度限制，可写入超长字符串。

**根本原因**: 接口实现时只校验了数组非空，未设置上限和字段格式约束。

**修复**: 加入 `MAX_QUESTIONS = 20` 上限；对 `title`（500字符）、`keyPoints`（2000字符）加长度校验；`title` 写入前执行 `.trim()`。

---

### [LOW] /admin 页面路由仅靠前端鉴权，可直接访问

**文件**: `src/middleware.ts`

**现象**: `/admin` 及子路由的访问控制完全依赖前端组件逻辑，直接在浏览器地址栏输入 URL 即可绕过。

**根本原因**: middleware 的 matcher 只覆盖了 `/api/admin`，未包含页面路由。

**修复**: matcher 增加 `/admin/:path*`；middleware 检查 `session-token` cookie 是否存在，无 cookie 则重定向至首页。完整的管理员角色验证仍由各页面组件通过 `verifyAdmin()` 完成。

---

### [LOW] interview 页面使用 alert() 展示错误

**文件**: `src/app/(main)/interview/[id]/page.tsx`

**现象**: 完成面试失败时调用原生 `alert()`，在移动端会阻塞交互，与全站 UI 风格不一致。

**根本原因**: 快速实现时使用了最简单的错误提示方式。

**修复**: 改为 `submitError` state + 内联错误 banner（`bg-red-50` 样式卡片），与其他页面的错误提示风格保持一致。

---

### [LOW] Admin Token 有弱密码兜底值

**文件**: `src/middleware.ts`

**现象**: `process.env.ADMIN_TOKEN || "hellodata"`，若环境变量未配置，系统使用公开已知的弱密码作为 Admin Token。

**根本原因**: 开发阶段为避免频繁配置环境变量而设置了兜底默认值。

**修复**: 移除兜底值，`ADMIN_TOKEN` 未配置时返回 503 明确提示配置缺失，强制要求生产环境配置正确的密钥。
