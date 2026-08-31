// Shared between server (actions, upload API route) and client (upload
// components) so the limit and allow-list can't drift between the two.
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB

// Vercel's serverless functions hard-cap request bodies at 4.5MB — an
// infra-level limit no app config can raise. Attachments upload directly
// to Blob storage to route around that entirely, but if that direct
// upload fails for any reason, the client falls back to sending the file
// through a Server Action instead (this is also the only path available
// in local dev, which has no Blob store connected). That fallback only
// stands a chance below this ceiling; above it, retrying would just
// reproduce the exact same platform-level failure with a more confusing
// error, so callers should give up and surface the original error instead.
export const SAFE_BODY_UPLOAD_LIMIT = 4 * 1024 * 1024 // 4MB, with headroom under the 4.5MB hard cap

export const ALLOWED_ATTACHMENT_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
]
