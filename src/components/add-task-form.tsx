"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createTask } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export function AddTaskForm({
  projectId,
  phaseId,
  allUsers,
}: {
  projectId: string
  phaseId: string
  allUsers: { id: string; name: string }[]
}) {
  const [title, setTitle] = useState("")
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      try {
        await createTask(phaseId, projectId, {
          title: title.trim(),
          assigneeId,
        })
        setTitle("")
        setAssigneeId(null)
      } catch {
        toast.error("新增任務失敗")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 pt-1">
      <Input
        placeholder="新增任務名稱"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 flex-1"
      />
      <Select value={assigneeId ?? undefined} onValueChange={setAssigneeId}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue placeholder="指派給">
            {(value: string | null) =>
              allUsers.find((u) => u.id === value)?.name ?? "指派給"
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
      <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
        <Plus className="mr-1 h-3 w-3" />
        新增任務
      </Button>
    </form>
  )
}
