import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { getAllUsers } from "@/lib/users-data"
import { ImportTool } from "@/app/admin/import-marcom-calendar/import-tool"

export default async function ImportMarcomCalendarPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  const users = await getAllUsers()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">匯入 Marcom Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            一次性工具：把 Notion 上的 Marketing Communications &amp; PR Calendar
            匯入成專案，方便跟目前的專案管理系統一起檢核。每筆會建立一個新專案，
            狀態／優先度會對應轉換，Type／目標受眾／宣傳管道會存成該專案的自訂欄位。
            已存在同名專案的項目會標示出來，可以取消勾選避免重複建立。
          </p>
        </div>
        <ImportTool users={users} defaultOwnerId={session.user.id} />
      </main>
    </div>
  )
}
