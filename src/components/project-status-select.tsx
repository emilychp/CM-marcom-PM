"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateProjectStatus } from "@/app/projects/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectStatusLabels } from "@/lib/status-labels"
import type { ProjectStatus } from "@/generated/prisma/enums"

export function ProjectStatusSelect({
  projectId,
  currentStatus,
}: {
  projectId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      try {
        await updateProjectStatus(projectId, value as ProjectStatus)
        toast.success("狀態已更新")
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-36">
        <SelectValue>
          {(value: string | null) => (value ? projectStatusLabels[value] : "")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(projectStatusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
