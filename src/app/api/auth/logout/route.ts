import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Logout Error]", error);
    return NextResponse.json(
      { error: "登出失败" },
      { status: 500 }
    );
  }
}
