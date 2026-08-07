"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateProjectDates } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Calendar } from "lucide-react"

function toDateInputValue(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

export function ProjectDatesDialog({
  projectId,
  startDate,
  dueDate,
  manageable,
}: {
  projectId: string
  startDate: Date | null
  dueDate: Date | null
  manageable: boolean
}) {
  const [open, setOpen] = useState(false)
  const [startDraft, setStartDraft] = useState(toDateInputValue(startDate))
  const [dueDraft, setDueDraft] = useState(toDateInputValue(dueDate))
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProjectDates(projectId, {
          startDate: startDraft || null,
          dueDate: dueDraft || null,
        })
        toast.success("專案時程已更新")
        setOpen(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  const summary =
    startDate || dueDate
      ? [
          startDate && new Date(startDate).toLocaleDateString("zh-TW"),
          dueDate && new Date(dueDate).toLocaleDateString("zh-TW"),
        ]
          .filter(Boolean)
          .join(" → ")
      : "尚未設定時程"

  if (!manageable) {
    return startDate || dueDate ? (
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        {summary}
      </span>
    ) : null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setStartDraft(toDateInputValue(startDate))
          setDueDraft(toDateInputValue(dueDate))
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Calendar className="h-3.5 w-3.5" />
            {summary}
            <Pencil className="h-3 w-3" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定專案時程</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>開始日期</Label>
            <Input
              type="date"
              value={startDraft}
              onChange={(e) => setStartDraft(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>截止日期</Label>
            <Input
              type="date"
              value={dueDraft}
              onChange={(e) => setDueDraft(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
