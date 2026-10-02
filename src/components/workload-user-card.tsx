"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HealthDot } from "@/components/health-dot"
import { TaskStatusBreakdown } from "@/components/task-status-breakdown"
import { taskStatusLabels } from "@/lib/status-labels"
import { setWorkloadAllocation } from "@/app/workload/actions"

const BAR_COLOR_CLASS: Record<string, string> = {
  gray: "bg-muted-foreground/50",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
}

type Task = {
  id: string
  title: string
  status: string
  health: string
  dueDate: Date | null
  projectId: string
  projectName: string
}

type Module = { id: string; name: string; color: string }

function WorkloadModuleBar({
  userId,
  modules,
  allocations,
}: {
  userId: string
  modules: Module[]
  allocations: Record<string, number>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(modules.map((m) => [m.id, String(allocations[m.id] ?? 0)]))
  )
  const [isPending, startTransition] = useTransition()

  const total = modules.reduce((sum, m) => sum + (allocations[m.id] ?? 0), 0)
  const hasAny = total > 0

  function handleSave() {
    startTransition(async () => {
      try {
        await Promise.all(
          modules.map((m) => {
            const value = Math.max(0, Math.min(100, Number(draft[m.id]) || 0))
            return setWorkloadAllocation(userId, m.id, value)
          })
        )
        toast.success("佔比已更新")
        setEditing(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border border-dashed p-2.5">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${BAR_COLOR_CLASS[m.color] ?? BAR_COLOR_CLASS.gray}`} />
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{m.name}</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={draft[m.id] ?? "0"}
              onChange={(e) => setDraft((d) => ({ ...d, [m.id]: e.target.value }))}
              disabled={isPending}
              className="h-7 w-20 text-xs"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => setEditing(false)}>
            取消
          </Button>
          <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      {hasAny ? (
        <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-muted">
          {modules.map((m) => {
            const pct = allocations[m.id] ?? 0
            if (pct <= 0) return null
            return (
              <div
                key={m.id}
                title={`${m.name} ${pct}%`}
                className={`flex items-center justify-center text-[9px] font-semibold text-white ${
                  BAR_COLOR_CLASS[m.color] ?? BAR_COLOR_CLASS.gray
                }`}
                style={{ width: `${pct}%` }}
              >
                {pct >= 10 ? `${pct}%` : ""}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="flex-1 text-xs text-muted-foreground">尚未設定模組佔比</p>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="編輯佔比"
        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

export function WorkloadUserCard({
  id,
  name,
  email,
  ownedProjectCount,
  taskCount,
  statusCounts,
  tasks,
  modules,
  allocations,
}: {
  id: string
  name: string
  email: string
  ownedProjectCount: number
  taskCount: number
  statusCounts: Record<string, number>
  tasks: Task[]
  modules: Module[]
  allocations: Record<string, number>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        {modules.length > 0 && (
          <WorkloadModuleBar userId={id} modules={modules} allocations={allocations} />
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
          disabled={taskCount === 0}
        >
          <div className="flex items-center gap-2">
            {taskCount > 0 ? (
              open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ownedProjectCount} 個負責專案</Badge>
            <Badge variant={taskCount > 5 ? "destructive" : "secondary"}>
              {taskCount} 項進行中任務
            </Badge>
          </div>
        </button>

        {taskCount > 0 && <TaskStatusBreakdown counts={statusCounts} />}

        {open && (
          <ul className="space-y-1.5 border-t pt-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.projectId}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <HealthDot health={task.health} />
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.projectName}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {taskStatusLabels[task.status]}
                  </Badge>
                  {task.dueDate && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString("zh-TW")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
