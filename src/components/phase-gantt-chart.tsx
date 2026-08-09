"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  phaseStatusLabels,
  phaseStatusBarColor,
  taskStatusLabels,
  taskHealthDotColor,
} from "@/lib/status-labels"

type Task = {
  id: string
  title: string
  status: string
  health: string
  dueDate: Date | null
}

type Phase = {
  id: string
  name: string
  status: string
  startDate: Date | null
  dueDate: Date | null
  tasks: Task[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const LABEL_WIDTH = 200

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function PhaseGanttChart({
  phases,
  projectStartDate,
  projectDueDate,
}: {
  phases: Phase[]
  projectStartDate: Date | null
  projectDueDate: Date | null
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(phaseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  const scheduledPhases = phases.filter((p) => p.startDate && p.dueDate)
  const unscheduledPhases = phases.filter((p) => !p.startDate || !p.dueDate)

  const { rangeStart, rangeEnd } = useMemo(() => {
    const candidates: Date[] = []
    if (projectStartDate) candidates.push(new Date(projectStartDate))
    if (projectDueDate) candidates.push(new Date(projectDueDate))
    for (const p of scheduledPhases) {
      candidates.push(new Date(p.startDate!))
      candidates.push(new Date(p.dueDate!))
      for (const t of p.tasks) {
        if (t.dueDate) candidates.push(new Date(t.dueDate))
      }
    }
    if (candidates.length === 0) {
      const today = startOfDay(new Date())
      return { rangeStart: today, rangeEnd: new Date(today.getTime() + 30 * DAY_MS) }
    }
    const min = startOfDay(new Date(Math.min(...candidates.map((d) => d.getTime()))))
    const max = startOfDay(new Date(Math.max(...candidates.map((d) => d.getTime()))))
    // Pad by ~5% of the span (minimum 2 days) on each side so bars aren't flush with the edges.
    const span = Math.max(max.getTime() - min.getTime(), DAY_MS)
    const pad = Math.max(span * 0.05, 2 * DAY_MS)
    return {
      rangeStart: new Date(min.getTime() - pad),
      rangeEnd: new Date(max.getTime() + pad),
    }
  }, [scheduledPhases, projectStartDate, projectDueDate])

  const totalMs = rangeEnd.getTime() - rangeStart.getTime()
  const toPercent = (d: Date) => ((d.getTime() - rangeStart.getTime()) / totalMs) * 100

  const todayPercent = toPercent(new Date())
  const showToday = todayPercent >= 0 && todayPercent <= 100

  if (scheduledPhases.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        尚未有階段設定時程，請先在階段的「設定時程」填入開始與截止日期
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <div className="min-w-[700px]">
          <div
            className="flex items-center border-b bg-muted/50 text-xs font-medium text-muted-foreground"
            style={{ minHeight: 32 }}
          >
            <div className="shrink-0 px-3 py-1.5" style={{ width: LABEL_WIDTH }}>
              階段 / 任務
            </div>
            <div className="flex flex-1 justify-between px-3 py-1.5">
              <span>{rangeStart.toLocaleDateString("zh-TW")}</span>
              <span>{rangeEnd.toLocaleDateString("zh-TW")}</span>
            </div>
          </div>

          {scheduledPhases.map((phase) => {
            const left = toPercent(new Date(phase.startDate!))
            const right = toPercent(new Date(phase.dueDate!))
            const width = Math.max(right - left, 1)
            const isOpen = expanded.has(phase.id)

            return (
              <div key={phase.id}>
                <div className="flex items-center border-b hover:bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggle(phase.id)}
                    disabled={phase.tasks.length === 0}
                    className="flex shrink-0 items-center gap-1 px-3 py-2 text-left disabled:cursor-default"
                    style={{ width: LABEL_WIDTH }}
                  >
                    {phase.tasks.length > 0 ? (
                      isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <span className="truncate text-sm font-medium">{phase.name}</span>
                  </button>
                  <div className="relative h-8 flex-1 px-3 py-1">
                    <div className="relative h-full rounded bg-muted">
                      {showToday && (
                        <div
                          className="absolute top-0 z-10 h-full w-px bg-destructive/60"
                          style={{ left: `${todayPercent}%` }}
                        />
                      )}
                      <div
                        className={`absolute top-0 h-full rounded ${phaseStatusBarColor[phase.status] ?? "bg-muted-foreground/40"}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${phaseStatusLabels[phase.status] ?? phase.status}：${new Date(phase.startDate!).toLocaleDateString("zh-TW")} → ${new Date(phase.dueDate!).toLocaleDateString("zh-TW")}`}
                      />
                    </div>
                  </div>
                </div>

                {isOpen &&
                  phase.tasks.map((task) => {
                    const taskLeft = left
                    const taskRight = task.dueDate ? toPercent(new Date(task.dueDate)) : right
                    const taskWidth = Math.max(taskRight - taskLeft, 0.5)

                    return (
                      <div
                        key={task.id}
                        className="flex items-center border-b bg-muted/10 hover:bg-muted/30"
                      >
                        <div
                          className="shrink-0 px-3 py-1.5 pl-9"
                          style={{ width: LABEL_WIDTH }}
                        >
                          <p className="truncate text-xs">{task.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {taskStatusLabels[task.status] ?? task.status}
                          </p>
                        </div>
                        <div className="relative h-6 flex-1 px-3 py-1">
                          <div className="relative h-full">
                            {task.dueDate ? (
                              <div
                                className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-70 ${taskHealthDotColor[task.health] ?? "bg-muted-foreground"}`}
                                style={{ left: `${taskLeft}%`, width: `${taskWidth}%` }}
                              />
                            ) : (
                              <p className="text-[11px] text-muted-foreground">尚未設定截止日</p>
                            )}
                            {task.dueDate && (
                              <div
                                className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-background ${taskHealthDotColor[task.health] ?? "bg-muted-foreground"}`}
                                style={{ left: `${taskRight}%` }}
                                title={`${task.title}・${new Date(task.dueDate).toLocaleDateString("zh-TW")}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" />
          尚未開始
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
          進行中
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          已完成
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rotate-45 border border-background bg-muted-foreground" />
          任務截止日
        </span>
        {showToday && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-px bg-destructive/60" />
            今天
          </span>
        )}
        <span className="text-muted-foreground/70">點擊階段名稱可展開/收合任務</span>
      </div>

      {unscheduledPhases.length > 0 && (
        <p className="text-xs text-muted-foreground">
          尚未排定時程：{unscheduledPhases.map((p) => p.name).join("、")}
        </p>
      )}
    </div>
  )
}
