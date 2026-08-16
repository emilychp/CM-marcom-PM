import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { SplitTool } from "@/app/admin/split-digital-comms/split-tool"

export default async function SplitDigitalCommsPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">傳播事務分類調整</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            把「溝通管理」分類底下屬於數位通路（官網、社群、電子報等）的專案，
            加上「數位傳播」分類標籤（歸在傳播事務模組下）。這個動作只會「加上」
            新標籤，不會移除原本的溝通管理標籤，也不會刪除任何資料，可以隨時再
            到專案頁面用「編輯分類」調整。
          </p>
        </div>
        <SplitTool />
      </main>
    </div>
  )
}
