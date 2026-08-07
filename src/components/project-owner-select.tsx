"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateProjectOwner } from "@/app/projects/actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProjectOwnerSelect({
  projectId,
  ownerId,
  allUsers,
}: {
  projectId: string
  ownerId: string
  allUsers: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value || value === ownerId) return
    startTransition(async () => {
      try {
        await updateProjectOwner(projectId, value)
        toast.success("負責人已更新")
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  return (
    <Select value={ownerId} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-40">
        <SelectValue>
          {(value: string | null) =>
            allUsers.find((u) => u.id === value)?.name ?? "選擇負責人"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allUsers.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
