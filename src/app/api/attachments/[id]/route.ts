import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveProjectRole } from "@/lib/permissions"
import { readAttachmentFile } from "@/lib/attachment-storage"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const role = await getEffectiveProjectRole(
    session.user.id,
    session.user.globalRole,
    attachment.projectId
  )
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const buffer = await readAttachmentFile(attachment.storageKey)
    const isPreviewable = attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf"
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `${isPreviewable ? "inline" : "attachment"}; filename="${encodeURIComponent(attachment.filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 })
  }
}
