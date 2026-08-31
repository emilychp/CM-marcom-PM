"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"
import { Paperclip, X, File as FileIcon, Star, History, RotateCw } from "lucide-react"
import {
  uploadTaskAttachment,
  uploadTaskAttachmentFromBlob,
  deleteTaskAttachment,
  setProjectCoverAttachment,
} from "@/app/projects/actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { generatePdfThumbnail } from "@/lib/pdf-thumbnail"
import {
  MAX_ATTACHMENT_SIZE,
  ALLOWED_ATTACHMENT_TYPES,
  SAFE_BODY_UPLOAD_LIMIT,
} from "@/lib/attachment-constants"
import { buildAttachmentPathname, uploadFileToBlob } from "@/lib/attachment-upload-client"

type Attachment = {
  id: string
  filename: string
  mimeType: string
  thumbnailStorageKey: string | null
  uploader: { id: string; name: string }
  createdAt: Date
  versionGroupId: string | null
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  NO_FILE: "請先選擇檔案",
  FILE_TOO_LARGE: "檔案超過 25MB 上限",
  UNSUPPORTED_TYPE: "不支援的檔案格式",
}

// Groups uploads that share a document lineage (same versionGroupId, or an
// attachment that other versions point back to) so the newest upload can be
// shown as the current version with older ones tucked into a history menu.
// `attachments` arrives sorted newest-first, so each group's members stay in
// that order too, and groups themselves come out ordered by their latest
// version's recency.
function groupByVersion(attachments: Attachment[]): Attachment[][] {
  const groups = new Map<string, Attachment[]>()
  for (const attachment of attachments) {
    const key = attachment.versionGroupId ?? attachment.id
    const group = groups.get(key)
    if (group) {
      group.push(attachment)
    } else {
      groups.set(key, [attachment])
    }
  }
  return Array.from(groups.values())
}

export function TaskAttachments({
  projectId,
  coverAttachmentId,
  taskId,
  attachments,
  currentUserId,
  manageable,
  canEdit,
}: {
  projectId: string
  coverAttachmentId: string | null
  taskId: string
  attachments: Attachment[]
  currentUserId: string
  manageable: boolean
  canEdit: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, versionOf?: string) {
    const file = e.target.files?.[0]
    const inputEl = e.target
    if (!file) return
    startTransition(async () => {
      try {
        if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("FILE_TOO_LARGE")
        if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
          throw new Error("UNSUPPORTED_TYPE")
        }

        let thumbnail: File | null = null
        if (file.type === "application/pdf") {
          thumbnail = await generatePdfThumbnail(file)
        }
        const thumbnailFormData = thumbnail
          ? (() => {
              const fd = new FormData()
              fd.set("thumbnail", thumbnail!)
              return fd
            })()
          : undefined

        try {
          const pathname = buildAttachmentPathname(`${projectId}/tasks/${taskId}`, file.name)
          const blob = await uploadFileToBlob(pathname, file, { projectId, taskId })
          await uploadTaskAttachmentFromBlob(
            taskId,
            projectId,
            {
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              blobUrl: blob.url,
              pathname,
            },
            thumbnailFormData,
            versionOf
          )
        } catch (directErr) {
          // The fallback below sends the file through a Server Action body,
          // which Vercel hard-caps at 4.5MB regardless of app config — past
          // that, retrying would just fail again with a more confusing
          // error, so only attempt it for files small enough to fit.
          if (file.size > SAFE_BODY_UPLOAD_LIMIT) {
            throw directErr instanceof Error ? directErr : new Error("UPLOAD_FAILED")
          }
          const formData = new FormData()
          formData.set("file", file)
          if (thumbnail) formData.set("thumbnail", thumbnail)
          if (versionOf) formData.set("versionOf", versionOf)
          await uploadTaskAttachment(taskId, projectId, formData)
        }

        toast.success(versionOf ? "新版本已上傳" : "附件已上傳")
      } catch (err) {
        const message =
          err instanceof Error ? UPLOAD_ERROR_MESSAGES[err.message] : undefined
        toast.error(message ?? "上傳失敗")
      } finally {
        inputEl.value = ""
      }
    })
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      try {
        await deleteTaskAttachment(attachmentId, projectId)
        toast.success("附件已刪除")
      } catch {
        toast.error("刪除失敗")
      }
    })
  }

  function handleToggleCover(attachmentId: string, isCurrentCover: boolean) {
    startTransition(async () => {
      try {
        await setProjectCoverAttachment(projectId, isCurrentCover ? null : attachmentId)
        toast.success(isCurrentCover ? "已取消封面圖" : "已設為封面圖")
      } catch {
        toast.error("設定失敗")
      }
    })
  }

  if (attachments.length === 0 && !canEdit) return null

  const groups = groupByVersion(attachments)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {groups.map((versions) => {
        const attachment = versions[0]
        const history = versions.slice(1)
        const isImage = attachment.mimeType.startsWith("image/")
        const fileUrl = `/api/attachments/${attachment.id}`
        const previewUrl = isImage
          ? fileUrl
          : attachment.thumbnailStorageKey
            ? `${fileUrl}?thumbnail=1`
            : null
        const canDelete = manageable || attachment.uploader.id === currentUserId
        const isCover = attachment.id === coverAttachmentId
        const canPickCover = manageable && !!previewUrl

        return (
          <div key={attachment.id} className="group relative">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={attachment.filename}
              className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border bg-muted ${
                isCover ? "ring-2 ring-primary" : ""
              }`}
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
            {canPickCover && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggleCover(attachment.id, isCover)}
                title={isCover ? "取消設為封面圖" : "設為封面圖"}
                className={`absolute -top-1.5 -left-1.5 rounded-full bg-background p-0.5 shadow transition-opacity hover:text-primary ${
                  isCover
                    ? "text-primary opacity-100"
                    : "text-muted-foreground opacity-0 group-hover:opacity-100"
                }`}
              >
                <Star className="h-3 w-3" fill={isCover ? "currentColor" : "none"} />
              </button>
            )}
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
            {history.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      title={`還有 ${history.length} 個較早版本`}
                      className="absolute -bottom-1.5 -left-1.5 rounded-full border bg-background px-1 py-0.5 text-[9px] font-medium leading-none text-muted-foreground shadow hover:text-foreground"
                    >
                      <History className="h-2.5 w-2.5" />
                    </button>
                  }
                />
                <DropdownMenuContent align="start">
                  <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
                    版本歷程（新到舊）
                  </div>
                  <DropdownMenuItem
                    onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
                  >
                    <span className="truncate">
                      目前版本 ・ {new Date(attachment.createdAt).toLocaleString("zh-TW")} ・{" "}
                      {attachment.uploader.name}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {history.map((version) => (
                    <DropdownMenuItem
                      key={version.id}
                      onClick={() =>
                        window.open(
                          `/api/attachments/${version.id}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <span className="truncate text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString("zh-TW")} ・{" "}
                        {version.uploader.name}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canEdit && (
              <label
                title="上傳新版本"
                className="absolute -bottom-1.5 -right-1.5 flex cursor-pointer items-center justify-center rounded-full bg-background p-0.5 text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-primary"
              >
                <RotateCw className="h-3 w-3" />
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, attachment.id)}
                  disabled={isPending}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden"
                />
              </label>
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
            onChange={(e) => handleFileChange(e)}
            disabled={isPending}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
