"use client"

import { uploadPresigned } from "@vercel/blob/client"

// Keeps storage keys readable/traceable in the Blob dashboard, matching the
// convention the old server-side upload path used.
export function buildAttachmentPathname(prefix: string, filename: string) {
  const safeName = filename.replace(/[^\w.\-一-鿿]+/g, "_")
  return `${prefix}/${crypto.randomUUID()}-${safeName}`
}

// Presigned uploads, not the classic client-token flow (upload()/
// handleUpload) — this project's Blob store is connected via OIDC with no
// BLOB_READ_WRITE_TOKEN, which the classic flow requires to sign client
// tokens. uploadPresigned() works with OIDC on the server side instead
// (see src/app/api/attachments/upload/route.ts).
export function uploadFileToBlob(
  pathname: string,
  file: File,
  clientPayload: { projectId: string; taskId?: string }
) {
  return uploadPresigned(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/attachments/upload",
    clientPayload: JSON.stringify(clientPayload),
  })
}
