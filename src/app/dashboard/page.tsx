import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { ProjectCard } from "@/components/project-card"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { StatusFilter } from "./status-filter"
import { getProjectsForUser } from "@/lib/projects-data"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (!session?.user) return null

  const params = await searchParams
  const statusFilter =
    typeof params.status === "string" ? params.status : undefined

  const allProjects = await getProjectsForUser(session.user)
  const projects = statusFilter
    ? allProjects.filter((p) => p.status === statusFilter)
    : allProjects

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">專案總覽</h1>
            <p className="text-sm text-muted-foreground">
              共 {allProjects.length} 個專案
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusFilter />
            <NewProjectDialog />
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center text-muted-foreground">
            <p>目前沒有符合條件的專案</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
