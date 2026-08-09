// Client-only: renders a PDF's first page to a small PNG thumbnail before
// upload, since there's no reliable way to rasterize a PDF on Vercel's
// serverless functions without a native canvas binary.
export async function generatePdfThumbnail(file: File): Promise<File | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    const page = await pdf.getPage(1)

    const targetWidth = 300
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = targetWidth / baseViewport.width
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const context = canvas.getContext("2d")
    if (!context) return null

    await page.render({ canvasContext: context, viewport, canvas }).promise

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    )
    if (!blob) return null

    return new File([blob], "thumbnail.png", { type: "image/png" })
  } catch {
    return null
  }
}
