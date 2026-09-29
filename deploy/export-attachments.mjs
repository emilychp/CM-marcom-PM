// One-time migration helper: downloads every file currently in this
// project's Vercel Blob store into ./deploy/attachments-export/<pathname>,
// preserving the same relative path Blob used — which is exactly what the
// self-hosted app expects under its local uploads/ folder (see
// src/lib/attachment-storage.ts). Also writes manifest.json summarizing
// what was pulled, for a sanity check against the source count.
//
// Usage (from the repo root, with a Vercel CLI session that can reach this
// project — either `vercel env pull` once first, or already logged in):
//   node deploy/export-attachments.mjs
//
// Needs VERCEL_OIDC_TOKEN and BLOB_STORE_ID in the environment. The
// easiest way to get both: `vercel env pull .env.local` in the repo root,
// then `export $(grep -E '^(VERCEL_OIDC_TOKEN|BLOB_STORE_ID)=' .env.local | xargs)`
// before running this script. VERCEL_OIDC_TOKEN is short-lived — re-pull
// if this script reports an auth error partway through.
import { list, get } from "@vercel/blob"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const OUT_DIR = path.join(import.meta.dirname, "attachments-export")

async function main() {
  let cursor
  let count = 0
  let totalBytes = 0
  const manifest = []

  do {
    const res = await list({ cursor, limit: 1000 })
    for (const blob of res.blobs) {
      const destPath = path.join(OUT_DIR, blob.pathname)
      await mkdir(path.dirname(destPath), { recursive: true })
      let buffer
      try {
        const result = await get(blob.url, { access: "private" })
        buffer = Buffer.from(await new Response(result.stream).arrayBuffer())
      } catch (err) {
        console.error(`FAILED: ${blob.pathname} — ${err.message}`)
        continue
      }
      await writeFile(destPath, buffer)
      manifest.push({ pathname: blob.pathname, size: blob.size })
      count++
      totalBytes += blob.size
      if (count % 20 === 0) console.log(`...${count} files so far`)
    }
    cursor = res.cursor
  } while (cursor)

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ count, totalBytes, files: manifest }, null, 2)
  )

  console.log(`Done: ${count} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB, in ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
