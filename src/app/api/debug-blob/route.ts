// Temporary diagnostic route — remove after debugging attachment uploads.
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function GET() {
  const info: Record<string, unknown> = {
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 12) ?? null,
    nodeVersion: process.version,
  }

  try {
    const blob = await put("debug/test.txt", Buffer.from("hello"), {
      access: "public",
      addRandomSuffix: false,
    })
    info.success = true
    info.url = blob.url
  } catch (err) {
    info.success = false
    info.errorName = err instanceof Error ? err.name : typeof err
    info.errorMessage = err instanceof Error ? err.message : String(err)
    info.errorStack = err instanceof Error ? err.stack : undefined
  }

  return NextResponse.json(info)
}
