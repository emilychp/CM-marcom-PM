"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Check, X as XIcon } from "lucide-react"
import { updateProjectDescription } from "@/app/projects/actions"
import { Textarea } from "@/components/ui/textarea"

export function ProjectDescriptionEditor({
  projectId,
  description,
  manageable,
}: {
  projectId: string
  description: string | null
  manageable: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(description ?? "")
  const [isPending, startTransition] = useTransition()

  function save() {
    const trimmed = draft.trim()
    if (trimmed === (description ?? "")) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      try {
        await updateProjectDescription(projectId, trimmed)
        toast.success("專案說明已更新")
        setEditing(false)
      } catch {
        toast.error("更新失敗")
        setDraft(description ?? "")
      }
    })
  }

  if (editing) {
    return (
      <div className="mt-2 max-w-2xl space-y-1.5">
        <Textarea
          autoFocus
          value={draft}
          disabled={isPending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(description ?? "")
              setEditing(false)
            }
          }}
          className="text-sm"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={save} disabled={isPending}>
            <Check className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(description ?? "")
              setEditing(false)
            }}
          >
            <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
    )
  }

  if (!description) {
    return manageable ? (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
        新增專案說明
      </button>
    ) : null
  }

  return (
    <div className="mt-2 flex max-w-2xl items-start gap-1.5">
      <p className="text-sm text-muted-foreground">{description}</p>
      {manageable && (
        <button type="button" onClick={() => setEditing(true)} className="mt-0.5 shrink-0">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  )
}
