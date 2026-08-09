import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export async function NavBar() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            專案儀表板
          </Link>
          {user && (
            <Link
              href="/my-projects"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              我的專案
            </Link>
          )}
          {user && (
            <Link
              href="/my-tasks"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              我的任務
            </Link>
          )}
          {user?.globalRole === "ADMIN" && (
            <Link
              href="/workload"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              人力分配
            </Link>
          )}
          {user?.globalRole === "ADMIN" && (
            <Link
              href="/admin/users"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              成員管理
            </Link>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Badge variant={user.globalRole === "ADMIN" ? "default" : "outline"}>
              {user.globalRole === "ADMIN" ? "系統管理員" : "一般成員"}
            </Badge>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.name?.slice(0, 1) ?? "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                登出
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
