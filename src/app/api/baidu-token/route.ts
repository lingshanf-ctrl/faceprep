import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Edge Runtime 配置 - 在亚洲节点运行
export const runtime = 'edge';
export const preferredRegion = ['hkg1', 'sin1', 'kix1', 'icn1'];

// 百度语音识别配置
// 需要在环境变量中配置 BAIDU_API_KEY、BAIDU_SECRET_KEY 和 BAIDU_APP_ID
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || "";
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || "";
const BAIDU_APP_ID = process.env.BAIDU_APP_ID || "";

interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

/**
 * 获取百度语音识别 Token
 * POST /api/baidu-token
 */
export async function POST(request: NextRequest) {
  try {
    // 需要登录才能获取 Token，防止未授权滥用服务配额
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查配置
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return NextResponse.json(
        { error: "百度语音识别未配置，请设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY" },
        { status: 503 }
      );
    }

    // 调用百度 API 获取 Token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const data: BaiduTokenResponse = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error_description || data.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      appId: BAIDU_APP_ID,
      // appKey 不返回客户端，避免 API 密钥泄露
    });
  } catch (error) {
    console.error("Baidu token error:", error);
    return NextResponse.json(
      { error: "获取百度语音 Token 失败" },
      { status: 500 }
    );
  }
}
