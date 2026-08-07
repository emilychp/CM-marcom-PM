import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      globalRole: "ADMIN" | "MEMBER"
    } & DefaultSession["user"]
  }

  interface User {
    globalRole?: "ADMIN" | "MEMBER"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    globalRole?: "ADMIN" | "MEMBER"
  }
}
