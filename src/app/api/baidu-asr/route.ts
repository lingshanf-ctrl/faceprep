import { NextRequest, NextResponse } from "next/server";

// Edge Runtime 配置 - 在亚洲节点运行
export const runtime = 'edge';
export const preferredRegion = ['hkg1', 'sin1', 'kix1', 'icn1'];

// 百度语音识别配置
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || "";
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || "";

// 缓存 token
let cachedToken: { token: string; expiresAt: number } | null = null;

// 获取百度 Token（带缓存）
async function getBaiduToken(): Promise<string> {
  // 检查缓存是否有效（提前5分钟过期）
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`获取 token 失败: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  // 缓存 token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

// WebM 转 WAV 格式（简化版 - 直接调整采样率）
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  // Edge Runtime 中无法使用 AudioContext 进行复杂转换
  // 这里我们直接返回原始音频，因为百度 API 实际上支持多种格式
  // 如果必须 WAV，可以在浏览器端完成转换
  return audioBlob;
}

/**
 * 百度语音识别 API
 * POST /api/baidu-asr
 * Content-Type: multipart/form-data
 * Body: { audio: File }
 */
export async function POST(request: NextRequest) {
  try {
    // 检查配置
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return NextResponse.json(
        { error: "百度语音识别未配置", err_no: -1 },
        { status: 503 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        { error: "缺少音频文件", err_no: -1 },
        { status: 400 }
      );
    }

    // 检查文件大小（最小 100 bytes，最大 10MB）
    if (audioFile.size < 100) {
      return NextResponse.json(
        { error: "音频文件太小", err_no: -1 },
        { status: 400 }
      );
    }
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "音频文件过大，请控制在 10MB 以内", err_no: -1 },
        { status: 400 }
      );
    }

    // 获取 token
    let token: string;
    try {
      token = await getBaiduToken();
    } catch (err) {
      return NextResponse.json(
        { error: "获取授权失败", err_no: -1 },
        { status: 503 }
      );
    }

    // 获取音频数据
    const audioBuffer = await audioFile.arrayBuffer();

    // 获取语言参数
    const language = formData.get("language") as string || "zh";

    // 调用百度语音识别 API
    // dev_pid=1537 表示普通话（带标点），dev_pid=1737 表示英语
    const devPid = language === "en" ? "1737" : "1537";
    const asrUrl = `https://vop.baidu.com/server_api?dev_pid=${devPid}&cuid=job-pilot-client&token=${token}`;

    // 根据文件类型确定格式
    // 百度语音 REST API 支持的格式: pcm, wav, amr, m4a
    const contentType = audioFile.type || '';
    console.log(`音频 Content-Type: ${contentType}`);

    let format: string;
    let headerContentType: string;

    if (contentType.includes('wav')) {
      format = 'wav';
      headerContentType = 'audio/wav; rate=16000';
    } else if (contentType.includes('mp4') || contentType.includes('m4a')) {
      format = 'm4a';
      headerContentType = 'audio/m4a; rate=16000';
    } else if (contentType.includes('amr')) {
      format = 'amr';
      headerContentType = 'audio/amr; rate=16000';
    } else {
      // 默认使用 wav（前端应该已经转换）
      format = 'wav';
      headerContentType = 'audio/wav; rate=16000';
    }

    console.log(`识别音频: ${audioFile.name}, 格式: ${format}, Content-Type: ${headerContentType}, 大小: ${audioFile.size} bytes`);

    const asrResponse = await fetch(asrUrl, {
      method: "POST",
      headers: {
        "Content-Type": headerContentType,
      },
      body: audioBuffer,
    });

    if (!asrResponse.ok) {
      return NextResponse.json(
        { error: `识别请求失败: ${asrResponse.status}`, err_no: -1 },
        { status: 502 }
      );
    }

    const result = await asrResponse.json();

    // 返回百度 API 的原始响应
    return NextResponse.json(result);

  } catch (error) {
    console.error("Baidu ASR error:", error);
    return NextResponse.json(
      {
        error: "语音识别服务内部错误",
        err_no: -1,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
