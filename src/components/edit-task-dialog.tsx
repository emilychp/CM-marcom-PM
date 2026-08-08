"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateTask } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil } from "lucide-react"

type Task = {
  id: string
  title: string
  description: string | null
  assignee: { id: string; name: string } | null
  dueDate: Date | null
}

function toDateInputValue(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

export function EditTaskDialog({
  projectId,
  task,
  allUsers,
  phaseStartDate,
  phaseDueDate,
}: {
  projectId: string
  task: Task
  allUsers: { id: string; name: string }[]
  phaseStartDate: Date | null
  phaseDueDate: Date | null
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assignee?.id ?? null)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  )
  const [isPending, startTransition] = useTransition()

  const minDate = toDateInputValue(phaseStartDate)
  const maxDate = toDateInputValue(phaseDueDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      try {
        const result = await updateTask(task.id, projectId, {
          title: title.trim(),
          description,
          assigneeId,
          dueDate: dueDate || null,
        })
        if (!result.ok) {
          if (result.error === "TASK_DUE_DATE_BEFORE_PHASE_START") {
            toast.error("完成日期不能早於階段的開始日期")
          } else {
            toast.error("完成日期不能晚於階段的截止日期")
          }
          return
        }
        toast.success("任務已更新")
        setOpen(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button type="button" className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯任務</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>任務名稱</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>指派給</Label>
            <Select value={assigneeId ?? "unassigned"} onValueChange={(v) => setAssigneeId(v === "unassigned" ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    assigneeId
                      ? allUsers.find((u) => u.id === assigneeId)?.name
                      : "未指派"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">未指派</SelectItem>
                {allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>截止日期</Label>
            <Input
              type="date"
              value={dueDate}
              min={minDate || undefined}
              max={maxDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {(minDate || maxDate) && (
              <p className="text-xs text-muted-foreground">
                需落在階段時程內：{minDate || "無限制"} → {maxDate || "無限制"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
