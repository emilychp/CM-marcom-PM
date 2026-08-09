"use client"

import { useState } from "react"
import { List, GanttChartSquare } from "lucide-react"
import { PhaseList } from "@/components/phase-list"
import { PhaseGanttChart } from "@/components/phase-gantt-chart"
import { AddPhaseForm } from "@/components/add-phase-form"
import type { EffectiveRole } from "@/lib/permissions"

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  health: string
  progress: number
  assignee: { id: string; name: string } | null
  dueDate: Date | null
  attachments: {
    id: string
    filename: string
    mimeType: string
    thumbnailStorageKey: string | null
    uploader: { id: string; name: string }
  }[]
}

type Phase = {
  id: string
  name: string
  status: string
  startDate: Date | null
  dueDate: Date | null
  isRecurring: boolean
  recurrenceFrequency: string | null
  tasks: Task[]
}

export function PhaseSection({
  projectId,
  phases,
  role,
  currentUserId,
  manageable,
  allUsers,
  projectStartDate,
  projectDueDate,
}: {
  projectId: string
  phases: Phase[]
  role: EffectiveRole
  currentUserId: string
  manageable: boolean
  allUsers: { id: string; name: string }[]
  projectStartDate: Date | null
  projectDueDate: Date | null
}) {
  const [view, setView] = useState<"LIST" | "GANTT">("LIST")

  return (
    <div className="rounded-lg border bg-background p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">專案流程</h2>
          <div className="flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setView("LIST")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                view === "LIST"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              列表
            </button>
            <button
              type="button"
              onClick={() => setView("GANTT")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                view === "GANTT"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GanttChartSquare className="h-3.5 w-3.5" />
              甘特圖
            </button>
          </div>
        </div>
        {manageable && view === "LIST" && <AddPhaseForm projectId={projectId} />}
      </div>

      {view === "LIST" ? (
        <PhaseList
          projectId={projectId}
          phases={phases}
          role={role}
          currentUserId={currentUserId}
          manageable={manageable}
          allUsers={allUsers}
        />
      ) : (
        <PhaseGanttChart
          phases={phases}
          projectStartDate={projectStartDate}
          projectDueDate={projectDueDate}
        />
      )}
    </div>
  )
}
