"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MessageSquare, X } from "lucide-react"
import { addComment, deleteComment } from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

type Comment = {
  id: string
  content: string
  createdAt: Date
  author: { id: string; name: string }
}

export function CommentsPanel({
  projectId,
  comments,
  currentUserId,
  manageable,
  isMember,
}: {
  projectId: string
  comments: Comment[]
  currentUserId: string
  manageable: boolean
  isMember: boolean
}) {
  const [draft, setDraft] = useState("")
  const [isPending, startTransition] = useTransition()

  function handlePost() {
    const trimmed = draft.trim()
    if (!trimmed) return
    startTransition(async () => {
      try {
        await addComment(projectId, trimmed)
        setDraft("")
      } catch {
        toast.error("留言失敗")
      }
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        await deleteComment(commentId, projectId)
        toast.success("留言已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          留言討論牆
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMember && (
          <div className="space-y-2">
            <Textarea
              placeholder="留言或註記想法、議題..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isPending}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handlePost}
                disabled={!draft.trim() || isPending}
              >
                發表留言
              </Button>
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無留言</p>
        ) : (
          <ol className="space-y-3">
            {comments.map((comment) => {
              const canDelete = manageable || comment.author.id === currentUserId
              return (
                <li key={comment.id} className="group rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("zh-TW")}
                      </span>
                    </div>
                    {canDelete && (
                      <ConfirmDeleteDialog
                        trigger={
                          <button
                            type="button"
                            disabled={isPending}
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        }
                        title="刪除留言"
                        description="確定要刪除這則留言嗎？此操作無法復原。"
                        onConfirm={() => handleDelete(comment.id)}
                      />
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
