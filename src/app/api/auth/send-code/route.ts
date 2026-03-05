import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 简单的内存频率限制存储（生产环境建议使用 Redis）
const smsRateLimit = new Map<string, number>();

// 每分钟清理一次过期的记录
setInterval(() => {
  const now = Date.now();
  const expireTime = 5 * 60 * 1000; // 5分钟过期
  for (const [key, timestamp] of smsRateLimit.entries()) {
    if (now - timestamp > expireTime) {
      smsRateLimit.delete(key);
    }
  }
}, 60000);

// 生成6位随机验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 模拟发送短信（实际项目中使用阿里云/腾讯云等短信服务）
async function sendSMS(phone: string, code: string): Promise<boolean> {
  // TODO: 集成实际短信服务
  // 例如：阿里云短信、腾讯云短信、Twilio 等

  // 开发环境：输出到控制台
  console.log(`[SMS] 发送验证码到 ${phone}: ${code}`);

  // 模拟成功
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // 验证手机号格式（中国大陆手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "请输入正确的手机号" },
        { status: 400 }
      );
    }

    // 频率限制：每个 IP 和手机号有独立的限制
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 简单的频率限制：使用内存存储（生产环境建议使用 Redis）
    const rateLimitKey = `sms:${ip}:${phone}`;

    // 检查该 IP+手机号的组合是否在短时间内多次请求
    const lastRequest = smsRateLimit.get(rateLimitKey);
    const now = Date.now();

    if (lastRequest && now - lastRequest < 60000) { // 1分钟内只能发送一次
      return NextResponse.json(
        { error: "发送过于频繁，请1分钟后再试" },
        { status: 429 }
      );
    }

    // 记录本次请求时间
    smsRateLimit.set(rateLimitKey, now);

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效期

    // 保存验证码到数据库
    await db.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // 发送短信
    const sent = await sendSMS(phone, code);

    if (!sent) {
      return NextResponse.json(
        { error: "短信发送失败，请重试" },
        { status: 500 }
      );
    }

    // 开发环境返回验证码（方便测试）
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      ...(isDev && { code }), // 开发环境返回验证码
    });
  } catch (error) {
    console.error("[Send Code Error]", error);
    return NextResponse.json(
      { error: "发送失败，请重试" },
      { status: 500 }
    );
  }
}
