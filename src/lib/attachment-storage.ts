import { mkdir, writeFile, readFile, unlink } from "node:fs/promises"
import path from "node:path"
import { put, get, del } from "@vercel/blob"

const UPLOAD_ROOT = path.join(process.cwd(), "uploads")

// In production (Vercel), the filesystem is ephemeral/read-only, so
// attachments are stored in Vercel Blob instead. Locally, there's no
// Blob store connected, so we fall back to a plain uploads/ directory.
// `VERCEL` is set on every Vercel deployment (build and runtime); the
// Blob SDK authenticates automatically via OIDC/system env vars once a
// store is connected to the project, so we don't need to check for a
// specific token var.
const useBlob = process.env.VERCEL === "1"

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
      access: "private",
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
    const result = await get(storageKey, { access: "private" })
    if (!result?.stream) throw new Error("Attachment not found in blob storage")
    return Buffer.from(await new Response(result.stream).arrayBuffer())
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
