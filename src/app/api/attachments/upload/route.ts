import { NextResponse } from "next/server"
import { issueSignedToken } from "@vercel/blob"
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client"
import { auth } from "@/auth"
import { getEffectiveProjectRole } from "@/lib/permissions"
import { MAX_ATTACHMENT_SIZE, ALLOWED_ATTACHMENT_TYPES } from "@/lib/attachment-constants"

type ClientPayload = {
  projectId: string
  taskId?: string
}

// Issues short-lived, scoped presigned upload URLs so the browser can send
// file bytes straight to Blob storage instead of through a Server Action —
// Vercel's serverless platform enforces a request-body ceiling on Server
// Actions well under what large Office files need, regardless of app config.
//
// This uses the presigned-URL flow (handleUploadPresigned/issueSignedToken)
// rather than the classic handleUpload/generateClientTokenFromReadWriteToken
// flow, because this project's Blob store is connected via OIDC and has no
// BLOB_READ_WRITE_TOKEN — the classic flow requires that static token to
// sign client tokens, while the presigned flow works with OIDC and verifies
// its own upload-completed callback with BLOB_WEBHOOK_PUBLIC_KEY instead
// (already present here).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayloadRaw) => {
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

        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: [...ALLOWED_ATTACHMENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
          validUntil: Date.now() + 60 * 60 * 1000, // 1 hour
        })

        return {
          token,
          urlOptions: {
            allowedContentTypes: [...ALLOWED_ATTACHMENT_TYPES],
            maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
            addRandomSuffix: false,
          },
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
