"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Check, X as XIcon } from "lucide-react"
import { updateProjectName } from "@/app/projects/actions"
import { Input } from "@/components/ui/input"

export function ProjectNameEditor({
  projectId,
  name,
  manageable,
}: {
  projectId: string
  name: string
  manageable: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [isPending, startTransition] = useTransition()

  function save() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === name) {
      setDraft(name)
      setEditing(false)
      return
    }
    startTransition(async () => {
      try {
        await updateProjectName(projectId, trimmed)
        toast.success("專案名稱已更新")
        setEditing(false)
      } catch {
        toast.error("更新失敗")
        setDraft(name)
      }
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={draft}
          disabled={isPending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") {
              setDraft(name)
              setEditing(false)
            }
          }}
          className="h-9 w-64 text-2xl font-semibold"
        />
        <button type="button" onClick={save} disabled={isPending}>
          <Check className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(name)
            setEditing(false)
          }}
        >
          <XIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold">{name}</h1>
      {manageable && (
        <button type="button" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  )
}
