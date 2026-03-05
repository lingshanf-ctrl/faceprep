import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "手机号", type: "tel" },
        code: { label: "验证码", type: "text" },
        name: { label: "姓名", type: "text" },
        action: { label: "操作", type: "text" },
      },
      async authorize(credentials, request) {
        const phone = credentials?.phone as string;
        const code = credentials?.code as string;
        const name = credentials?.name as string;
        const action = credentials?.action as string;

        if (!phone || !code) {
          throw new Error("请输入手机号和验证码");
        }

        // 验证手机号格式（中国大陆手机号）
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          throw new Error("请输入正确的手机号");
        }

        // 验证验证码格式
        if (!/^\d{6}$/.test(code)) {
          throw new Error("验证码格式不正确");
        }

        // 登录频率限制
        if (action !== "register") {
          const ip = request.headers.get("x-forwarded-for") || "unknown";
          const rateLimitKey = `${ip}:${phone}`;
          const rateLimit = checkRateLimit(rateLimitKey);

          if (!rateLimit.success) {
            throw new Error(rateLimit.message || "登录尝试过于频繁，请稍后再试");
          }
        }

        // 查找最新的未使用验证码
        const verificationCode = await db.verificationCode.findFirst({
          where: {
            phone,
            code,
            used: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!verificationCode) {
          throw new Error("验证码错误或已过期");
        }

        // 标记验证码为已使用
        await db.verificationCode.update({
          where: { id: verificationCode.id },
          data: { used: true },
        });

        // 查找用户
        let user = await db.user.findUnique({
          where: { phone },
        });

        if (action === "register" || !user) {
          // 如果是注册或用户不存在，创建新用户
          if (!user) {
            user = await db.user.create({
              data: {
                phone,
                name: name || `用户${phone.slice(-4)}`,
                email: null,
              },
            });
          }
        }

        if (!user) {
          throw new Error("用户创建失败");
        }

        // 登录成功，重置频率限制
        const ip = request?.headers?.get("x-forwarded-for") || "unknown";
        resetRateLimit(`${ip}:${phone}`);

        return {
          id: user.id,
          phone: user.phone || phone,
          email: user.email,
          name: user.name,
        };
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
        token.phone = user.phone || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
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
