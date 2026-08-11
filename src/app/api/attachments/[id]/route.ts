import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { readAttachmentFile } from "@/lib/attachment-storage"

export async function GET(
  req: Request,
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

  // Any account holder can view/download attachments — project pages are
  // fully readable by everyone now, so downloads must match.

  const wantsThumbnail = new URL(req.url).searchParams.has("thumbnail")
  if (wantsThumbnail && !attachment.thumbnailStorageKey) {
    return NextResponse.json({ error: "No thumbnail" }, { status: 404 })
  }

  try {
    if (wantsThumbnail) {
      const buffer = await readAttachmentFile(attachment.thumbnailStorageKey!)
      const mimeType = attachment.thumbnailStorageKey!.endsWith(".png")
        ? "image/png"
        : "image/jpeg"
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "private, max-age=3600",
        },
      })
    }

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
