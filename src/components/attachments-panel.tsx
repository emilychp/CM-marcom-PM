"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  File as FileIcon,
  Upload,
  X,
  Star,
} from "lucide-react"
import {
  uploadAttachment,
  uploadAttachmentFromBlob,
  deleteAttachment,
  setProjectCoverAttachment,
} from "@/app/projects/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { formatFileSize } from "@/lib/format"
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
  size: number
  createdAt: Date
  thumbnailStorageKey: string | null
  uploader: { id: string; name: string }
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  NO_FILE: "請先選擇檔案",
  FILE_TOO_LARGE: "檔案超過 25MB 上限",
  UNSUPPORTED_TYPE: "不支援的檔案格式",
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf" || mimeType === "text/plain")
    return <FileText className="h-8 w-8 text-muted-foreground" />
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv")
    return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
  if (mimeType === "application/zip")
    return <FileArchive className="h-8 w-8 text-muted-foreground" />
  if (mimeType.includes("presentation") || mimeType === "application/vnd.ms-powerpoint")
    return <Presentation className="h-8 w-8 text-muted-foreground" />
  return <FileIcon className="h-8 w-8 text-muted-foreground" />
}

export function AttachmentsPanel({
  projectId,
  attachments,
  currentUserId,
  manageable,
  isMember,
  coverAttachmentId,
}: {
  projectId: string
  attachments: Attachment[]
  currentUserId: string
  manageable: boolean
  isMember: boolean
  coverAttachmentId: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  function handleUpload() {
    if (!selectedFile) return
    startTransition(async () => {
      try {
        if (selectedFile.size > MAX_ATTACHMENT_SIZE) throw new Error("FILE_TOO_LARGE")
        if (!ALLOWED_ATTACHMENT_TYPES.includes(selectedFile.type)) {
          throw new Error("UNSUPPORTED_TYPE")
        }

        let thumbnail: File | null = null
        if (selectedFile.type === "application/pdf") {
          thumbnail = await generatePdfThumbnail(selectedFile)
        }
        const thumbnailFormData = thumbnail
          ? (() => {
              const fd = new FormData()
              fd.set("thumbnail", thumbnail!)
              return fd
            })()
          : undefined

        try {
          // Uploads go straight from the browser to Blob storage — sending
          // large files through the Server Action itself hits Vercel's
          // platform-level request body ceiling regardless of app config.
          const pathname = buildAttachmentPathname(projectId, selectedFile.name)
          const blob = await uploadFileToBlob(pathname, selectedFile, { projectId })
          await uploadAttachmentFromBlob(
            projectId,
            {
              filename: selectedFile.name,
              mimeType: selectedFile.type,
              size: selectedFile.size,
              blobUrl: blob.url,
              pathname,
            },
            thumbnailFormData
          )
        } catch (directErr) {
          // Only fall back to the legacy body-based path (the only option
          // in local dev, with no Blob store connected) when the file is
          // small enough to actually fit under Vercel's hard 4.5MB request
          // body ceiling — above that, retrying would just fail again with
          // a more confusing error.
          if (selectedFile.size > SAFE_BODY_UPLOAD_LIMIT) {
            throw directErr instanceof Error ? directErr : new Error("UPLOAD_FAILED")
          }
          const formData = new FormData()
          formData.set("file", selectedFile)
          if (thumbnail) formData.set("thumbnail", thumbnail)
          await uploadAttachment(projectId, formData)
        }

        toast.success("附件已上傳")
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      } catch (err) {
        const message =
          err instanceof Error ? UPLOAD_ERROR_MESSAGES[err.message] : undefined
        if (!message) console.error("附件上傳失敗", err)
        toast.error(message ?? "上傳失敗")
      }
    })
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      try {
        await deleteAttachment(attachmentId, projectId)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>附件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMember && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isPending}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={!selectedFile || isPending}
            >
              <Upload className="mr-1 h-4 w-4" />
              {isPending ? "上傳中..." : "上傳"}
            </Button>
          </div>
        )}

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無附件</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {attachments.map((attachment) => {
              const canDelete =
                manageable || attachment.uploader.id === currentUserId
              const isImage = attachment.mimeType.startsWith("image/")
              const fileUrl = `/api/attachments/${attachment.id}`
              const previewUrl = isImage
                ? fileUrl
                : attachment.thumbnailStorageKey
                  ? `${fileUrl}?thumbnail=1`
                  : null
              const isCover = attachment.id === coverAttachmentId
              const canPickCover = manageable && !!previewUrl

              return (
                <div
                  key={attachment.id}
                  className={`group relative overflow-hidden rounded-lg border ${
                    isCover ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex aspect-square items-center justify-center bg-muted">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={attachment.filename}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileTypeIcon mimeType={attachment.mimeType} />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium">
                        {attachment.filename}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatFileSize(attachment.size)} ・ {attachment.uploader.name}
                      </p>
                    </div>
                  </a>
                  {isCover && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      封面圖
                    </span>
                  )}
                  {canPickCover && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleCover(attachment.id, isCover)}
                      title={isCover ? "取消設為封面圖" : "設為封面圖"}
                      className={`absolute top-1.5 left-1.5 rounded-full bg-background/90 p-1 shadow transition-opacity hover:text-primary ${
                        isCover
                          ? "text-primary opacity-100"
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" fill={isCover ? "currentColor" : "none"} />
                    </button>
                  )}
                  {canDelete && (
                    <ConfirmDeleteDialog
                      trigger={
                        <button
                          type="button"
                          disabled={isPending}
                          className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1 text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
