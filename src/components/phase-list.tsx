"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Pencil, Trash2, Check, X as XIcon } from "lucide-react"
import { updatePhaseStatus, updatePhase, deletePhase } from "@/app/projects/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { phaseStatusLabels } from "@/lib/status-labels"
import { TaskRow } from "@/components/task-row"
import { AddTaskForm } from "@/components/add-task-form"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { PhaseScheduleDialog } from "@/components/phase-schedule-dialog"
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

export function PhaseList({
  projectId,
  coverAttachmentId,
  phases,
  role,
  currentUserId,
  manageable,
  allUsers,
}: {
  projectId: string
  coverAttachmentId: string | null
  phases: Phase[]
  role: EffectiveRole
  currentUserId: string
  manageable: boolean
  allUsers: { id: string; name: string }[]
}) {
  if (phases.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        尚未新增任何流程階段
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <PhaseItem
          key={phase.id}
          projectId={projectId}
          coverAttachmentId={coverAttachmentId}
          phase={phase}
          role={role}
          currentUserId={currentUserId}
          manageable={manageable}
          allUsers={allUsers}
        />
      ))}
    </div>
  )
}

function PhaseItem({
  projectId,
  coverAttachmentId,
  phase,
  role,
  currentUserId,
  manageable,
  allUsers,
}: {
  projectId: string
  coverAttachmentId: string | null
  phase: Phase
  role: EffectiveRole
  currentUserId: string
  manageable: boolean
  allUsers: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(phase.name)
  const [isPending, startTransition] = useTransition()

  const taskCount = phase.tasks.length
  const doneCount = phase.tasks.filter((t) => t.status === "DONE").length

  function handleStatusChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      try {
        await updatePhaseStatus(phase.id, projectId, value as "NOT_STARTED" | "IN_PROGRESS" | "DONE")
        toast.success("階段狀態已更新")
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  function saveName() {
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === phase.name) {
      setNameDraft(phase.name)
      setEditingName(false)
      return
    }
    startTransition(async () => {
      try {
        await updatePhase(phase.id, projectId, { name: trimmed })
        toast.success("階段名稱已更新")
        setEditingName(false)
      } catch {
        toast.error("更新失敗")
        setNameDraft(phase.name)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePhase(phase.id, projectId)
        toast.success("階段已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  return (
    <div className="rounded-lg border">
      <div className="px-4 py-3">
        <div className="flex w-full items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {editingName ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={nameDraft}
                disabled={isPending}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName()
                  if (e.key === "Escape") {
                    setNameDraft(phase.name)
                    setEditingName(false)
                  }
                }}
                className="h-7 w-48"
              />
              <button type="button" onClick={saveName} disabled={isPending}>
                <Check className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(phase.name)
                  setEditingName(false)
                }}
              >
                <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <>
              <span className="font-medium">{phase.name}</span>
              {manageable && (
                <button type="button" onClick={() => setEditingName(true)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </>
          )}
          <span className="text-sm text-muted-foreground">
            {doneCount}/{taskCount} 完成
          </span>
        </div>
        <div className="flex items-center gap-2">
          {manageable ? (
            <Select
              value={phase.status}
              onValueChange={handleStatusChange}
              disabled={isPending}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue>
                  {(value: string | null) => (value ? phaseStatusLabels[value] : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(phaseStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{phaseStatusLabels[phase.status]}</Badge>
          )}
          {manageable && (
            <ConfirmDeleteDialog
              trigger={
                <button
                  type="button"
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
              title="刪除階段"
              description={`確定要刪除階段「${phase.name}」嗎？此階段下的所有任務也會一併刪除，此操作無法復原。`}
              onConfirm={handleDelete}
            />
          )}
        </div>
        </div>
        <div className="mt-1.5 pl-6">
          <PhaseScheduleDialog
            projectId={projectId}
            phaseId={phase.id}
            startDate={phase.startDate}
            dueDate={phase.dueDate}
            isRecurring={phase.isRecurring}
            recurrenceFrequency={phase.recurrenceFrequency}
            manageable={manageable}
          />
        </div>
      </div>
      {open && (
        <div className="space-y-2 border-t px-4 py-3">
          {phase.tasks.map((task) => (
            <TaskRow
              key={task.id}
              projectId={projectId}
              coverAttachmentId={coverAttachmentId}
              task={task}
              role={role}
              currentUserId={currentUserId}
              manageable={manageable}
              allUsers={allUsers}
              phaseStartDate={phase.startDate}
              phaseDueDate={phase.dueDate}
            />
          ))}
          {taskCount === 0 && (
            <p className="py-2 text-sm text-muted-foreground">尚無任務</p>
          )}
          {manageable && (
            <AddTaskForm
              projectId={projectId}
              phaseId={phase.id}
              allUsers={allUsers}
            />
          )}
        </div>
      )}
    </div>
  )
}
