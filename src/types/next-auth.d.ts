import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    email?: string | null;
    name?: string | null;
  }

  interface Session {
    user: {
      id: string;
      phone?: string | null;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phone?: string;
  }
}
