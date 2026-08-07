import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname.startsWith("/login")

      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(
          new URL(
            `/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`,
            nextUrl.origin
          )
        )
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin))
      }

      return true
    },
  },
} satisfies NextAuthConfig
