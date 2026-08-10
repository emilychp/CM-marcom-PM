import JSZip from "jszip"

export const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

const THUMBNAIL_CANDIDATES = [
  "docProps/thumbnail.jpeg",
  "docProps/thumbnail.jpg",
  "docProps/thumbnail.png",
]

// PowerPoint embeds a preview image inside the .pptx (a zip archive) when
// "Save thumbnail" was on at save time — usually the default. Older binary
// .ppt files and .pptx files saved without that option have no thumbnail
// to extract, so callers must fall back to a generic icon.
export async function extractPptxThumbnail(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (mimeType !== PPTX_MIME_TYPE) return null

  try {
    const zip = await JSZip.loadAsync(buffer)
    for (const path of THUMBNAIL_CANDIDATES) {
      const entry = zip.file(path)
      if (!entry) continue
      const data = await entry.async("nodebuffer")
      const mime = path.endsWith(".png") ? "image/png" : "image/jpeg"
      return { buffer: data, mimeType: mime }
    }
    return null
  } catch {
    return null
  }
}
