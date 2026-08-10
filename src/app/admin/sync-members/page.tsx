import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { SyncTool } from "@/app/admin/sync-members/sync-tool"

export default async function SyncMembersPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">補上任務指派人的專案成員資格</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            一次性工具：找出所有「被指派任務、但沒有被加進專案成員」的人，補上成員資格讓他們能看到專案內容。之後新指派任務時系統會自動處理，不用再手動執行這個工具。
          </p>
        </div>
        <SyncTool />
      </main>
    </div>
  )
}
