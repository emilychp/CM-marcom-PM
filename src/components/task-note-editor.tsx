"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { updateTaskNote } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function TaskNoteEditor({
  projectId,
  taskId,
  description,
  canEdit,
}: {
  projectId: string
  taskId: string
  description: string | null
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(description ?? "")
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      try {
        await updateTaskNote(taskId, projectId, draft.trim())
        toast.success("說明已更新")
        setEditing(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  if (editing) {
    return (
      <div className="w-full space-y-1.5">
        <Textarea
          autoFocus
          rows={4}
          value={draft}
          disabled={isPending}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"填寫進度說明，例如：\n底殼 - 案呈（5月初交貨）\n紙盒 - 三麟（追加訂製...）"}
          className="text-xs"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "儲存中..." : "儲存"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setDraft(description ?? "")
              setEditing(false)
            }}
          >
            取消
          </Button>
        </div>
      </div>
    )
  }

  if (!description) {
    return canEdit ? (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
        新增進度說明
      </button>
    ) : null
  }

  return (
    <div className="group/note flex w-full items-start gap-1.5">
      <p className="whitespace-pre-wrap text-xs text-muted-foreground">
        {description}
      </p>
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-muted-foreground opacity-0 group-hover/note:opacity-100 hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
