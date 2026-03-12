import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  error?: string;
}

/**
 * 验证当前用户是否是管理员
 * 使用用户会话验证，不再使用 token
 */
export async function verifyAdmin(req: NextRequest): Promise<AdminAuthResult> {
  try {
    const session = await getSession();

    if (!session) {
      return { isAdmin: false, error: "Unauthorized" };
    }

    // 查询用户是否管理员
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      return { isAdmin: false, error: "User not found" };
    }

    if (!user.isAdmin) {
      return { isAdmin: false, error: "Forbidden: Admin access required" };
    }

    return { isAdmin: true, userId: user.id };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { isAdmin: false, error: "Authentication failed" };
  }
}
