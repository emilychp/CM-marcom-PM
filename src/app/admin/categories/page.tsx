import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { getProjectFieldDefinitionsWithSamples } from "@/app/admin/categories/actions"
import { BackfillTool } from "@/app/admin/categories/backfill-tool"

export default async function CategoryBackfillPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  const fieldDefs = await getProjectFieldDefinitionsWithSamples()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">舊分類資料對應</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            一次性工具：選擇原本存放專案類別的自訂欄位，預覽並套用對應到新的分類標籤。套用後可安全重複執行（已對應過的專案不會重複加入）。
          </p>
        </div>
        <BackfillTool fieldDefs={fieldDefs} />
      </main>
    </div>
  )
}
