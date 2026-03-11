import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, { status: string; error?: string }> = {};

  // Check JWT_SECRET
  try {
    const secret = process.env.JWT_SECRET;
    checks.jwt_secret = {
      status: secret ? `configured (${secret.substring(0, 10)}...)` : "missing",
    };
  } catch (e) {
    checks.jwt_secret = { status: "error", error: String(e) };
  }

  // Check DATABASE_URL
  try {
    const dbUrl = process.env.DATABASE_URL;
    checks.database_url = {
      status: dbUrl ? "configured" : "missing",
    };
  } catch (e) {
    checks.database_url = { status: "error", error: String(e) };
  }

  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database_connection = { status: "ok" };
  } catch (e) {
    checks.database_connection = {
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // Check user count
  try {
    const count = await db.user.count();
    checks.user_count = { status: `ok (${count} users)` };
  } catch (e) {
    checks.user_count = {
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const hasErrors = Object.values(checks).some((c) => c.status.startsWith("error"));

  return NextResponse.json(
    {
      status: hasErrors ? "error" : "ok",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: hasErrors ? 500 : 200 }
  );
}
