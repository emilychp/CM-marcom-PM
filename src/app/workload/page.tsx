import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { WorkloadUserCard } from "@/components/workload-user-card"
import { getWorkloadSummary } from "@/lib/workload-data"

export default async function WorkloadPage() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.globalRole !== "ADMIN") notFound()

  const summary = await getWorkloadSummary()

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <NavBar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">人力分配</h1>
          <p className="text-sm text-muted-foreground">
            依進行中任務數量排序，點擊成員可展開查看細項，方便評估分配是否平均
          </p>
        </div>

        <div className="space-y-3">
          {summary.map((user) => (
            <WorkloadUserCard key={user.id} {...user} />
          ))}
        </div>
      </main>
    </div>
  )
}
