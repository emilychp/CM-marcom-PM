"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { updateTaskProgress, updateTaskHealth, deleteTask } from "@/app/projects/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { taskStatusLabels, taskStatusVariant, taskHealthLabels } from "@/lib/status-labels"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { HealthDot } from "@/components/health-dot"
import { TaskNoteEditor } from "@/components/task-note-editor"
import type { EffectiveRole } from "@/lib/permissions"
import type { TaskStatus, TaskHealth } from "@/generated/prisma/enums"

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  health: string
  progress: number
  assignee: { id: string; name: string } | null
  dueDate: Date | null
}

export function TaskRow({
  projectId,
  task,
  role,
  currentUserId,
  manageable,
  allUsers,
  phaseStartDate,
  phaseDueDate,
}: {
  projectId: string
  task: Task
  role: EffectiveRole
  currentUserId: string
  manageable: boolean
  allUsers: { id: string; name: string }[]
  phaseStartDate: Date | null
  phaseDueDate: Date | null
}) {
  const canEdit =
    role === "ADMIN" ||
    role === "MANAGER" ||
    (role === "MEMBER" && task.assignee?.id === currentUserId)

  const [progress, setProgress] = useState(task.progress)
  const [status, setStatus] = useState(task.status)
  const [health, setHealth] = useState(task.health)
  const [isPending, startTransition] = useTransition()

  function save(nextProgress: number, nextStatus: string) {
    startTransition(async () => {
      try {
        await updateTaskProgress(
          task.id,
          projectId,
          nextProgress,
          nextStatus as TaskStatus
        )
      } catch {
        toast.error("更新失敗")
        setProgress(task.progress)
        setStatus(task.status)
      }
    })
  }

  function handleStatusChange(value: string | null) {
    if (!value) return
    setStatus(value)
    const nextProgress = value === "DONE" ? 100 : progress
    setProgress(nextProgress)
    save(nextProgress, value)
  }

  function handleProgressCommit(value: number) {
    setProgress(value)
    save(value, status)
  }

  function handleHealthChange(value: string | null) {
    if (!value) return
    const previous = health
    setHealth(value)
    startTransition(async () => {
      try {
        await updateTaskHealth(task.id, projectId, value as TaskHealth)
      } catch {
        toast.error("更新失敗")
        setHealth(previous)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTask(task.id, projectId)
        toast.success("任務已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
      <div className="min-w-40 flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{task.title}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {task.assignee?.name ?? "未指派"}
          {task.dueDate &&
            ` ・ ${new Date(task.dueDate).toLocaleDateString("zh-TW")}`}
        </p>
        <TaskNoteEditor
          projectId={projectId}
          taskId={task.id}
          description={task.description}
          canEdit={canEdit}
        />
      </div>

      {canEdit ? (
        <Select value={health} onValueChange={handleHealthChange} disabled={isPending}>
          <SelectTrigger size="sm" className="w-24">
            <SelectValue>
              {(value: string | null) =>
                value ? (
                  <span className="flex items-center gap-1.5">
                    <HealthDot health={value} />
                    {taskHealthLabels[value]}
                  </span>
                ) : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(taskHealthLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-1.5">
                  <HealthDot health={value} />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span title={taskHealthLabels[task.health]}>
          <HealthDot health={task.health} size="lg" />
        </span>
      )}

      {canEdit ? (
        <>
          <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue>
                {(value: string | null) => (value ? taskStatusLabels[value] : "")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(taskStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={progress}
              disabled={isPending}
              onChange={(e) => setProgress(Number(e.target.value))}
              onBlur={(e) => handleProgressCommit(Number(e.target.value))}
              className="h-8 w-16"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </>
      ) : (
        <>
          <Badge variant={taskStatusVariant[task.status]}>
            {taskStatusLabels[task.status]}
          </Badge>
          <div className="w-28">
            <Progress value={task.progress} />
          </div>
        </>
      )}

      {manageable && (
        <div className="flex items-center gap-2">
          <EditTaskDialog
            projectId={projectId}
            task={task}
            allUsers={allUsers}
            phaseStartDate={phaseStartDate}
            phaseDueDate={phaseDueDate}
          />
          <ConfirmDeleteDialog
            trigger={
              <button
                type="button"
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="刪除任務"
            description={`確定要刪除任務「${task.title}」嗎？此操作無法復原。`}
            onConfirm={handleDelete}
          />
        </div>
      )}
    </div>
  )
}
