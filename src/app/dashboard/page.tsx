import { auth } from "@/auth"
import { NavBar } from "@/components/nav-bar"
import { ProjectBoard } from "@/components/project-board"
import { NewProjectDialog } from "@/components/new-project-dialog"
import { StatusFilter } from "./status-filter"
import { ViewModeSelect } from "./view-mode-select"
import { ModuleCategoryTabs } from "./module-category-tabs"
import { ModuleStatusMatrix } from "./module-status-matrix"
import { getProjectsForUser } from "@/lib/projects-data"
import { getCategories } from "@/lib/categories-data"
import { getModules } from "@/lib/modules-data"
import {
  PROJECT_PRIORITY_ORDER,
  PROJECT_STATUS_ORDER,
  projectPriorityLabels,
  projectStatusLabels,
} from "@/lib/status-labels"

type Project = Awaited<ReturnType<typeof getProjectsForUser>>[number]

function groupProjects(
  projects: Project[],
  view: string
): { label: string; projects: Project[] }[] {
  if (view === "OWNER") {
    const map = new Map<string, Project[]>()
    for (const project of projects) {
      const key = project.owner?.name ?? "未指定"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(project)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"))
      .map(([label, groupProjects]) => ({ label, projects: groupProjects }))
  }

  if (view === "PRIORITY") {
    return PROJECT_PRIORITY_ORDER.map((priority) => ({
      label: projectPriorityLabels[priority],
      projects: projects.filter((project) => project.priority === priority),
    })).filter((group) => group.projects.length > 0)
  }

  if (view === "STATUS") {
    return PROJECT_STATUS_ORDER.map((status) => ({
      label: projectStatusLabels[status],
      projects: projects.filter((project) => project.status === status),
    })).filter((group) => group.projects.length > 0)
  }

  return [{ label: "", projects }]
}

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
  const categoryFilter =
    typeof params.category === "string" ? params.category : undefined
  const moduleFilter =
    typeof params.module === "string" ? params.module : undefined
  const viewMode = typeof params.view === "string" ? params.view : "ALL"

  const [allProjects, categories, modules] = await Promise.all([
    getProjectsForUser(session.user),
    getCategories(),
    getModules(),
  ])
  const projects = allProjects
    .filter((p) => !statusFilter || p.status === statusFilter)
    .filter((p) => !categoryFilter || p.categories.some((c) => c.id === categoryFilter))
    .filter(
      (p) => !moduleFilter || p.categories.some((c) => c.moduleId === moduleFilter)
    )

  const groups = groupProjects(projects, viewMode)
  const canReorder =
    viewMode === "ALL" && !statusFilter && !categoryFilter && !moduleFilter

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">專案總覽</h1>
            <p className="text-sm text-muted-foreground">
              共 {allProjects.length} 個專案
              {canReorder && "・拖曳卡片右上角圖示可調整順序"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeSelect />
            <StatusFilter />
            <NewProjectDialog categories={categories} />
          </div>
        </div>

        <div className="mb-6">
          <ModuleStatusMatrix
            modules={modules}
            projects={allProjects}
            currentModule={moduleFilter}
            currentStatus={statusFilter}
          />
        </div>

        <div className="mb-6">
          <ModuleCategoryTabs modules={modules} />
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center text-muted-foreground">
            <p>目前沒有符合條件的專案</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.label || "all"}>
                {group.label && (
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    {group.label}
                    <span className="font-normal">（{group.projects.length}）</span>
                  </h2>
                )}
                <ProjectBoard projects={group.projects} sortable={canReorder} />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
