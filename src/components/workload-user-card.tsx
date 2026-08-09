"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HealthDot } from "@/components/health-dot"
import { TaskStatusBreakdown } from "@/components/task-status-breakdown"
import { taskStatusLabels } from "@/lib/status-labels"

type Task = {
  id: string
  title: string
  status: string
  health: string
  dueDate: Date | null
  projectId: string
  projectName: string
}

export function WorkloadUserCard({
  name,
  email,
  ownedProjectCount,
  taskCount,
  statusCounts,
  tasks,
}: {
  name: string
  email: string
  ownedProjectCount: number
  taskCount: number
  statusCounts: Record<string, number>
  tasks: Task[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 text-left"
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
          <div className="flex items-center gap-2">
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
