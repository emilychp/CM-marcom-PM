import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { NavLinks } from "@/components/nav-links"
import { LayoutDashboard, LogOut } from "lucide-react"

export async function NavBar() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-x-auto px-4 py-3 sm:gap-4">
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <Link
            href="/dashboard"
            title="專案儀表板"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-semibold tracking-tight"
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">專案儀表板</span>
          </Link>
          {user && <NavLinks isAdmin={user.globalRole === "ADMIN"} />}
        </div>
        {user && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Badge
              variant={user.globalRole === "ADMIN" ? "default" : "outline"}
              className="hidden sm:inline-flex"
            >
              {user.globalRole === "ADMIN" ? "系統管理員" : "一般成員"}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>{user.name?.slice(0, 1) ?? "U"}</AvatarFallback>
              </Avatar>
              <span className="hidden whitespace-nowrap text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                title="登出"
                className="gap-1.5 whitespace-nowrap text-muted-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">登出</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
