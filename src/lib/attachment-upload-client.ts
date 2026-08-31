"use client"

import { upload } from "@vercel/blob/client"

// Keeps storage keys readable/traceable in the Blob dashboard, matching the
// convention the old server-side upload path used.
export function buildAttachmentPathname(prefix: string, filename: string) {
  const safeName = filename.replace(/[^\w.\-一-鿿]+/g, "_")
  return `${prefix}/${crypto.randomUUID()}-${safeName}`
}

export function uploadFileToBlob(
  pathname: string,
  file: File,
  clientPayload: { projectId: string; taskId?: string }
) {
  return upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/attachments/upload",
    clientPayload: JSON.stringify(clientPayload),
  })
}
