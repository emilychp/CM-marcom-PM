"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateProjectPriority } from "@/app/projects/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectPriorityLabels, PROJECT_PRIORITY_ORDER } from "@/lib/status-labels"
import type { ProjectPriority } from "@/generated/prisma/enums"

export function ProjectPrioritySelect({
  projectId,
  currentPriority,
}: {
  projectId: string
  currentPriority: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      try {
        await updateProjectPriority(projectId, value as ProjectPriority)
        toast.success("優先性已更新")
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <Select value={currentPriority} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-28">
        <SelectValue>
          {(value: string | null) => (value ? projectPriorityLabels[value] : "")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROJECT_PRIORITY_ORDER.map((value) => (
          <SelectItem key={value} value={value}>
            {projectPriorityLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
