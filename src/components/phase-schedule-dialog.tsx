"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePhaseSchedule } from "@/app/projects/actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Repeat } from "lucide-react"
import { recurrenceFrequencyLabels } from "@/lib/status-labels"

function toDateInputValue(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

export function PhaseScheduleDialog({
  projectId,
  phaseId,
  startDate,
  dueDate,
  isRecurring,
  recurrenceFrequency,
  manageable,
}: {
  projectId: string
  phaseId: string
  startDate: Date | null
  dueDate: Date | null
  isRecurring: boolean
  recurrenceFrequency: string | null
  manageable: boolean
}) {
  const [open, setOpen] = useState(false)
  const [startDraft, setStartDraft] = useState(toDateInputValue(startDate))
  const [dueDraft, setDueDraft] = useState(toDateInputValue(dueDate))
  const [recurringDraft, setRecurringDraft] = useState(isRecurring)
  const [frequencyDraft, setFrequencyDraft] = useState(recurrenceFrequency ?? "MONTHLY")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updatePhaseSchedule(phaseId, projectId, {
          startDate: startDraft || null,
          dueDate: dueDraft || null,
          isRecurring: recurringDraft,
          recurrenceFrequency: recurringDraft
            ? (frequencyDraft as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY")
            : null,
        })
        toast.success("階段時程已更新")
        setOpen(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  const dateSummary = [
    startDate && new Date(startDate).toLocaleDateString("zh-TW"),
    dueDate && new Date(dueDate).toLocaleDateString("zh-TW"),
  ]
    .filter(Boolean)
    .join(" → ")

  const summaryParts = [
    dateSummary || null,
    isRecurring
      ? `週期性・${recurrenceFrequency ? recurrenceFrequencyLabels[recurrenceFrequency] : ""}`
      : null,
  ].filter(Boolean)

  if (!manageable) {
    return summaryParts.length > 0 ? (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        {summaryParts.map((part, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {part === dateSummary ? (
              <Calendar className="h-3 w-3" />
            ) : (
              <Repeat className="h-3 w-3" />
            )}
            {part}
          </span>
        ))}
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
          setRecurringDraft(isRecurring)
          setFrequencyDraft(recurrenceFrequency ?? "MONTHLY")
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Calendar className="h-3 w-3" />
            {summaryParts.length > 0 ? summaryParts.join("・") : "設定時程"}
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定階段時程</DialogTitle>
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
          <div className="flex items-center gap-2">
            <input
              id={`recurring-${phaseId}`}
              type="checkbox"
              checked={recurringDraft}
              onChange={(e) => setRecurringDraft(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={`recurring-${phaseId}`}>週期性工作</Label>
          </div>
          {recurringDraft && (
            <div className="space-y-1.5">
              <Label>頻率</Label>
              <Select value={frequencyDraft} onValueChange={(v) => v && setFrequencyDraft(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? recurrenceFrequencyLabels[value] : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(recurrenceFrequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
