import { mkdir, writeFile, readFile, unlink } from "node:fs/promises"
import path from "node:path"
import { put, del } from "@vercel/blob"

const UPLOAD_ROOT = path.join(process.cwd(), "uploads")

// In production (Vercel), the filesystem is ephemeral/read-only, so
// attachments are stored in Vercel Blob instead. Locally, without a
// blob token configured, we fall back to a plain uploads/ directory.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

function isRemoteKey(storageKey: string) {
  return /^https?:\/\//.test(storageKey)
}

/** Returns the storageKey to persist on the Attachment record. */
export async function saveAttachmentFile(
  storageKey: string,
  buffer: Buffer
): Promise<string> {
  if (useBlob) {
    const blob = await put(storageKey, buffer, {
      access: "public",
      addRandomSuffix: false,
    })
    return blob.url
  }

  const fullPath = path.join(UPLOAD_ROOT, storageKey)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, buffer)
  return storageKey
}

export async function readAttachmentFile(storageKey: string): Promise<Buffer> {
  if (isRemoteKey(storageKey)) {
    const res = await fetch(storageKey)
    if (!res.ok) throw new Error("Failed to fetch attachment from blob storage")
    return Buffer.from(await res.arrayBuffer())
  }
  return readFile(path.join(UPLOAD_ROOT, storageKey))
}

export async function deleteAttachmentFile(storageKey: string) {
  if (isRemoteKey(storageKey)) {
    try {
      await del(storageKey)
    } catch {
      // already gone; ignore
    }
    return
  }
  try {
    await unlink(path.join(UPLOAD_ROOT, storageKey))
  } catch {
    // file may already be gone; ignore
  }
}
