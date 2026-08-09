"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { NotebookText, Pencil, Trash2 } from "lucide-react"
import {
  createMeetingNote,
  updateMeetingNote,
  deleteMeetingNote,
} from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { MeetingNoteAttachments } from "@/components/meeting-note-attachments"

type Attachment = {
  id: string
  filename: string
  mimeType: string
  thumbnailStorageKey: string | null
  uploader: { id: string; name: string }
}

type MeetingNote = {
  id: string
  title: string
  content: string | null
  createdAt: Date
  updatedAt: Date
  author: { id: string; name: string }
  attachments: Attachment[]
}

function MeetingNoteItem({
  projectId,
  note,
  currentUserId,
  manageable,
}: {
  projectId: string
  note: MeetingNote
  currentUserId: string
  manageable: boolean
}) {
  const canEdit = manageable || note.author.id === currentUserId
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content ?? "")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!title.trim()) return
    startTransition(async () => {
      try {
        await updateMeetingNote(note.id, projectId, { title: title.trim(), content })
        toast.success("會議記錄已更新")
        setEditing(false)
      } catch {
        toast.error("更新失敗")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteMeetingNote(note.id, projectId)
        toast.success("會議記錄已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  if (editing) {
    return (
      <li className="space-y-2 rounded-md border p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          className="font-medium"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={4}
          placeholder="會議內容記錄..."
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "儲存中..." : "儲存"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setTitle(note.title)
              setContent(note.content ?? "")
              setEditing(false)
            }}
          >
            取消
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="group space-y-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{note.title}</p>
          <p className="text-xs text-muted-foreground">
            {note.author.name} ・ {new Date(note.createdAt).toLocaleString("zh-TW")}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <ConfirmDeleteDialog
              trigger={
                <button
                  type="button"
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              }
              title="刪除會議記錄"
              description={`確定要刪除「${note.title}」嗎？此操作無法復原。`}
              onConfirm={handleDelete}
            />
          </div>
        )}
      </div>
      {note.content && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
      )}
      <MeetingNoteAttachments
        projectId={projectId}
        meetingNoteId={note.id}
        attachments={note.attachments}
        currentUserId={currentUserId}
        manageable={manageable}
        canEdit={canEdit}
      />
    </li>
  )
}

export function MeetingNotesPanel({
  projectId,
  notes,
  currentUserId,
  manageable,
}: {
  projectId: string
  notes: MeetingNote[]
  currentUserId: string
  manageable: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!title.trim()) return
    startTransition(async () => {
      try {
        await createMeetingNote(projectId, { title: title.trim(), content })
        toast.success("會議記錄已新增")
        setTitle("")
        setContent("")
        setAdding(false)
      } catch {
        toast.error("新增失敗")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <NotebookText className="h-4 w-4" />
          會議記錄
        </CardTitle>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            + 新增會議記錄
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <Input
              placeholder="會議標題，例如：8/10 專案進度會議"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
            <Textarea
              placeholder="會議內容記錄..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={!title.trim() || isPending}
              >
                {isPending ? "新增中..." : "新增"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setTitle("")
                  setContent("")
                  setAdding(false)
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無會議記錄</p>
        ) : (
          <ol className="space-y-3">
            {notes.map((note) => (
              <MeetingNoteItem
                key={note.id}
                projectId={projectId}
                note={note}
                currentUserId={currentUserId}
                manageable={manageable}
              />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
