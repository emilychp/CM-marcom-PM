import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { ProjectBoard } from "@/components/project-board"
import { getMyProjects } from "@/lib/projects-data"

export default async function MyProjectsPage() {
  const session = await auth()
  if (!session?.user) return null

  const projects = await getMyProjects(session.user.id)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">我的專案</h1>
          <p className="text-sm text-muted-foreground">
            共 {projects.length} 個你負責的專案・拖曳卡片右上角圖示可調整順序
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center text-muted-foreground">
            <p>目前沒有你負責的專案</p>
          </div>
        ) : (
          <ProjectBoard projects={projects} sortable />
        )}
      </main>
    </div>
  )
}
