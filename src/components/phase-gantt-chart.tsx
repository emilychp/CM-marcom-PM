"use client"

import { useMemo } from "react"
import { phaseStatusLabels, phaseStatusBarColor, taskHealthDotColor } from "@/lib/status-labels"

type Task = {
  id: string
  title: string
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
  const toPercent = (d: Date) =>
    ((d.getTime() - rangeStart.getTime()) / totalMs) * 100

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
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>{rangeStart.toLocaleDateString("zh-TW")}</span>
            <span>{rangeEnd.toLocaleDateString("zh-TW")}</span>
          </div>
          <div className="space-y-3">
            {scheduledPhases.map((phase) => {
              const left = toPercent(new Date(phase.startDate!))
              const right = toPercent(new Date(phase.dueDate!))
              const width = Math.max(right - left, 1)
              const tasksWithDate = phase.tasks.filter((t) => t.dueDate)

              return (
                <div key={phase.id}>
                  <p className="mb-1 truncate text-sm font-medium">{phase.name}</p>
                  <div className="relative h-6 rounded bg-muted">
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
                    {tasksWithDate.map((task) => {
                      const pos = toPercent(new Date(task.dueDate!))
                      return (
                        <div
                          key={task.id}
                          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-background ${taskHealthDotColor[task.health] ?? "bg-muted-foreground"}`}
                          style={{ left: `${pos}%` }}
                          title={`${task.title}・${new Date(task.dueDate!).toLocaleDateString("zh-TW")}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
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
      </div>

      {unscheduledPhases.length > 0 && (
        <p className="text-xs text-muted-foreground">
          尚未排定時程：{unscheduledPhases.map((p) => p.name).join("、")}
        </p>
      )}
    </div>
  )
}
