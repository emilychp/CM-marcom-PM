import Link from "next/link"
import { optionColorDotClass } from "@/lib/option-colors"
import { PROJECT_STATUS_ORDER, projectStatusLabels } from "@/lib/status-labels"

type Project = { status: string; categories: { moduleId: string | null }[] }
type ModuleRow = { id: string; name: string; color: string }

export function ModuleStatusMatrix({
  modules,
  projects,
  currentModule,
  currentStatus,
}: {
  modules: ModuleRow[]
  projects: Project[]
  currentModule?: string
  currentStatus?: string
}) {
  if (modules.length === 0) return null

  function countFor(moduleId: string, status: string) {
    return projects.filter(
      (p) => p.status === status && p.categories.some((c) => c.moduleId === moduleId)
    ).length
  }

  function countUnassigned(status: string) {
    return projects.filter(
      (p) => p.status === status && p.categories.every((c) => c.moduleId === null)
    ).length
  }

  function cellHref(moduleId: string, status: string) {
    const params = new URLSearchParams()
    params.set("module", moduleId)
    params.set("status", status)
    return `/dashboard?${params.toString()}`
  }

  const rows: (ModuleRow & { total: number })[] = modules.map((m) => ({
    ...m,
    total: PROJECT_STATUS_ORDER.reduce((sum, s) => sum + countFor(m.id, s), 0),
  }))
  const unassignedTotal = projects.filter((p) =>
    p.categories.every((c) => c.moduleId === null)
  ).length

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              工作模組 ＼ 狀態
            </th>
            {PROJECT_STATUS_ORDER.map((status) => (
              <th
                key={status}
                className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {projectStatusLabels[status]}
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">
              小計
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((mod) => (
            <tr key={mod.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      optionColorDotClass[mod.color] ?? optionColorDotClass.gray
                    }`}
                  />
                  {mod.name}
                </span>
              </td>
              {PROJECT_STATUS_ORDER.map((status) => {
                const count = countFor(mod.id, status)
                const active = currentModule === mod.id && currentStatus === status
                return (
                  <td key={status} className="px-3 py-2 text-center">
                    {count === 0 ? (
                      <span className="text-muted-foreground/40">–</span>
                    ) : (
                      <Link
                        href={cellHref(mod.id, status)}
                        className={`inline-flex min-w-6 justify-center rounded px-1.5 py-0.5 tabular-nums transition-colors hover:bg-muted ${
                          active ? "bg-foreground text-background hover:bg-foreground" : ""
                        }`}
                      >
                        {count}
                      </Link>
                    )}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-center font-semibold tabular-nums">{mod.total}</td>
            </tr>
          ))}
          {unassignedTotal > 0 && (
            <tr className="bg-muted/20">
              <td className="px-3 py-2 text-muted-foreground">尚未分類的專案</td>
              {PROJECT_STATUS_ORDER.map((status) => {
                const count = countUnassigned(status)
                return (
                  <td key={status} className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                    {count === 0 ? "–" : count}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-center text-muted-foreground tabular-nums">
                {unassignedTotal}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
