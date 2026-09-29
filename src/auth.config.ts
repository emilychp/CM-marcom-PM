import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Vercel auto-trusts its own hostname; a self-hosted deploy behind an
  // internal reverse proxy has no such platform to detect, so Auth.js needs
  // this explicitly or it rejects requests as a possible host-header attack.
  trustHost: true,
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
