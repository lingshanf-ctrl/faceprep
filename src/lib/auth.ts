import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

// 密码强度验证
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: "密码至少需要6位" };
  }
  return { valid: true };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  // HTTPS 环境使用安全 Cookie（生产环境必须使用 HTTPS）
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
        name: { label: "姓名", type: "text" },
        action: { label: "操作", type: "text" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const name = credentials?.name as string;
        const action = credentials?.action as string;

        if (!email || !password) {
          throw new Error("请输入邮箱和密码");
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("邮箱格式不正确");
        }

        // 登录频率限制（仅针对登录操作）
        if (action !== "register") {
          const ip = request.headers.get("x-forwarded-for") || "unknown";
          const rateLimitKey = `${ip}:${email}`;
          const rateLimit = checkRateLimit(rateLimitKey);

          if (!rateLimit.success) {
            throw new Error(rateLimit.message || "登录尝试过于频繁，请稍后再试");
          }
        }

        if (action === "register") {
          // 检查用户是否已存在
          const existingUser = await db.user.findUnique({
            where: { email },
          });
          if (existingUser) {
            throw new Error("该邮箱已注册");
          }

          // 密码强度验证
          const passwordCheck = validatePassword(password);
          if (!passwordCheck.valid) {
            throw new Error(passwordCheck.message);
          }

          // 创建新用户
          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser = await db.user.create({
            data: {
              email,
              name: name || email.split("@")[0],
              password: hashedPassword,
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        } else {
          // 登录
          const user = await db.user.findUnique({
            where: { email },
          });
          if (!user || !user.password) {
            throw new Error("用户不存在");
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            throw new Error("密码错误");
          }

          // 登录成功，重置频率限制
          const ip = request?.headers?.get("x-forwarded-for") || "unknown";
          resetRateLimit(`${ip}:${email}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  logger: {
    error: (code, ...message) => {
      console.error("[Auth Error]", code, ...message);
    },
    warn: (code, ...message) => {
      console.warn("[Auth Warn]", code, ...message);
    },
    debug: (code, ...message) => {
      console.log("[Auth Debug]", code, ...message);
    },
  },
});
