"use client"

import { upload } from "@vercel/blob/client"

// Keeps storage keys readable/traceable in the Blob dashboard, matching the
// convention the old server-side upload path used.
export function buildAttachmentPathname(prefix: string, filename: string) {
  const safeName = filename.replace(/[^\w.\-一-鿿]+/g, "_")
  return `${prefix}/${crypto.randomUUID()}-${safeName}`
}

// Vercel Blob recommends splitting larger uploads into parallel,
// individually-retried parts rather than one long single request — a
// single slow/flaky connection is more likely to drop a multi-MB upload
// outright than a smaller one, which is exactly the failure this is meant
// to reduce.
const MULTIPART_THRESHOLD = 6 * 1024 * 1024 // 6MB

export function uploadFileToBlob(
  pathname: string,
  file: File,
  clientPayload: { projectId: string; taskId?: string }
) {
  return upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/attachments/upload",
    clientPayload: JSON.stringify(clientPayload),
    multipart: file.size > MULTIPART_THRESHOLD,
  })
}
