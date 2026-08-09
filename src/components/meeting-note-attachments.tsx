"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"
import { Paperclip, X, File as FileIcon } from "lucide-react"
import {
  uploadMeetingNoteAttachment,
  deleteMeetingNoteAttachment,
} from "@/app/projects/actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { generatePdfThumbnail } from "@/lib/pdf-thumbnail"

type Attachment = {
  id: string
  filename: string
  mimeType: string
  thumbnailStorageKey: string | null
  uploader: { id: string; name: string }
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  NO_FILE: "請先選擇檔案",
  FILE_TOO_LARGE: "檔案超過 10MB 上限",
  UNSUPPORTED_TYPE: "不支援的檔案格式",
}

export function MeetingNoteAttachments({
  projectId,
  meetingNoteId,
  attachments,
  currentUserId,
  manageable,
  canEdit,
}: {
  projectId: string
  meetingNoteId: string
  attachments: Attachment[]
  currentUserId: string
  manageable: boolean
  canEdit: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("file", file)
        if (file.type === "application/pdf") {
          const thumbnail = await generatePdfThumbnail(file)
          if (thumbnail) formData.set("thumbnail", thumbnail)
        }
        await uploadMeetingNoteAttachment(meetingNoteId, projectId, formData)
        toast.success("附件已上傳")
      } catch (err) {
        const message =
          err instanceof Error ? UPLOAD_ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "上傳失敗")
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    })
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      try {
        await deleteMeetingNoteAttachment(attachmentId, projectId)
        toast.success("附件已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  if (attachments.length === 0 && !canEdit) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attachments.map((attachment) => {
        const isImage = attachment.mimeType.startsWith("image/")
        const fileUrl = `/api/attachments/${attachment.id}`
        const previewUrl = isImage
          ? fileUrl
          : attachment.thumbnailStorageKey
            ? `${fileUrl}?thumbnail=1`
            : null
        const canDelete = manageable || attachment.uploader.id === currentUserId

        return (
          <div key={attachment.id} className="group relative">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={attachment.filename}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border bg-muted"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </a>
            {canDelete && (
              <ConfirmDeleteDialog
                trigger={
                  <button
                    type="button"
                    disabled={isPending}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-background p-0.5 text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                }
                title="刪除附件"
                description={`確定要刪除「${attachment.filename}」嗎？此操作無法復原。`}
                onConfirm={() => handleDelete(attachment.id)}
              />
            )}
          </div>
        )
      })}
      {canEdit && (
        <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-foreground/50 hover:text-foreground">
          <Paperclip className="h-4 w-4" />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isPending}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
