import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { auth } from "@/auth"
import { getEffectiveProjectRole } from "@/lib/permissions"
import { MAX_ATTACHMENT_SIZE, ALLOWED_ATTACHMENT_TYPES } from "@/lib/attachment-constants"

type ClientPayload = {
  projectId: string
  taskId?: string
}

// Issues short-lived, scoped Blob upload tokens so the browser can send file
// bytes straight to Blob storage instead of through a Server Action — Vercel's
// serverless platform enforces a request-body ceiling on Server Actions well
// under what large Office files need, regardless of the app-level config.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayloadRaw) => {
        const session = await auth()
        if (!session?.user) throw new Error("UNAUTHORIZED")

        const payload = clientPayloadRaw
          ? (JSON.parse(clientPayloadRaw) as ClientPayload)
          : null
        if (!payload?.projectId) throw new Error("INVALID_PAYLOAD")

        const role = await getEffectiveProjectRole(
          session.user.id,
          session.user.globalRole,
          payload.projectId
        )
        // Any project member can upload here, whether the attachment is at
        // the project level, a meeting note, or any task in the workflow —
        // task attachments are no longer restricted to the task's assignee.
        if (!role) throw new Error("FORBIDDEN")

        return {
          allowedContentTypes: [...ALLOWED_ATTACHMENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
          addRandomSuffix: false,
        }
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op: the client creates the Attachment DB row
        // itself right after upload() resolves (see uploadAttachmentFromBlob
        // and friends in projects/actions.ts). Relying on this callback isn't
        // safe — Vercel can't reach it on localhost or some preview URLs.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    )
  }
}
